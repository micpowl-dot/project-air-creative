// The one implementation of "DM someone their finished portrait".
//
// Extracted so the render cron and the catch-up sweep cannot drift apart. Two
// copies of nearly-identical send logic, each with its own idea of who counts as
// already-sent, is what left five people on the wall with nothing in their DMs
// after the 2026-08-06 all-company post.

const WALL_URL = "https://ai-day-board.vercel.weather.com/wall";

/**
 * Send the portrait. Returns true ONLY if Slack confirmed the message.
 *
 * The caller must not record a send unless this returns true. The previous
 * version swallowed failures and returned nothing, so a failed DM was recorded as
 * delivered and the person never heard anything again.
 */
export async function dmPortrait(userId: string, imageUrl: string, token: string): Promise<boolean> {
  try {
    const open = await fetch("https://slack.com/api/conversations.open", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ users: userId }),
    });
    const oj = await open.json();
    const dm = oj.ok ? oj.channel?.id : null;
    if (!dm) return false;

    const posted = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: dm,
        text: `You're on the AI Day wall! ✨ Here's your illustrated portrait — see it live with everyone else's at ${WALL_URL}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*You're on the AI Day wall!* ✨\nHere's your illustrated portrait — watch it cycle with everyone else's at <${WALL_URL}|the live wall>.`,
            },
          },
          { type: "image", image_url: imageUrl, alt_text: "Your AI Day illustrated portrait" },
        ],
      }),
    });
    return (await posted.json()).ok === true;
  } catch {
    return false;
  }
}
