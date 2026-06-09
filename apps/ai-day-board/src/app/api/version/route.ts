// Returns the current deployment's unique id. The wall display polls this and
// reloads itself when the value changes — i.e. when a new version is deployed —
// so an unattended monitor picks up updates without a manual refresh.
export const dynamic = "force-dynamic";

export function GET() {
  const version =
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_URL ||
    "dev";
  return Response.json({ version });
}
