import fs from "node:fs";
import path from "node:path";

/**
 * Uploaded-image storage.
 *
 * Files land in `public/uploads/` on disk but are **served from
 * `/api/uploads/<name>`**, not from `/uploads/<name>`. That indirection is
 * deliberate and was found the hard way: `next start` snapshots the `public/`
 * directory at build time, so a file written after the build is not served
 * (verified: a freshly uploaded PNG 404s from `/uploads/...`). A route handler
 * always reads from disk, so an upload appears immediately.
 *
 * This is also deliberately filesystem-backed rather than a blob store or a
 * database:
 *
 *   - the project has no database and no object-storage dependency, and the
 *     brief for this stage forbids adding runtime packages;
 *   - the whole content layer is already JSON files on disk, so images living
 *     on disk is consistent rather than novel.
 *
 * The trade-off is that this requires a **writable** filesystem. It works on a
 * VPS, a home server, or `next start` locally. It does not work on a read-only
 * serverless filesystem — when this site moves to Cloudflare Workers/D1 (the
 * stage documented in `docs/superpowers/specs/`), only this file and the two
 * upload routes need to change; the JSON contract stays the same.
 */

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Public URL prefix for stored uploads. */
export const UPLOAD_URL_PREFIX = "/api/uploads";

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

const ACCEPTED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class UploadError extends Error {}

export function publicPathFor(id: string, extension: string): string {
  return `${UPLOAD_URL_PREFIX}/${id}.${extension}`;
}

/** The filename on disk, derived from a public path. */
export function filenameFromPublicPath(publicPath: string): string | null {
  if (!publicPath.startsWith(`${UPLOAD_URL_PREFIX}/`)) return null;
  const name = publicPath.slice(UPLOAD_URL_PREFIX.length + 1);
  return /^[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/i.test(name) ? name : null;
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

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const destination = path.join(UPLOAD_DIR, `${id}.${extension}`);
  fs.writeFileSync(destination, buffer);

  return { path: publicPathFor(id, extension), width, height, bytes: buffer.length };
}

export function removeUpload(publicPath: string | null | undefined) {
  if (!publicPath) return;
  const filename = filenameFromPublicPath(publicPath);
  if (!filename) return;
  const file = path.join(UPLOAD_DIR, filename);
  // Guard against a stored path that somehow escaped the uploads directory.
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return;
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
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) break;
      offset += 2 + segmentLength;
    }
  }

  return { width: null, height: null };
}