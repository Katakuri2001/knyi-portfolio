import "server-only";

import fs from "node:fs";
import path from "node:path";
import { storageBinding } from "@/lib/db/adapter.ts";

/**
 * Uploaded-image storage.
 *
 * Files are stored in `public/uploads/` on a Node host and in an R2 bucket on
 * Cloudflare Workers. The public URL is the same either way — `/api/uploads/<name>` —
 * so nothing above this module has to know which one it is.
 *
 * The trade-off is that this requires a **writable** filesystem on a Node host.
 * It does not work on read-only serverless hosting, which is why the Worker
 * path uses R2 instead.
 *
 * When the project moves to Cloudflare Workers + D1 (the stage documented in
 * `docs/superpowers/specs/`), only this file and the two upload routes need to
 * change; the JSON contract and every component stay the same.
 */

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

const ACCEPTED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** The bucket name inside R2. */
const R2_PREFIX = "uploads";

export class UploadError extends Error {}

export function publicPathFor(id: string, extension: string): string {
  return `/api/uploads/${id}.${extension}`;
}

/** The key inside the bucket, or the filename inside the local directory. */
function storageKey(name: string): string {
  return `${R2_PREFIX}/${name}`;
}

export function contentTypeFor(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

/**
 * Validates and writes one uploaded image. The stored filename is generated —
 * the client's filename is never used, so a crafted name cannot traverse out of
 * the uploads directory or overwrite an existing file.
 */
export async function saveUpload(file: File): Promise<{
  path: string;
  width: number | null;
  height: number | null;
  bytes: number;
}> {
  const extension = ACCEPTED[file.type];
  if (!extension) {
    throw new UploadError("Only JPG, PNG, WebP or AVIF images are accepted.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("Images must be 6 MB or smaller.");
  }

  if (file.size === 0) {
    throw new UploadError("That file is empty.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { width, height } = imageDimensions(buffer);

  // A file that declares an image mime type but is not one is rejected rather
  // than written and left to fail in the browser.
  if (width === null || height === null) {
    throw new UploadError("That file does not look like a valid image.");
  }

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const name = `${id}.${extension}`;

  const binding = storageBinding();
  if (binding?.UPLOADS) {
    await binding.UPLOADS.put(storageKey(name), buffer, {
      httpMetadata: { contentType: file.type },
    });
  } else {
    const directory = path.join(process.cwd(), "public", R2_PREFIX);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, name), buffer);
  }

  return { path: publicPathFor(id, extension), width, height, bytes: buffer.length };
}

/** Reads a stored image. Returns null when it is not there. */
export async function readUpload(
  name: string
): Promise<{ body: ArrayBuffer | Uint8Array; contentType: string } | null> {
  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/i.test(name)) return null;

  const binding = storageBinding();
  if (binding?.UPLOADS) {
    const object = await binding.UPLOADS.get(storageKey(name));
    if (!object) return null;
    return {
      body: await object.arrayBuffer(),
      contentType:
        object.httpMetadata?.contentType ?? contentTypeFor(name),
    };
  }

  const file = path.join(process.cwd(), "public", R2_PREFIX, name);
  if (!fs.existsSync(file)) return null;
  return {
    body: fs.readFileSync(file),
    contentType: contentTypeFor(name),
  };
}

export async function removeUpload(
  publicPath: string | null | undefined
): Promise<void> {
  if (!publicPath) return;
  const name = publicPath.replace(/^\/api\/uploads\//, "");
  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/i.test(name)) return;

  const binding = storageBinding();
  if (binding?.UPLOADS) {
    await binding.UPLOADS.delete(storageKey(name)).catch(() => undefined);
    return;
  }

  const file = path.join(process.cwd(), "public", R2_PREFIX, name);
  if (!file.startsWith(path.join(process.cwd(), "public", R2_PREFIX))) return;
  fs.rm(file, { force: true }, () => {});
}

/**
 * Reads pixel dimensions straight from the file header.
 *
 * Done by hand rather than with a dependency: it is thirty lines, it keeps the
 * runtime dependency count at zero, and all it needs to do is prevent layout
 * shift by giving the page a real aspect ratio before the image decodes.
 */
export function imageDimensions(buffer: Buffer): {
  width: number | null;
  height: number | null;
} {
  // PNG — IHDR is always the first chunk.
  if (
    buffer.length > 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // WebP — RIFF container with one of three chunk layouts.
  if (
    buffer.length > 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    if (chunk === "VP8X") {
      const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      return { width, height };
    }
  }

  // JPEG — walk the marker segments to the first frame header.
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF0–SOF3, SOF5–SOF7, SOF9–SOF11, SOF13–SOF15 carry the dimensions.
      const isFrameHeader =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isFrameHeader) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) break;
      offset += 2 + segmentLength;
    }
  }

  return { width: null, height: null };
}
