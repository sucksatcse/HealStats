import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeContext";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

// ── Initial greeting ───────────────────────────────────────────────────────
const GREETING: Message = {
  id: 0,
  role: "assistant",
  text: "Hi! I'm the HealthStats Assistant. I can help with patient records, clinic sync status, or guide you through the platform. How can I help?",
};

const QUICK_REPLIES = ["How does offline sync work?", "Find a patient record", "Clinic status"];

// ── Simulated response map ─────────────────────────────────────────────────
function getResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("sync") || q.includes("offline") || q.includes("connect"))
    return "Visit records sync automatically when connectivity is restored — no data is ever lost. The app queues all changes locally and uploads them the moment you're back online. You can monitor sync status under Admin → Sync Status.";
  if (q.includes("patient") || q.includes("record") || q.includes("find"))
    return "Search for any patient by name, phone number, or patient ID from the Dashboard search bar. Full visit history, vitals, and triage assessments are accessible for each record.";
  if (q.includes("clinic") || q.includes("status") || q.includes("ops") || q.includes("map"))
    return "The Ops Map shows real-time connection status for all 18 clinics. Green = synced, amber = sync delay (30 min+), red = offline. Enable Emergency Mode to highlight affected zones for rapid dispatch.";
  if (q.includes("triage") || q.includes("imci") || q.includes("assess"))
    return "The triage module follows IMCI protocols and works fully offline. Field workers enter assessments on any device; results sync to the dashboard as soon as connectivity is available.";
  if (q.includes("emergency") || q.includes("alert") || q.includes("urgent"))
    return "Activate Emergency Mode from the Ops Map to instantly highlight all offline clinics in red with pulsing zone indicators. Use Broadcast Alert to notify all connected clinics simultaneously.";
  return "Thanks for your question! I can help with visit records, clinic connectivity, triage workflows, and patient data. What would you like to know more about?";
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const IconMinus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" d="M4 10h12" />
  </svg>
);
const IconSend = () => (
  <svg viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);
const IconHeart = () => (
  <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { dark } = useTheme();
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([GREETING]);
  const [input, setInput]         = useState("");
  const [typing, setTyping]       = useState(false);
  const [unread, setUnread]       = useState(1);
  const msgEndRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  // Scroll to latest message
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Clear unread + focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  function send(text = input) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);

    const delay = 850 + Math.random() * 550;
    setTimeout(() => {
      setTyping(false);
      const reply: Message = { id: Date.now() + 1, role: "assistant", text: getResponse(trimmed) };
      setMessages(m => [...m, reply]);
      if (!open) setUnread(u => u + 1);
    }, delay);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const showQuickReplies = messages.length === 1 && !typing;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none select-none">

      {/* ──────────── Chat window ──────────── */}
      <div
        role="dialog"
        aria-label="HealthStats Assistant chat"
        aria-hidden={!open}
        className={`w-[360px] rounded-2xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 ease-out origin-bottom-right ${
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3 pointer-events-none"
        }`}
        style={{
          height: 488,
          boxShadow: dark
            ? "0 32px 72px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)"
            : "0 32px 72px rgba(13,148,136,0.13), 0 8px 24px rgba(0,0,0,0.09)",
          border: `1px solid ${dark ? "rgba(51,65,85,0.8)" : "rgba(204,239,233,0.9)"}`,
          background: dark ? "#0f172a" : "#ffffff",
        }}
      >

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-teal-600 flex-shrink-0">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center flex-shrink-0">
            <IconHeart />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white tracking-tight leading-none">HealthStats Assistant</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] text-teal-100 font-medium">Online · typically replies instantly</span>
            </div>
          </div>

          {/* Minimize */}
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-teal-100 hover:text-white transition-all active:scale-90"
            aria-label="Minimize chat"
          >
            <IconMinus />
          </button>
        </div>

        {/* ── Messages ── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
          style={{ scrollbarWidth: "none" }}
        >
          {messages.map((msg, idx) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                /* User: right-aligned teal bubble */
                <div className="flex justify-end">
                  <div
                    className="max-w-[78%] bg-teal-600 text-white px-4 py-2.5 shadow-sm"
                    style={{ borderRadius: "18px 4px 18px 18px" }}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ) : (
                /* Assistant: left-aligned gray bubble */
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <IconHeart />
                  </div>
                  <div
                    className={`max-w-[78%] px-4 py-2.5 shadow-sm ${
                      dark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-800"
                    }`}
                    style={{ borderRadius: "4px 18px 18px 18px" }}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              )}

              {/* Quick reply chips — only shown after the greeting */}
              {msg.role === "assistant" && idx === 0 && showQuickReplies && (
                <div className="flex flex-wrap gap-1.5 mt-3 pl-8">
                  {QUICK_REPLIES.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all hover:scale-[1.02] active:scale-95 ${
                        dark
                          ? "border-teal-700 text-teal-400 hover:bg-teal-900/40 hover:border-teal-500"
                          : "border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <IconHeart />
              </div>
              <div
                className={`px-4 py-3 shadow-sm ${dark ? "bg-slate-800" : "bg-slate-100"}`}
                style={{ borderRadius: "4px 18px 18px 18px" }}
              >
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className={`w-1.5 h-1.5 rounded-full animate-bounce ${dark ? "bg-slate-500" : "bg-slate-400"}`}
                      style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={msgEndRef} />
        </div>

        {/* ── Input area ── */}
        <div
          className="flex-shrink-0 px-3 pb-3 pt-2"
          style={{ borderTop: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.8)"}` }}
        >
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
              dark
                ? "bg-slate-800 border border-slate-700 focus-within:border-teal-600"
                : "bg-slate-50 border border-slate-200 focus-within:border-teal-400 focus-within:bg-white"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask a question…"
              disabled={!open}
              className={`flex-1 bg-transparent text-sm outline-none ${
                dark ? "text-slate-100 placeholder-slate-500" : "text-slate-800 placeholder-slate-400"
              }`}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="w-7 h-7 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            >
              <IconSend />
            </button>
          </div>
          <p className={`text-center text-[10px] mt-1.5 ${dark ? "text-slate-700" : "text-slate-300"}`}>
            HealthStats AI · Not a substitute for medical advice
          </p>
        </div>
      </div>

      {/* ──────────── Toggle button ──────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={open}
        className={`pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
          open
            ? "bg-slate-600 dark:bg-slate-700 hover:bg-slate-500 dark:hover:bg-slate-600 shadow-slate-600/30 scale-100"
            : "bg-teal-600 hover:bg-teal-500 shadow-teal-600/45 hover:scale-110 hover:shadow-teal-600/55 hover:shadow-2xl"
        } active:scale-90`}
      >
        {/* Chat icon (visible when closed) */}
        <span
          className="absolute transition-all duration-250"
          style={{
            opacity: open ? 0 : 1,
            transform: open ? "rotate(-90deg) scale(0.7)" : "rotate(0deg) scale(1)",
          }}
        >
          <IconChat />
        </span>

        {/* X icon (visible when open) */}
        <span
          className="absolute transition-all duration-250"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.7)",
          }}
        >
          <IconX />
        </span>

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950 text-[10px] font-extrabold text-white flex items-center justify-center shadow-md animate-bounce">
            {unread > 9 ? "9+" : unread}
          </span>
        )}

        {/* Ripple ring when unread (pulsing glow) */}
        {!open && unread > 0 && (
          <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-30 pointer-events-none" />
        )}
      </button>
    </div>
  );
}
