// /api/snap: receive a selfie from the /snap page and post it to the
// #ai-day-me Slack channel. The existing cron (/api/process-photos) picks
// it up within a minute and stylizes it onto the wall.
//
// Needs: WALL_SLACK_TOKEN + HEADSHOT_SLACK_CHANNEL (both already set).

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token   = process.env.WALL_SLACK_TOKEN;
  const channel = process.env.HEADSHOT_SLACK_CHANNEL;
  if (!token || !channel) {
    return NextResponse.json({ error: "Slack not configured" }, { status: 503 });
  }

  let image: string, handle: string;
  try {
    ({ image, handle } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // image is a data URL (data:image/jpeg;base64,...).
  const [meta, b64] = image.split(",");
  if (!b64) return NextResponse.json({ error: "Bad image data" }, { status: 400 });
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mimeType = mimeMatch?.[1] || "image/jpeg";
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const buf = Buffer.from(b64, "base64");
  const filename = `snap-${Date.now()}.${ext}`;

  // Upload file to Slack.
  const form = new FormData();
  form.append("channels", channel);
  form.append("filename", filename);
  if (handle && handle.trim().length > 1) {
    form.append("initial_comment", `${handle.trim()} just snapped a selfie at the AI Day photo station 📸`);
  }
  form.append("file", new Blob([buf], { type: mimeType }), filename);

  const res = await fetch("https://slack.com/api/files.upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json();
  if (!body.ok) {
    console.error("[snap] Slack upload error:", body.error);
    return NextResponse.json({ error: body.error || "Slack upload failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
