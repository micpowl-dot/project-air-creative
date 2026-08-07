import { Snap } from "@/components/Snap";

export const metadata = { title: "AI Day Me 📸" };

// The booth's own fetches used to rely purely on the cookie the proxy issues for
// the pre-signed key. If a browser blocks cookies, the page loaded and then the
// name picker 401'd, which shows the very password box the pre-signed link exists
// to avoid. So the key is read here and carried on each request instead.
// Accepts both param names: `s` is the link in company comms, `k` is the QR on
// the office screens.
export default async function SnapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const s = one(sp.s);
  const k = one(sp.k);
  const key = s ? `?s=${encodeURIComponent(s)}` : k ? `?k=${encodeURIComponent(k)}` : "";
  return <Snap keyQuery={key} />;
}
