import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import {
  badRequest,
  cleanString,
  forbidden,
  isAdminRequest,
  isSameOrigin,
  readJson,
  serverError,
  unauthorized,
} from "@/lib/admin-api";
import { readJson as readContent, writeJson } from "@/lib/content";
import type { Profile } from "@/lib/content";

/**
 * /api/admin/profile — the owner's details and contact information.
 *
 * `content/profile.json` is a **single object**, so this route replaces it
 * rather than appending to it. (The older `/api/content/profile` route
 * treated it as an array and could never write — see
 * `docs/STAGE-5-ADMIN-CONSOLE-BACKLOG.md`.)
 *
 * The content layer reads this file at render time, so a saved change appears
 * on the public site at the next revalidation.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = {
  name: 120,
  tagline: 160,
  positioning: 240,
  background: 1200,
  howITick: 1200,
  whatIVALUE: 1200,
  location: 120,
  remoteAvailability: 120,
  email: 200,
  telegram: 120,
  phone: 60,
  website: 300,
};

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  return NextResponse.json(readContent<Profile>("profile.json"));
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const input = body as Record<string, unknown>;
  const current = readContent<Profile>("profile.json");
  const contactInput = (input.contact ?? {}) as Record<string, unknown>;

  const email = cleanString(contactInput.email, MAX.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return badRequest("That email address does not look right.", "email");
  }

  const phone = cleanString(contactInput.phone, MAX.phone);
  if (phone && !/^[+\d][\d\s()-]{4,}$/.test(phone)) {
    return badRequest("That phone number does not look right.", "phone");
  }

  const website = cleanString(contactInput.website, MAX.website);
  if (website && !/^https?:\/\/[^\s]+$/i.test(website)) {
    return badRequest(
      "The website must be an absolute http or https URL.",
      "website"
    );
  }

  const next: Profile = {
    name: cleanString(input.name, MAX.name) ?? current.name,
    professionalName:
      cleanString(input.professionalName, MAX.name) ?? current.professionalName,
    tagline: cleanString(input.tagline, MAX.tagline) ?? current.tagline,
    positioning:
      cleanString(input.positioning, MAX.positioning) ?? current.positioning,
    background: cleanString(input.background, MAX.background) ?? current.background,
    howITick: cleanString(input.howITick, MAX.howITick) ?? current.howITick,
    whatIVALUE:
      cleanString(input.whatIVALUE, MAX.whatIVALUE) ?? current.whatIVALUE,
    location: cleanString(input.location, MAX.location) ?? current.location,
    remoteAvailability:
      cleanString(input.remoteAvailability, MAX.remoteAvailability) ??
      current.remoteAvailability,
    contact: {
      email: email ?? current.contact.email,
      telegram: cleanString(contactInput.telegram, MAX.telegram) ?? current.contact.telegram,
      phone: phone ?? current.contact.phone,
      website: website ?? current.contact.website,
    },
  };

  try {
    writeJson("profile.json", next);
    // The public page reads the profile during its render, so it has to be
    // regenerated for the change to appear.
    revalidatePath("/");
    return NextResponse.json(next);
  } catch (error) {
    return serverError((error as Error).message);
  }
}
