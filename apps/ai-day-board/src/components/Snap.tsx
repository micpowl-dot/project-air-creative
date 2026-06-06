"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AiDayLogo } from "./AiDayLogo";

// One of the 5 palettes, picked once per session.
const PALETTES = [
  { bg: "#FB00FF", accent: "#FFE500", ink: "#0D142A", light: "#fff", top: "converging" },
  { bg: "#0062FF", accent: "#67FAE0", ink: "#0D142A", light: "#fff", top: "piano-stripes" },
  { bg: "#46125B", accent: "#FFDC14", ink: "#9E5BB9", light: "#fff", top: "dot-row" },
  { bg: "#FF9500", accent: "#6B0800", ink: "#BC1100", light: "#FFE8C1", top: "checker" },
  { bg: "#1F7A4D", accent: "#76D662", ink: "#0D142A", light: "#fff", top: "piano-stripes" },
];
const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];

type Step = "camera" | "preview" | "submitting" | "done" | "error";

export function Snap() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("camera");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Directory typeahead — pick yourself so the wall + Slack tag are exact.
  type DirUser = { id: string; name: string; real: string; handle: string };
  const [dir, setDir] = useState<DirUser[]>([]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<DirUser | null>(null);
  const handle = picked ? `@${picked.handle || picked.name}` : query.trim();

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setDir(d.users || []))
      .catch(() => {});
  }, []);

  const matches = (() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q || picked) return [];
    return dir
      .filter((u) => u.name.toLowerCase().includes(q) || u.real.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q))
      .slice(0, 6);
  })();

  // Start camera on mount.
  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => {
        setErrorMsg("Camera access denied. Please allow camera access and reload.");
        setStep("error");
      });
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Center-crop to square.
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.save();
    // Mirror for selfie feel.
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, -size, 0, size, size);
    ctx.restore();
    setSnapshot(canvas.toDataURL("image/jpeg", 0.85));
    setStep("preview");
  }

  function retake() {
    setSnapshot(null);
    setStep("camera");
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSnapshot(ev.target?.result as string);
      setStep("preview");
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    e.target.value = "";
  }

  async function submit() {
    if (!snapshot) return;
    setStep("submitting");
    try {
      const res = await fetch("/api/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: snapshot, userId: picked?.id || "", name: picked?.name || query.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Unknown error");
      setStep("done");
    } catch (e) {
      setErrorMsg(String(e));
      setStep("error");
    }
  }

  // --- Confirmation card (step === "done") ---
  if (step === "done") {
    const displayHandle = picked ? `@${picked.handle || picked.name}` : (query.trim() ? query.trim() : null);
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden" style={{ background: palette.bg }}>
        <style>{`
          @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
          @keyframes pulse-ring { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        `}</style>
        {/* flanking graphic top */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/poster-elements/top-edge/${palette.top}.png`} alt="" aria-hidden className="absolute right-0 top-0 w-2/3 object-cover opacity-60" style={{ height: "40%" }} />

        <div className="relative z-10 flex flex-col items-center px-8 text-center">
          <div style={{ animation: "float 3s ease-in-out infinite" }}>
            <AiDayLogo accent={palette.accent} ink={palette.ink} light={palette.light} style={{ width: 200 }} />
          </div>

          <div className="mt-6 rounded-xl px-6 py-5" style={{ background: "rgba(13,20,42,0.55)", backdropFilter: "blur(8px)" }}>
            {displayHandle && (
              <div className="mb-1 font-display text-2xl font-bold" style={{ color: palette.accent }}>
                {displayHandle}
              </div>
            )}
            <div className="font-display text-xl font-bold text-white">Your illustrated portrait</div>
            <div className="mt-1 text-white/80">is on its way to the wall ✨</div>
            <div className="mt-2 text-sm text-white/55">Nano Banana is working on it now.</div>
          </div>

          {/* Animated ring */}
          <div className="mt-8" style={{ animation: "pulse-ring 2s ease-in-out infinite" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/poster-elements/center/clover.png" alt="" style={{ width: 120, opacity: 0.85 }} />
          </div>

          <Link
            href="/wall"
            className="mt-8 rounded-xl px-8 py-3 text-base font-bold"
            style={{ background: palette.accent, color: palette.ink }}
          >
            Watch the wall →
          </Link>

          <p className="mt-4 text-sm text-white/50">June 9, 2026 · AI Day</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (step === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D142A] px-8 text-center text-white">
        <div className="text-4xl">⚠️</div>
        <p className="mt-4 text-white/70">{errorMsg || "Something went wrong."}</p>
        <button onClick={() => { setStep("camera"); setErrorMsg(""); }} className="mt-6 rounded-xl bg-white px-6 py-2 font-bold text-[#111]">Try again</button>
      </div>
    );
  }

  // --- Camera + preview ---
  return (
    <div className="flex min-h-screen flex-col" style={{ background: palette.bg }}>
      {/* header — AI DAY logo flanked by converging graphic (tiled so it never
          cuts), logo centered with generous padding */}
      <header className="relative flex h-36 items-center overflow-hidden" style={{ background: palette.bg }}>
        {/* left — mirrored + tiled */}
        <div
          className="hidden h-full min-w-0 flex-1 sm:block"
          style={{
            backgroundImage: "url(/poster-elements/top-edge/converging.png)",
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 100%",
            backgroundPosition: "right center",
            transform: "scaleX(-1)",
            opacity: 0.7,
          }}
        />
        <div className="shrink-0 px-10 text-center">
          <AiDayLogo accent={palette.accent} ink={palette.ink} light={palette.light} style={{ width: 120 }} />
        </div>
        {/* right — tiled */}
        <div
          className="hidden h-full min-w-0 flex-1 sm:block"
          style={{
            backgroundImage: "url(/poster-elements/top-edge/converging.png)",
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 100%",
            backgroundPosition: "left center",
            opacity: 0.7,
          }}
        />
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pb-8 pt-4">
        <h1 className="mb-1 text-center font-display text-2xl font-bold text-white">AI Day Me</h1>
        <p className="mb-4 text-center text-sm text-white/70">Take a selfie and appear on the wall as an illustrated portrait.</p>

        {/* Camera / snapshot */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ aspectRatio: "1/1", background: "#111" }}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scaleX(-1)", display: step === "camera" ? "block" : "none" }}
          />
          {snapshot && step === "preview" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={snapshot} alt="Your selfie" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {step === "submitting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0D142A]/80">
              <div className="text-center text-white">
                <div className="mb-2 text-3xl">✨</div>
                <div className="font-display font-bold">Sending to the wall…</div>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* who are you — directory typeahead */}
        <div className="relative mt-4">
          {picked ? (
            <div className="flex items-center justify-between rounded-xl border border-white/30 bg-white/10 px-4 py-3">
              <span className="font-semibold text-white">{picked.name} <span className="text-white/50">@{picked.handle || picked.name}</span></span>
              <button onClick={() => { setPicked(null); setQuery(""); }} className="text-sm text-white/60 hover:text-white">change</button>
            </div>
          ) : (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find your name (optional)"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base font-semibold text-white placeholder:font-normal placeholder:text-white/40 focus:border-white/60 focus:outline-none"
              style={{ caretColor: palette.accent }}
            />
          )}
          {matches.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/20 bg-[#0D142A] shadow-2xl">
              {matches.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setPicked(u); setQuery(u.name); }}
                  className="flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-white/10"
                >
                  <span className="font-semibold text-white">{u.name}</span>
                  {u.handle && <span className="text-xs text-white/45">@{u.handle}</span>}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-white/45">Pick yourself so your name shows on the wall and you get tagged.</p>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-3">
          {step === "camera" && (
            <>
              <button
                onClick={capture}
                className="rounded-xl py-4 text-lg font-bold shadow-lg"
                style={{ background: palette.accent, color: palette.ink }}
              >
                📸 Take selfie
              </button>
              <button
                onClick={() => uploadRef.current?.click()}
                className="rounded-xl border border-white/30 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                📁 Upload a photo instead
              </button>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={submit}
                className="rounded-xl py-4 text-lg font-bold shadow-lg"
                style={{ background: palette.accent, color: palette.ink }}
              >
                ✨ AI Day Me
              </button>
              <button
                onClick={retake}
                className="rounded-xl border border-white/30 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Retake
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
