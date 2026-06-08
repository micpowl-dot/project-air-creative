import type { ReactNode } from "react";

export const metadata = { title: "Photo Station · AI Day" };
export const viewport = { width: "device-width", initialScale: 1 };

const SNAP_STEPS = [
  { n: "1", icon: "scan", title: "Scan the QR code", body: "Point your phone camera at the code below. It opens instantly, no app download needed." },
  { n: "2", icon: "camera", title: "Pick your name, then snap", body: "Choose your name, then take a live selfie or upload a photo from your library." },
  { n: "3", icon: "sparkles", title: "Hit \"AI Day Me\"", body: "Your photo gets illustrated in the AI Day art style and appears on the screens. Watch for yourself!" },
];

const QUOTE_STEPS = [
  { n: "1", icon: "hash", title: "Open #twco_ai_practice", body: "Find the channel in Slack. It's where everyone's sharing AI wins today." },
  { n: "2", icon: "edit", title: "Start with \"AI helped me…\"", body: "Finish the thought in one sentence. Keep it under 240 characters." },
  { n: "3", icon: "monitor", title: "Watch the wall", body: "Your words appear on the screens within about a minute, with your name." },
];

// Inline line icons (replace emoji so they read as crisp UI marks at sign scale).
const ICON_PATHS: Record<string, ReactNode> = {
  scan: (<><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="8" y="8" width="8" height="8" rx="1" /></>),
  camera: (<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>),
  sparkles: (<><path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 14l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" /></>),
  hash: (<><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></>),
  edit: (<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></>),
  monitor: (<><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>),
  message: (<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></>),
  phone: (<><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>),
};

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export default function InstructionsPage() {
  const url = "ai-day-board.vercel.weather.com/snap";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700;800&display=swap');
        .sign, .sign *, .sign *::before, .sign *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sign {
          --magenta: #FB00FF; --magenta-accent: #FFE500;
          --blue: #0062FF; --blue-accent: #67FAE0;
          --ink: #0D142A; --light: #fff;
          --card: rgba(13,20,42,0.5);
          font-family: 'IBM Plex Sans', system-ui, sans-serif; background: var(--ink); color: var(--light); min-height: 100vh;
        }

        .sign .masthead { background: linear-gradient(90deg, var(--magenta) 0 50%, var(--blue) 50% 100%); padding: 2.75rem 1rem calc(2.25rem - 20px); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; }
        .sign .masthead svg { width: clamp(150px, 24vw, 230px); filter: drop-shadow(0 2px 10px rgba(0,0,0,0.35)); }
        .sign .tagline { font-size: clamp(1.1rem, 3vw, 1.5rem); font-weight: 800; text-shadow: 0 1px 6px rgba(0,0,0,0.4); }
        .sign .sub { font-size: clamp(0.85rem, 2vw, 1rem); color: rgba(255,255,255,0.9); max-width: 560px; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }

        .sign .split { display: grid; grid-template-columns: 1fr; align-items: stretch; }
        @media (min-width: 780px) { .sign .split { grid-template-columns: 1fr 1fr; } }

        .sign .col { padding: calc(2.25rem - 35px) 1.5rem 3rem; }
        .sign .ico { width: 1.15em; height: 1.15em; flex-shrink: 0; }
        .sign .col-inner { max-width: 540px; margin: 0 auto; }
        .sign .col-snap  { background: var(--magenta); --accent: var(--magenta-accent); }
        .sign .col-quote { background: var(--blue);    --accent: var(--blue-accent); }

        .sign .col-title { font-size: clamp(1.2rem, 3vw, 1.55rem); font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
        .sign .col-sub { font-size: 0.9rem; color: rgba(255,255,255,0.82); margin: 0.35rem 0 1.25rem; }

        .sign .steps { display: flex; flex-direction: column; gap: 0.9rem; margin: 0 -20px; }
        .sign .step { background: var(--card); backdrop-filter: blur(8px); border-radius: 1rem; padding: 1.1rem 1.25rem; display: flex; gap: 0.9rem; align-items: flex-start; }
        .sign .step-num { display: flex; align-items: center; justify-content: center; width: 2.1rem; height: 2.1rem; min-width: 2.1rem; border-radius: 50%; background: var(--accent); color: var(--ink); font-weight: 800; }
        .sign .step-body h3 { font-size: 0.98rem; font-weight: 700; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.45rem; }
        .sign .step-body p  { font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height: 1.45; }

        .sign .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.85rem; margin-top: 1.5rem; background: var(--card); backdrop-filter: blur(8px); border-radius: 1.1rem; padding: 1.5rem 1.25rem; text-align: center; }
        .sign .qr-box  { background: #fff; border-radius: 0.7rem; padding: 0.9rem; display: inline-flex; flex-direction: column; align-items: center; gap: 0.4rem; }
        .sign .qr-img  { width: clamp(91px, 18.2vw, 126px); height: clamp(91px, 18.2vw, 126px); image-rendering: pixelated; }
        .sign .qr-url  { font-size: 0.75rem; color: var(--ink); font-weight: 700; word-break: break-all; }
        .sign .qr-label { font-size: clamp(0.95rem, 2.5vw, 1.15rem); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.45rem; }

        .sign .examples { margin-top: 1.5rem; background: var(--card); backdrop-filter: blur(8px); border-radius: 1.1rem; padding: 1.25rem 1.4rem; }
        .sign .examples .lbl { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.55); margin-bottom: 0.6rem; }
        .sign .examples p { font-size: 0.9rem; line-height: 1.4; font-style: italic; margin-bottom: 0.55rem; }
        .sign .examples .accent { color: var(--accent); font-style: normal; font-weight: 700; }
        .sign .chan { background: var(--accent); color: var(--ink); font-weight: 800; padding: 0.05rem 0.4rem; border-radius: 0.35rem; }

        .sign .footer { text-align: center; font-size: 0.8rem; color: rgba(255,255,255,0.55); padding: 1.25rem; background: var(--ink); }

        @media print {
          .sign { background: #fff; color: #111; }
          .sign .masthead { background: #fff; }
          .sign .tagline, .sign .sub { color: #111; text-shadow: none; }
          .sign .col-snap  { background: #fff; --accent: #FB00FF; }
          .sign .col-quote { background: #fff; --accent: #0062FF; }
          .sign .col-title, .sign .step-body h3, .sign .qr-label { color: #111; }
          .sign .col-sub, .sign .step-body p, .sign .examples p { color: #333; }
          .sign .step, .sign .examples, .sign .qr-wrap { border: 1px solid rgba(0,0,0,0.12); --card: rgba(0,0,0,0.04); }
          .sign .footer { background: #fff; color: #555; }
        }
      `}</style>

      <div className="sign">
        <div className="masthead">
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
          <div className="tagline">Two ways to land on the AI Day wall 🎉</div>
          <div className="sub">Snap a portrait, share a win, or do both.<br />Everything shows up on the screens around the office.</div>
        </div>

        <div className="split">
          {/* LEFT — magenta — Snap a portrait */}
          <div className="col col-snap">
            <div className="col-inner">
              <div className="col-title"><Icon name="camera" className="ico" /> Get your portrait up</div>
              <div className="col-sub">Take a selfie and watch yourself appear as an illustrated AI Day portrait.</div>
              <div className="steps">
                {SNAP_STEPS.map((s) => (
                  <div key={s.n} className="step">
                    <div className="step-num">{s.n}</div>
                    <div className="step-body">
                      <h3><Icon name={s.icon} className="ico" /> {s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="qr-wrap">
                <div className="qr-label"><Icon name="phone" className="ico" /> Scan to start</div>
                <div className="qr-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${url}&color=0D142A`}
                    alt="QR code to the photo booth"
                    className="qr-img"
                    width={200}
                    height={200}
                  />
                  <div className="qr-url">{url}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — blue — Share a quote */}
          <div className="col col-quote">
            <div className="col-inner">
              <div className="col-title"><Icon name="message" className="ico" /> Get your words up</div>
              <div className="col-sub">Tell us what AI helped you do. Your quote runs on the wall right alongside the portraits.</div>
              <div className="steps">
                {QUOTE_STEPS.map((s) => (
                  <div key={s.n} className="step">
                    <div className="step-num">{s.n}</div>
                    <div className="step-body">
                      <h3><Icon name={s.icon} className="ico" /> {s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="examples">
                <div className="lbl">For example</div>
                <p><span className="accent">&ldquo;</span>AI helped me turn a messy spreadsheet into a clean report in ten minutes.<span className="accent">&rdquo;</span></p>
                <p><span className="accent">&ldquo;</span>AI helped me draft a tough email I&apos;d been putting off for days.<span className="accent">&rdquo;</span></p>
                <p style={{ marginTop: "0.9rem", fontStyle: "normal", fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
                  Post in <span className="chan">#twco_ai_practice</span> on Slack.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">AI Day · June 9, 2026 · The Weather Company</div>
      </div>
    </>
  );
}
