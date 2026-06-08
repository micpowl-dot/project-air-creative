export const metadata = { title: "Photo Station · AI Day" };
export const viewport = { width: "device-width", initialScale: 1 };

const SNAP_STEPS = [
  { n: "1", icon: "📱", title: "Scan the QR code", body: "Point your phone camera at the code below. It opens instantly, no app download needed." },
  { n: "2", icon: "📸", title: "Pick your name, then snap", body: "Choose your name, then take a live selfie or upload a photo from your library." },
  { n: "3", icon: "✨", title: "Hit \"AI Day Me\"", body: "Your photo gets illustrated in the AI Day art style and appears on the screens. Watch for yourself!" },
];

const QUOTE_STEPS = [
  { n: "1", icon: "💬", title: "Open #twco_ai_practice", body: "Find the channel in Slack. It's where everyone's sharing AI wins today." },
  { n: "2", icon: "⌨️", title: "Start with \"AI helped me…\"", body: "Finish the thought in one sentence. Keep it under 240 characters." },
  { n: "3", icon: "📺", title: "Watch the wall", body: "Your words appear on the screens within about a minute, with your name." },
];

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

        .sign .col { padding: 2.25rem 1.5rem 3rem; }
        .sign .col-inner { max-width: 540px; margin: 0 auto; }
        .sign .col-snap  { background: var(--magenta); --accent: var(--magenta-accent); }
        .sign .col-quote { background: var(--blue);    --accent: var(--blue-accent); }

        .sign .col-title { font-size: clamp(1.2rem, 3vw, 1.55rem); font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
        .sign .col-sub { font-size: 0.9rem; color: rgba(255,255,255,0.82); margin: 0.35rem 0 1.25rem; }

        .sign .steps { display: flex; flex-direction: column; gap: 0.9rem; }
        .sign .step { background: var(--card); backdrop-filter: blur(8px); border-radius: 1rem; padding: 1.1rem 1.25rem; display: flex; gap: 0.9rem; align-items: flex-start; }
        .sign .step-num { display: flex; align-items: center; justify-content: center; width: 2.1rem; height: 2.1rem; min-width: 2.1rem; border-radius: 50%; background: var(--accent); color: var(--ink); font-weight: 800; }
        .sign .step-body h3 { font-size: 0.98rem; font-weight: 700; margin-bottom: 0.2rem; }
        .sign .step-body p  { font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height: 1.45; }

        .sign .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.85rem; margin-top: 1.5rem; background: var(--card); backdrop-filter: blur(8px); border-radius: 1.1rem; padding: 1.5rem 1.25rem; text-align: center; }
        .sign .qr-box  { background: #fff; border-radius: 0.7rem; padding: 0.9rem; display: inline-flex; flex-direction: column; align-items: center; gap: 0.4rem; }
        .sign .qr-img  { width: clamp(130px, 26vw, 180px); height: clamp(130px, 26vw, 180px); image-rendering: pixelated; }
        .sign .qr-url  { font-size: 0.75rem; color: var(--ink); font-weight: 700; word-break: break-all; }
        .sign .qr-label { font-size: clamp(0.95rem, 2.5vw, 1.15rem); font-weight: 700; }

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
              <div className="col-title">📸 Get your portrait up</div>
              <div className="col-sub">Take a selfie and watch yourself appear as an illustrated AI Day portrait.</div>
              <div className="steps">
                {SNAP_STEPS.map((s) => (
                  <div key={s.n} className="step">
                    <div className="step-num">{s.n}</div>
                    <div className="step-body">
                      <h3>{s.icon} {s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="qr-wrap">
                <div className="qr-label">📱 Scan to start</div>
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
              <div className="col-title">💬 Get your words up</div>
              <div className="col-sub">Tell us what AI helped you do. Your quote runs on the wall right alongside the portraits.</div>
              <div className="steps">
                {QUOTE_STEPS.map((s) => (
                  <div key={s.n} className="step">
                    <div className="step-num">{s.n}</div>
                    <div className="step-body">
                      <h3>{s.icon} {s.title}</h3>
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
