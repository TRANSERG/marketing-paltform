import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const field_key = formData.get("field_key") as string | null;
  const file = formData.get("file") as File | null;
  const files = formData.getAll("files") as File[];

  if (!field_key?.trim()) {
    return NextResponse.json(
      { error: "field_key is required" },
      { status: 400 }
    );
  }

  const toUpload = file ? [file] : files.length ? files : [];
  if (toUpload.length === 0) {
    return NextResponse.json(
      { error: "file or files is required" },
      { status: 400 }
    );
  }

  const paths: string[] = [];
  const safeKey = field_key.replace(/[^a-z0-9_]/gi, "_").slice(0, 64);

  for (const f of toUpload) {
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${f.name} exceeds 50MB limit` },
        { status: 400 }
      );
    }
    if (ALLOWED_TYPES.length && !ALLOWED_TYPES.includes(f.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${f.type}` },
        { status: 400 }
      );
    }
    const ext = f.name.split(".").pop() || "";
    const safeName = `${crypto.randomUUID()}-${f.name.slice(0, 80).replace(/[^a-zA-Z0-9._-]/g, "_")}${ext ? "." + ext : ""}`;
    const path = `${taskId}/${safeKey}/${safeName}`;
    const { error } = await supabase.storage
      .from("task-attachments")
      .upload(path, f, { upsert: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    paths.push(path);
  }

  return NextResponse.json({ paths });
}
