"use client";

import { useState } from "react";
import { AiDayLogo } from "./AiDayLogo";

const BG = "#0D142A";
const MAGENTA = "#FB00FF";
const ACCENT = "#FFE500";

const PROMPTS: { label: string; text: string }[] = [
  { label: "Catch me up", text: "Summarize this [thread / doc / meeting notes] in 5 bullets: the key points, any decisions made, and the action items with owners and due dates." },
  { label: "Draft it for me", text: "Write a first draft of this [email / Slack message / update] about [topic] for [audience]. Lead with the main point, keep it short, and flag anything I should double-check." },
  { label: "Pressure-test my thinking", text: "Here's my plan: [paste it]. Play devil's advocate. What are the 3 biggest risks or gaps, and what would you do about each?" },
  { label: "Explain it simply", text: "Explain [topic / tool / error message] like I'm new to it. Then give me the first 3 steps to actually get started." },
  { label: "Get me unstuck", text: "I need to [task] but I'm not sure where to start. Ask me 2-3 questions first, then give me a template or outline I can build from." },
];

function PromptCard({ n, label, text }: { n: number; label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg sm:p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ background: MAGENTA }}>{n}</span>
          <h2 className="font-display text-lg font-bold text-[#0D142A] sm:text-xl">{label}</h2>
        </div>
        <button
          onClick={copy}
          className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold"
          style={{ background: copied ? "#16a34a" : "#0D142A", color: "#fff" }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="font-mono text-sm leading-relaxed text-[#0D142A]/80 sm:text-base">{text}</p>
    </div>
  );
}

export function Prompts() {
  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* header band — mirrors the schedule board hero: converging graphic
          flanks a centered AI DAY lockup (cropped 75px top/bottom, 70% opacity) */}
      <header className="relative flex h-48 items-center overflow-hidden sm:h-52" style={{ background: MAGENTA }}>
        <div className="relative hidden h-full min-w-0 flex-1 overflow-hidden md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/poster-elements/top-edge/converging.png"
            alt=""
            aria-hidden
            className="absolute inset-x-0 w-full object-cover"
            style={{ top: -75, height: "calc(100% + 150px)", transform: "scaleX(-1)", opacity: 0.7 }}
          />
        </div>
        <div className="shrink-0 px-6 text-center sm:px-8">
          <AiDayLogo accent={ACCENT} ink={BG} light="#fff" className="mx-auto block" style={{ width: 260, maxWidth: "70vw" }} />
          <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">5 prompts to get started</h1>
          <p className="mt-1 text-sm text-white/85">Works for any role. Copy one, paste your details, go.</p>
        </div>
        <div className="relative hidden h-full min-w-0 flex-1 overflow-hidden md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/poster-elements/top-edge/converging.png"
            alt=""
            aria-hidden
            className="absolute inset-x-0 w-full object-cover"
            style={{ top: -75, height: "calc(100% + 150px)", opacity: 0.7 }}
          />
        </div>
      </header>

      {/* prompts */}
      <div className="mx-auto max-w-2xl space-y-4 px-5 py-8">
        {PROMPTS.map((p, i) => (
          <PromptCard key={p.label} n={i + 1} label={p.label} text={p.text} />
        ))}

        <p className="px-1 pt-2 text-center text-sm text-white/60">
          The first answer is a starting point, not the final word, push back and ask follow-ups.
        </p>
        <p className="pt-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
          AI Day · June 9, 2026
        </p>
      </div>
    </div>
  );
}
