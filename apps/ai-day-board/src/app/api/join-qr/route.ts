// The QR code the monitors display, pointing at the photo booth.
//
// Rendered here on the server for one reason: the URL carries SNAP_TOKEN, and the
// previous version handed that URL to api.qrserver.com to draw. That would post
// the submission key to a third party on every wall rotation. Generating the PNG
// locally keeps the key on our own origin and out of the client bundle.
//
// This route sits behind the normal gate. The players reach it because they hold
// the display cookie; nobody else needs it.

import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = process.env.SNAP_TOKEN;
  const { origin } = new URL(request.url);

  // Without a token configured, fall back to the bare booth URL. The QR still
  // scans; the phone just meets whatever gate is active, same as before.
  const target = token
    ? `${origin}/snap?k=${encodeURIComponent(token)}`
    : `${origin}/snap`;

  const png = await QRCode.toBuffer(target, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0D142AFF", light: "#FFFFFFFF" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // Never cached: rotating SNAP_TOKEN must take effect on the next rotation
      // of the wall, not whenever a CDN entry happens to expire.
      "Cache-Control": "no-store",
    },
  });
}
