import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const checkAuth = (request: NextRequest) => {
  const cookie = request.cookies.get("admin_session");
  return cookie && cookie.value === "authenticated";
};

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = path.join(process.cwd(), "content", "case-studies.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const filePath = path.join(process.cwd(), "content", "case-studies.json");
    const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    
    const item = { ...body, id: body.id || `c${Date.now()}` };
    const updated = [...existing, item];
    
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    const filePath = path.join(process.cwd(), "content", "case-studies.json");
    const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const updated = existing.map((item: { id: string }) =>
      item.id === id ? { ...item, ...body } : item
    );

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const filePath = path.join(process.cwd(), "content", "case-studies.json");
    const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const updated = existing.filter((item: { id: string }) => item.id !== id);

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
