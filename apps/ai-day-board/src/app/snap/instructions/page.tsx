import { AiDayLogo } from "@/components/AiDayLogo";

export const metadata = { title: "Photo Station · AI Day" };

const STEPS = [
  {
    n: "1",
    icon: "📱",
    title: "Scan the QR code",
    body: "Point your phone camera at the QR code below. It opens instantly — no app download needed.",
  },
  {
    n: "2",
    icon: "📸",
    title: "Take a selfie (or upload)",
    body: "Tap the camera button for a live selfie, or choose a photo from your library if you prefer.",
  },
  {
    n: "3",
    icon: "✍️",
    title: "Add your @handle",
    body: "Type your Slack handle so everyone knows it's you on the wall. Totally optional.",
  },
  {
    n: "4",
    icon: "✨",
    title: "Hit \"AI Day Me\"",
    body: "Your photo gets illustrated in the AI Day art style and appears on the screens. Watch for yourself!",
  },
];

export default function InstructionsPage() {
  const url = "ai-day-board.vercel.weather.com/snap";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg: #FB00FF; --accent: #FFE500; --ink: #0D142A; --light: #fff;
            --card: rgba(13,20,42,0.55);
          }
          body { font-family: 'IBM Plex Sans', system-ui, sans-serif; background: var(--bg); color: var(--light); min-height: 100vh; }

          .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }

          /* header */
          .header { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.75rem; margin-bottom: 2.5rem; }
          .header svg { width: clamp(160px, 30vw, 260px); }
          .tagline { font-size: clamp(1.1rem, 3vw, 1.5rem); font-weight: 700; color: var(--light); }
          .sub    { font-size: clamp(0.85rem, 2vw, 1rem); color: rgba(255,255,255,0.75); max-width: 520px; }

          /* steps grid */
          .steps { display: grid; gap: 1rem; grid-template-columns: 1fr; }
          @media (min-width: 560px) { .steps { grid-template-columns: 1fr 1fr; } }

          .step { background: var(--card); backdrop-filter: blur(8px); border-radius: 1rem; padding: 1.25rem 1.5rem; display: flex; gap: 1rem; align-items: flex-start; }
          .step-num { display: flex; align-items: center; justify-content: center; width: 2.2rem; height: 2.2rem; min-width: 2.2rem; border-radius: 50%; background: var(--accent); color: var(--ink); font-weight: 800; font-size: 1rem; }
          .step-body h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
          .step-body p  { font-size: 0.875rem; color: rgba(255,255,255,0.75); line-height: 1.45; }

          /* QR block */
          .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; margin-top: 2.5rem; background: var(--card); backdrop-filter: blur(8px); border-radius: 1.25rem; padding: 2rem 1.5rem; text-align: center; }
          .qr-box  { background: #fff; border-radius: 0.75rem; padding: 1rem; display: inline-flex; flex-direction: column; align-items: center; gap: 0.5rem; }
          .qr-img  { width: clamp(140px, 30vw, 200px); height: clamp(140px, 30vw, 200px); image-rendering: pixelated; }
          .qr-url  { font-size: 0.8rem; color: var(--ink); font-weight: 700; word-break: break-all; }
          .qr-label { font-size: clamp(1rem, 2.5vw, 1.25rem); font-weight: 700; }
          .qr-sub   { font-size: 0.875rem; color: rgba(255,255,255,0.7); max-width: 380px; }

          /* accent bar */
          .accent-bar { height: 4px; border-radius: 2px; background: var(--accent); margin: 2rem 0; }

          /* footer */
          .footer { text-align: center; font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-top: 2rem; }

          @media print {
            body { background: #fff; color: #111; --bg:#fff; --accent:#FB00FF; --ink:#111; --light:#111; --card:rgba(0,0,0,0.06); }
            .page { padding: 1rem; }
            .step { border: 1px solid rgba(0,0,0,0.1); }
          }
        `}</style>
      </head>
      <body>
        <div className="page">
          <div className="header">
            {/* Inline AI DAY logo SVG for server render */}
            <svg viewBox="0 0 798 331" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AI DAY">
              <path d="M553.492 2.72792H521.41V111.256L547.579 198.255H521.41V263.444H567.112L586.671 328.606H651.892L553.492 2.72792Z" fill="#FFE500" />
              <path d="M475.735 263.444H521.423V328.619H456.176L475.735 263.444ZM495.268 198.255H521.41V111.256L495.268 198.255Z" fill="#0D142A" />
              <path d="M97.3296 2.72792H65.2476V111.256L91.4029 198.255H65.2476V263.444H110.949L130.509 328.606H195.729L97.3296 2.72792Z" fill="#fff" />
              <path d="M19.5596 263.444H65.2476V328.619H0L19.5596 263.444ZM39.1058 198.255H65.2476V111.256L39.1058 198.255Z" fill="#0D142A" />
              <path d="M266.908 2.72791H201.661V328.606H266.908V2.72791Z" fill="#fff" />
              <path d="M462.919 68.0105C462.919 31.9949 433.686 2.78143 397.658 2.78143H332.477L332.504 68.0105H397.751L397.725 263.497H332.504V328.619L397.685 328.593C433.713 328.593 462.905 299.433 462.919 263.417L462.972 68.1308L462.919 68.0105Z" fill="#FFE500" />
              <path d="M267.27 67.9571L267.243 263.497H332.49V67.9571H267.27Z" fill="#0D142A" />
              <path d="M730.103 2.78143H795.324L730.103 198.255V328.606H664.896V198.255L730.103 2.78143Z" fill="#FFE500" />
              <path d="M664.896 198.255V2.78128H599.648L664.896 198.255Z" fill="#0D142A" />
            </svg>
            <div className="tagline">Get your AI portrait on the wall 🎨</div>
            <div className="sub">Snap a selfie and watch yourself appear as an illustrated AI Day portrait on the screens throughout the office.</div>
          </div>

          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-body">
                  <h3>{s.icon} {s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="accent-bar" />

          <div className="qr-wrap">
            <div className="qr-label">📱 Scan to get started</div>
            <div className="qr-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${url}&color=0D142A`}
                alt="QR code"
                className="qr-img"
                width={200}
                height={200}
              />
              <div className="qr-url">{url}</div>
            </div>
            <div className="qr-sub">Works on any phone. No app download. Takes about 30 seconds.</div>
            <a href={`https://${url}`} style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.95rem", wordBreak: "break-all" }}>
              https://{url}
            </a>
          </div>

          <div className="footer">AI Day · June 9, 2026 · The Weather Company</div>
        </div>
      </body>
    </html>
  );
}
