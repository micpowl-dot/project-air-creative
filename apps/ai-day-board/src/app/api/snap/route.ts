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

  let image: string, userId: string, name: string;
  try {
    ({ image, userId, name } = await request.json());
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
  // Carry the user id in the FILENAME (machine-readable, the cron parses it)
  // rather than the visible message, so humans never see a raw "ref:Uxxxx".
  const filename = `snap-${Date.now()}${userId ? `-${userId}` : ""}.${ext}`;

  // Post the raw selfie QUIETLY — show the person's name (no @mention, so no
  // ping about the unprocessed upload). The cron posts the *finished* portrait
  // back with the real @mention.
  const who = name && name.trim() ? name.trim() : "Someone";
  const comment = `📸 ${who} using the AI Day Me app`;

  try {
    // Slack's new 3-step upload flow (files.upload was deprecated).
    // 1) get an upload URL
    const getUrl = await fetch("https://slack.com/api/files.getUploadURLExternal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ filename, length: String(buf.length) }),
    });
    const up = await getUrl.json();
    if (!up.ok) throw new Error(`getUploadURL: ${up.error}`);

    // 2) PUT the bytes to that URL
    const put = await fetch(up.upload_url, { method: "POST", body: new Blob([buf], { type: mimeType }) });
    if (!put.ok) throw new Error(`upload PUT failed (${put.status})`);

    // 3) complete + share to the channel
    const complete = await fetch("https://slack.com/api/files.completeUploadExternal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        files: [{ id: up.file_id, title: "AI Day selfie" }],
        channel_id: channel,
        initial_comment: comment,
      }),
    });
    const done = await complete.json();
    if (!done.ok) throw new Error(`complete: ${done.error}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[snap] Slack upload error:", String(e));
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
