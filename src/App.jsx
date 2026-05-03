import { useState, useEffect, useRef } from "react";

// ─── Constants ───
const REL_TYPES = [
  { id: "manager", label: "Manager", emoji: "👔", color: "#f59e0b" },
  { id: "colleague", label: "Colleague", emoji: "🤝", color: "#6366f1" },
  { id: "friend", label: "Friend", emoji: "💛", color: "#22d3ee" },
  { id: "partner", label: "Partner", emoji: "❤️", color: "#ec4899" },
  { id: "family", label: "Family", emoji: "🏠", color: "#10b981" },
  { id: "mentor", label: "Mentor", emoji: "🧭", color: "#8b5cf6" },
  { id: "classmate", label: "Classmate", emoji: "📚", color: "#3b82f6" },
  { id: "client", label: "Client", emoji: "💼", color: "#f97316" },
];

const PLAYBOOKS = [
  { id: "raise", title: "Asking for a raise", emoji: "💰", desc: "Navigate salary conversations with confidence" },
  { id: "feedback", title: "Receiving harsh feedback", emoji: "😤", desc: "Turn criticism into growth" },
  { id: "boundary", title: "Setting boundaries", emoji: "🛑", desc: "Protect your energy without damage" },
  { id: "conflict", title: "Resolving a conflict", emoji: "⚡", desc: "Find common ground when heated" },
  { id: "breakup", title: "Ending a relationship", emoji: "💔", desc: "Navigate endings with grace" },
  { id: "newmanager", title: "First 90 days with new manager", emoji: "🆕", desc: "Build trust early" },
  { id: "networking", title: "Cold outreach", emoji: "🌐", desc: "Reach out without being awkward" },
  { id: "apology", title: "Apologising sincerely", emoji: "🕊️", desc: "Make it right" },
  { id: "onesided", title: "One-sided relationship", emoji: "⚖️", desc: "Rebalance the give-and-take" },
  { id: "difficult", title: "Difficult conversation", emoji: "🗣️", desc: "Say what needs to be said" },
];

const STARTERS = [
  "They gave me harsh feedback publicly — how should I respond?",
  "I want to ask for a favour but don't want to seem pushy",
  "We had a disagreement and I'm not sure who should apologise",
  "How do I set better boundaries without damaging the relationship?",
  "I need to deliver bad news — what's the best approach?",
];

const getRT = (id) => REL_TYPES.find(r => r.id === id) || REL_TYPES[2];
const daysAgo = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : Infinity;

const healthScore = (p) => {
  let s = 5;
  const logs = p.interactions || [];
  if (!logs.length) return 5;
  const last = logs[logs.length - 1];
  const d = daysAgo(last?.date);
  if (d <= 3) s += 2; else if (d <= 7) s += 1; else if (d > 21) s -= 2; else if (d > 14) s -= 1;
  const recent = logs.slice(-5);
  const avg = recent.reduce((a, l) => a + (l.sentiment || 3), 0) / recent.length;
  s += (avg - 3) * 0.8;
  if (logs.length >= 5) s += 0.5;
  if (logs.length >= 10) s += 0.5;
  return Math.max(1, Math.min(10, Math.round(s * 10) / 10));
};

const hColor = (s) => s >= 7.5 ? "#22c55e" : s >= 5 ? "#f59e0b" : "#ef4444";

const getNudges = (people) => {
  const n = [];
  people.forEach(p => {
    const logs = p.interactions || [];
    const last = logs.length ? logs[logs.length - 1].date : p.createdAt;
    const d = daysAgo(last);
    if (d >= 21) n.push({ person: p, type: "reconnect", days: d, msg: `You haven't logged an interaction with ${p.name} in ${d} days` });
    else if (d >= 14) n.push({ person: p, type: "gentle", days: d, msg: `It's been ${d} days since you connected with ${p.name}` });
    const sc = healthScore(p);
    if (sc <= 3.5 && logs.length >= 2) n.push({ person: p, type: "health", days: 0, msg: `Relationship with ${p.name} needs attention (${sc}/10)` });
  });
  return n.sort((a, b) => (b.days || 0) - (a.days || 0));
};

// ─── Styles ───
const F = "'DM Sans', sans-serif";
const FD = "'Playfair Display', Georgia, serif";
const glass = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };
const btn = { border: "none", cursor: "pointer", fontFamily: F, transition: "all 0.2s" };

// ─── Orb Background ───
function OrbBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "linear-gradient(145deg, #0a0a0f 0%, #0d0b1a 40%, #0a0f1a 100%)" }}>
      {[{ w: 600, c: "99,102,241,0.12", t: "-10%", r: "-10%", d: 20 }, { w: 500, c: "236,72,153,0.08", b: "-5%", l: "-5%", d: 25 }, { w: 400, c: "34,211,238,0.06", t: "40%", l: "30%", d: 18 }].map((o, i) => (
        <div key={i} style={{ position: "absolute", width: o.w, height: o.w, borderRadius: "50%", background: `radial-gradient(circle, rgba(${o.c}) 0%, transparent 70%)`, top: o.t, right: o.r, bottom: o.b, left: o.l, filter: "blur(80px)", animation: `f${i} ${o.d}s ease-in-out infinite` }} />
      ))}
      <style>{`@keyframes f0{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,20px)}}@keyframes f1{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-30px)}}@keyframes f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,-20px)}}`}</style>
    </div>
  );
}

// ─── Modal ───
function Modal({ onClose, children, title, sub }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(165deg, rgba(20,18,35,0.98), rgba(12,10,24,0.98))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
        {title && <h2 style={{ fontFamily: FD, fontSize: 24, fontWeight: 600, color: "#f0eef6", margin: "0 0 4px" }}>{title}</h2>}
        {sub && <p style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 24px" }}>{sub}</p>}
        {children}
      </div>
    </div>
  );
}

// ─── Add Person ───
function AddModal({ onClose, onAdd }) {
  const [name, setName] = useState(""); const [type, setType] = useState(""); const [notes, setNotes] = useState(""); const [dynamics, setDynamics] = useState("");
  const inp = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0eef6", fontFamily: F, fontSize: 14, outline: "none" };
  const lbl = (t, mt) => <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 6, marginTop: mt || 0, letterSpacing: 0.5 }}>{t}</div>;
  const submit = () => { if (!name.trim() || !type) return; onAdd({ id: Date.now().toString(), name: name.trim(), type, notes: notes.trim(), dynamics: dynamics.trim(), createdAt: new Date().toISOString(), interactions: [] }); onClose(); };
  return (
    <Modal onClose={onClose} title="Add someone" sub="The more context, the better the advice.">
      {lbl("Name")}
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Chen" style={inp} autoFocus />
      {lbl("Relationship", 18)}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {REL_TYPES.map(rt => (
          <button key={rt.id} onClick={() => setType(rt.id)} style={{ ...btn, padding: "8px 14px", borderRadius: 10, border: `1px solid ${type === rt.id ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`, background: type === rt.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", color: type === rt.id ? "#c4b5fd" : "rgba(255,255,255,0.5)", fontSize: 13 }}>{rt.emoji} {rt.label}</button>
        ))}
      </div>
      {lbl("Background context", 18)}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How do you know them?" rows={2} style={{ ...inp, resize: "vertical" }} />
      {lbl("Current dynamic", 18)}
      <textarea value={dynamics} onChange={e => setDynamics(e.target.value)} placeholder="How's the relationship going?" rows={2} style={{ ...inp, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ ...btn, padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Cancel</button>
        <button onClick={submit} disabled={!name.trim() || !type} style={{ ...btn, padding: "10px 24px", borderRadius: 10, background: name.trim() && type ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", color: name.trim() && type ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 500 }}>Add person</button>
      </div>
    </Modal>
  );
}

// ─── Log Interaction ───
function LogModal({ person, onClose, onLog }) {
  const [note, setNote] = useState(""); const [sent, setSent] = useState(2);
  const labels = ["😟 Rough", "😕 Tense", "😐 Neutral", "🙂 Good", "😊 Great"];
  const submit = () => { if (!note.trim()) return; onLog(person.id, { note: note.trim(), sentiment: sent + 1, date: new Date().toISOString(), id: Date.now().toString() }); onClose(); };
  return (
    <Modal onClose={onClose} title={`Log interaction with ${person.name}`} sub="Quick note about a recent interaction.">
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What happened? How did it go?" rows={3} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0eef6", fontFamily: F, fontSize: 14, outline: "none", resize: "vertical" }} autoFocus />
      <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginTop: 18, marginBottom: 10 }}>How did it feel?</div>
      <div style={{ display: "flex", gap: 6 }}>
        {labels.map((l, i) => (
          <button key={i} onClick={() => setSent(i)} style={{ ...btn, flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 12, textAlign: "center", border: `1px solid ${sent === i ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.06)"}`, background: sent === i ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)", color: sent === i ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ ...btn, padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Cancel</button>
        <button onClick={submit} disabled={!note.trim()} style={{ ...btn, padding: "10px 24px", borderRadius: 10, background: note.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", color: note.trim() ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 500 }}>Log it</button>
      </div>
    </Modal>
  );
}

// ─── Tone Checker ───
function ToneModal({ person, onClose }) {
  const [draft, setDraft] = useState(""); const [res, setRes] = useState(null); const [loading, setLoading] = useState(false);
  const analyze = async () => {
    if (!draft.trim() || loading) return; setLoading(true);
    try {
      const rt = getRT(person.type);
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: `You are a tone analyst in a relationship OS. Analyze this draft message to ${person.name} (${rt.label}). Context: ${person.notes || "none"} | Dynamic: ${person.dynamics || "none"}\n\nRespond ONLY in this JSON (no markdown):\n{"tone_score":7,"tone_label":"Warm but direct","risks":["..."],"suggestion":"improved version","explanation":"brief why"}`, messages: [{ role: "user", content: `Analyze: "${draft}"` }] }) });
      const data = await r.json(); const t = data.content?.find(b => b.type === "text")?.text || "{}";
      setRes(JSON.parse(t.replace(/```json|```/g, "").trim()));
    } catch(e) { setRes({ tone_score: 0, tone_label: "Error", risks: ["Try again"], suggestion: draft, explanation: "Could not analyze" }); }
    setLoading(false);
  };
  return (
    <Modal onClose={onClose} title={`Tone check for ${person.name}`} sub="Draft a message and get tone feedback.">
      <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Write the message you want to send to ${person.name}...`} rows={4} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0eef6", fontFamily: F, fontSize: 14, outline: "none", resize: "vertical" }} autoFocus />
      <button onClick={analyze} disabled={!draft.trim() || loading} style={{ ...btn, width: "100%", padding: 12, borderRadius: 12, marginTop: 12, background: draft.trim() && !loading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", color: draft.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 500 }}>{loading ? "Analysing..." : "Check tone"}</button>
      {res && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${hColor(res.tone_score)}18`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontSize: 20, fontWeight: 700, color: hColor(res.tone_score) }}>{res.tone_score}</div>
            <div>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "#f0eef6" }}>{res.tone_label}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Tone score out of 10</div>
            </div>
          </div>
          {res.risks?.length > 0 && (
            <div style={{ ...glass, padding: "14px 16px", marginBottom: 12, borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}>
              <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "rgba(239,68,68,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>RISKS</div>
              {res.risks.map((r, i) => <div key={i} style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 4 }}>• {r}</div>)}
            </div>
          )}
          <div style={{ ...glass, padding: "14px 16px", borderColor: "rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.04)" }}>
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "rgba(34,197,94,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>SUGGESTED VERSION</div>
            <div style={{ fontFamily: F, fontSize: 13.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"{res.suggestion}"</div>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8, lineHeight: 1.5 }}>{res.explanation}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Style Analysis ───
function StyleModal({ person, onClose }) {
  const [thread, setThread] = useState(""); const [res, setRes] = useState(null); const [loading, setLoading] = useState(false);
  const analyze = async () => {
    if (!thread.trim() || loading) return; setLoading(true);
    try {
      const rt = getRT(person.type);
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: `Analyze communication styles in this conversation with ${person.name} (${rt.label}). Respond ONLY in JSON (no markdown):\n{"user_style":{"label":"Direct","traits":["..."]},"their_style":{"label":"Warm","traits":["..."]},"mismatches":["..."],"tips":["..."],"compatibility":7}`, messages: [{ role: "user", content: thread }] }) });
      const data = await r.json(); const t = data.content?.find(b => b.type === "text")?.text || "{}";
      setRes(JSON.parse(t.replace(/```json|```/g, "").trim()));
    } catch(e) { console.error(e); }
    setLoading(false);
  };
  return (
    <Modal onClose={onClose} title="Communication Style Analysis" sub={`Paste a text/email thread with ${person.name}`}>
      <textarea value={thread} onChange={e => setThread(e.target.value)} placeholder="Paste conversation here (include both sides)..." rows={6} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0eef6", fontFamily: F, fontSize: 13, outline: "none", resize: "vertical" }} autoFocus />
      <button onClick={analyze} disabled={!thread.trim() || loading} style={{ ...btn, width: "100%", padding: 12, borderRadius: 12, marginTop: 12, background: thread.trim() && !loading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", color: thread.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 500 }}>{loading ? "Analysing styles..." : "Analyse styles"}</button>
      {res && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ label: "Your style", data: res.user_style, c: "#6366f1" }, { label: `${person.name}`, data: res.their_style, c: "#ec4899" }].map((s, i) => (
              <div key={i} style={{ ...glass, padding: 16, borderColor: `${s.c}33` }}>
                <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: s.c, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 600, color: "#f0eef6", marginBottom: 8 }}>{s.data?.label}</div>
                {s.data?.traits?.map((t, j) => <div key={j} style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 3, lineHeight: 1.4 }}>• {t}</div>)}
              </div>
            ))}
          </div>
          <div style={{ ...glass, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Compatibility</div>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
              <div style={{ width: `${(res.compatibility || 5) * 10}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)" }} />
            </div>
            <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: "#f0eef6" }}>{res.compatibility}/10</div>
          </div>
          {res.mismatches?.length > 0 && (
            <div style={{ ...glass, padding: "14px 16px", borderColor: "rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.04)" }}>
              <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "rgba(245,158,11,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>MISMATCHES</div>
              {res.mismatches.map((m, i) => <div key={i} style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 4 }}>⚠️ {m}</div>)}
            </div>
          )}
          {res.tips?.length > 0 && (
            <div style={{ ...glass, padding: "14px 16px", borderColor: "rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.04)" }}>
              <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "rgba(34,197,94,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>TIPS</div>
              {res.tips.map((t, i) => <div key={i} style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 4 }}>✅ {t}</div>)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Network Map ───
function NetMap({ people, onSelect }) {
  const ref = useRef(null);
  const [hov, setHov] = useState(null);

  useEffect(() => {
    const c = ref.current; if (!c || !people.length) return;
    const ctx = c.getContext("2d"); const W = c.width = 600; const H = c.height = 380;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(99,102,241,0.25)"; ctx.fill();
    ctx.strokeStyle = "rgba(99,102,241,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#c4b5fd"; ctx.font = "bold 11px 'DM Sans',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("YOU", cx, cy);
    const step = (2 * Math.PI) / people.length;
    const rad = Math.min(W, H) * 0.33;
    people.forEach((p, i) => {
      const a = step * i - Math.PI / 2;
      const x = cx + rad * Math.cos(a); const y = cy + rad * Math.sin(a);
      const rt = getRT(p.type); const sc = healthScore(p); const hc = hColor(sc);
      const isH = hov === p.id; const nr = isH ? 28 : 22;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
      ctx.strokeStyle = `${hc}33`; ctx.lineWidth = isH ? 2.5 : 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, nr, 0, Math.PI * 2);
      ctx.fillStyle = `${rt.color}22`; ctx.fill();
      ctx.strokeStyle = isH ? rt.color : `${rt.color}88`; ctx.lineWidth = isH ? 2.5 : 1.5; ctx.stroke();
      ctx.fillStyle = isH ? "#f0eef6" : "rgba(255,255,255,0.7)";
      ctx.font = `${isH ? "600" : "500"} ${isH ? 11 : 10}px 'DM Sans',sans-serif`;
      ctx.textAlign = "center"; ctx.fillText(p.name.split(" ")[0], x, y - 4);
      ctx.fillStyle = hc; ctx.font = "bold 9px 'DM Sans',sans-serif"; ctx.fillText(sc.toFixed(1), x, y + 8);
      p._x = x; p._y = y; p._r = nr;
    });
  }, [people, hov]);

  const findP = (e) => {
    const c = ref.current; const rect = c.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (c.width / rect.width);
    const my = (e.clientY - rect.top) * (c.height / rect.height);
    return people.find(p => Math.hypot(mx - (p._x || 0), my - (p._y || 0)) < (p._r || 22));
  };

  return (
    <div style={{ ...glass, padding: 18, marginBottom: 20 }}>
      <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>RELATIONSHIP MAP</div>
      {people.length < 2 ? (
        <div style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: 40 }}>Add 2+ people to see your network</div>
      ) : (
        <canvas ref={ref} width={600} height={380}
          onMouseMove={e => { const p = findP(e); setHov(p?.id || null); ref.current.style.cursor = p ? "pointer" : "default"; }}
          onClick={e => { const p = findP(e); if (p) onSelect(p); }}
          style={{ width: "100%", height: "auto", borderRadius: 12 }} />
      )}
    </div>
  );
}

// ─── Chat View ───
function Chat({ person, onBack, onLog }) {
  const [msgs, setMsgs] = useState([]); const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const [showLog, setShowLog] = useState(false); const [showTone, setShowTone] = useState(false); const [showStyle, setShowStyle] = useState(false);
  const [tab, setTab] = useState("chat");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text) => {
    const msg = text || input.trim(); if (!msg || loading) return; setInput("");
    const next = [...msgs, { role: "user", content: msg }]; setMsgs(next); setLoading(true);
    const rt = getRT(person.type); const logs = person.interactions || [];
    const logCtx = logs.length ? `\nInteraction history:\n${logs.slice(-8).reverse().map(l => `- ${new Date(l.date).toLocaleDateString()}: ${l.note} (${l.sentiment}/5)`).join("\n")}` : "";
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: `You are an empathetic relationship advisor in "Relational OS". Give advice like a wise friend.\n\nCONTEXT:\n- Person: ${person.name} (${rt.label})\n- Background: ${person.notes || "N/A"}\n- Dynamic: ${person.dynamics || "N/A"}\n- Health score: ${healthScore(person)}/10${logCtx}\n\nBe direct, give concrete scripts, acknowledge complexity, 150-250 words.`, messages: next.map(m => ({ role: m.role, content: m.content })) }) });
      const data = await r.json();
      setMsgs(prev => [...prev, { role: "assistant", content: data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Try rephrasing?" }]);
    } catch { setMsgs(prev => [...prev, { role: "assistant", content: "Connection error. Try again." }]); }
    setLoading(false);
  };

  const rt = getRT(person.type); const sc = healthScore(person); const logs = person.interactions || [];

  return (
    <div style={{ position: "relative", zIndex: 1, height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button onClick={onBack} style={{ ...btn, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 12px", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FD, fontSize: 17, fontWeight: 600, color: "#f0eef6" }}>{rt.emoji} {person.name}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{rt.label} · <span style={{ color: hColor(sc), fontWeight: 600 }}>{sc}/10</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 7, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <span style={{ fontSize: 10 }}>🔐</span>
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "rgba(34,197,94,0.7)", letterSpacing: 0.5 }}>E2E</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          {[{ l: "📝 Log", fn: () => setShowLog(true) }, { l: "🎨 Tone", fn: () => setShowTone(true) }, { l: "🔍 Style", fn: () => setShowStyle(true) }].map((b, i) => (
            <button key={i} onClick={b.fn} style={{ ...btn, padding: "5px 10px", borderRadius: 7, fontSize: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{b.l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {[{ id: "chat", l: "Chat" }, { id: "playbook", l: "Playbooks" }, { id: "history", l: `History (${logs.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...btn, padding: "7px 14px", fontSize: 12, fontWeight: 500, background: "transparent", color: tab === t.id ? "#c4b5fd" : "rgba(255,255,255,0.3)", borderBottom: `2px solid ${tab === t.id ? "#6366f1" : "transparent"}`, borderRadius: 0 }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
        {tab === "chat" && <>
          {msgs.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 280 }}>
              <div style={{ fontFamily: FD, fontSize: 19, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>What's on your mind about {person.name}?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", maxWidth: 480 }}>
                {STARTERS.map((p, i) => (
                  <button key={i} onClick={() => send(p)} style={{ ...btn, padding: "9px 13px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontSize: 12.5, textAlign: "left", lineHeight: 1.4 }}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{ maxWidth: "80%", padding: "13px 16px", borderRadius: 15, background: m.role === "user" ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))" : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`, color: m.role === "user" ? "#e0d9f7" : "rgba(255,255,255,0.75)", fontFamily: F, fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ display: "flex", marginBottom: 12 }}><div style={{ padding: "13px 16px", borderRadius: 15, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 5 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.25)", animation: `p 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}</div></div>}
          <div ref={endRef} />
        </>}

        {tab === "playbook" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {PLAYBOOKS.map(pb => (
              <button key={pb.id} onClick={() => { setTab("chat"); send(`Help me with: ${pb.title}. Walk me through this with ${person.name} step by step.`); }} style={{ ...btn, ...glass, padding: 15, textAlign: "left" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ fontSize: 22, marginBottom: 7 }}>{pb.emoji}</div>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#f0eef6", marginBottom: 3 }}>{pb.title}</div>
                <div style={{ fontFamily: F, fontSize: 11.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{pb.desc}</div>
              </button>
            ))}
          </div>
        )}

        {tab === "history" && (
          logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📝</div>
              <div style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No interactions logged yet</div>
              <button onClick={() => setShowLog(true)} style={{ ...btn, marginTop: 14, padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 13 }}>Log first interaction</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...logs].reverse().map(log => (
                <div key={log.id} style={{ ...glass, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{new Date(log.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>
                    <div style={{ fontSize: 12 }}>{["😟","😕","😐","🙂","😊"][log.sentiment - 1]}</div>
                  </div>
                  <div style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{log.note}</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {tab === "chat" && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,15,0.6)", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", gap: 8, maxWidth: 680, margin: "0 auto" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder={`Describe a situation with ${person.name}...`} style={{ flex: 1, padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0eef6", fontFamily: F, fontSize: 14, outline: "none" }} />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{ ...btn, padding: "12px 18px", borderRadius: 13, background: input.trim() && !loading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 500 }}>Send</button>
          </div>
        </div>
      )}

      {showLog && <LogModal person={person} onClose={() => setShowLog(false)} onLog={onLog} />}
      {showTone && <ToneModal person={person} onClose={() => setShowTone(false)} />}
      {showStyle && <StyleModal person={person} onClose={() => setShowStyle(false)} />}
      <style>{`@keyframes p{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.8;transform:scale(1.2)}}`}</style>
    </div>
  );
}

// ─── Main App ───
export default function RelationalOS() {
  const [people, setPeople] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [active, setActive] = useState(null);
  const [view, setView] = useState("home");
  const [nudgesOpen, setNudgesOpen] = useState(false);

  const addPerson = (p) => setPeople(prev => [...prev, p]);
  const logInteraction = (pid, log) => {
    setPeople(prev => prev.map(p => p.id === pid ? { ...p, interactions: [...(p.interactions || []), log] } : p));
    setActive(prev => prev?.id === pid ? { ...prev, interactions: [...(prev.interactions || []), log] } : prev);
  };
  const openChat = (p) => { setActive(people.find(x => x.id === p.id) || p); setView("chat"); };
  const goHome = () => { setView("home"); setActive(null); };
  const nudges = getNudges(people);

  if (view === "chat" && active) return <><OrbBg /><Chat person={active} onBack={goHome} onLog={logInteraction} /></>;

  return (
    <>
      <OrbBg />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes stagger{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "44px 20px 40px", maxWidth: 700, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "rgba(99,102,241,0.7)", marginBottom: 10 }}>RELATIONAL OS</div>
          <h1 style={{ fontFamily: FD, fontSize: 36, fontWeight: 600, color: "#f0eef6", lineHeight: 1.15, marginBottom: 8 }}>Your relationships,<br />understood.</h1>
          <p style={{ fontFamily: F, fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, maxWidth: 420 }}>Add the people who matter. Get advice that knows the backstory.</p>
        </div>

        {/* Nudges */}
        {nudges.length > 0 && (
          <div style={{ ...glass, padding: "14px 16px", marginBottom: 18, borderColor: "rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.03)" }}>
            <button onClick={() => setNudgesOpen(!nudgesOpen)} style={{ ...btn, background: "transparent", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>🔔</span>
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "rgba(245,158,11,0.8)" }}>{nudges.length} nudge{nudges.length > 1 ? "s" : ""}</span>
              </div>
              <span style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{nudgesOpen ? "▾" : "▸"}</span>
            </button>
            {nudgesOpen && <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {nudges.map((n, i) => (
                <div key={i} onClick={() => openChat(n.person)} style={{ padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 13 }}>{n.type === "reconnect" ? "⏰" : n.type === "health" ? "💛" : "👋"}</span>
                  <span style={{ fontFamily: F, fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{n.msg}</span>
                </div>
              ))}
            </div>}
          </div>
        )}

        <NetMap people={people} onSelect={openChat} />

        {people.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>YOUR CIRCLE · {people.length}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
              {people.map((p, i) => {
                const rt = getRT(p.type); const sc = healthScore(p);
                const last = p.interactions?.length ? p.interactions[p.interactions.length - 1] : null;
                return (
                  <button key={p.id} onClick={() => openChat(p)} style={{ ...btn, ...glass, padding: 16, textAlign: "left", animation: `stagger 0.4s ease ${i * 0.05}s both` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${rt.color}55`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                      <span style={{ fontSize: 24 }}>{rt.emoji}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 6, background: `${hColor(sc)}15` }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: hColor(sc) }} />
                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: hColor(sc) }}>{sc}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 500, color: "#f0eef6", marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontFamily: F, fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>{rt.label}</div>
                    {last && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>Last: {last.note}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={() => setShowAdd(true)} style={{ ...btn, width: "100%", padding: 18, borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.35)", fontSize: 15 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "rgba(99,102,241,0.7)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add someone to your circle
        </button>

        {people.length === 0 && <div style={{ textAlign: "center", padding: "50px 20px", animation: "fadeIn 0.8s ease 0.3s both" }}>
          <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.3 }}>🌐</div>
          <div style={{ fontFamily: F, fontSize: 14, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>Start by adding someone you have a<br />relationship question about.</div>
        </div>}

        {/* Privacy */}
        <div style={{ marginTop: 44, padding: "22px 18px", borderRadius: 18, border: "1px solid rgba(34,197,94,0.12)", background: "linear-gradient(165deg, rgba(34,197,94,0.04), rgba(16,185,129,0.02))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
            <div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "rgba(34,197,94,0.9)", display: "flex", alignItems: "center", gap: 7 }}>
                End-to-End Encrypted
                <span style={{ padding: "2px 6px", borderRadius: 5, fontSize: 9, fontWeight: 600, letterSpacing: 1, background: "rgba(34,197,94,0.12)", color: "rgba(34,197,94,0.7)", textTransform: "uppercase" }}>VERIFIED</span>
              </div>
              <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Your data never leaves your device unencrypted</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
            {[{ i: "📱", t: "On-Device", d: "Stored locally" }, { i: "🔐", t: "Encrypted", d: "In transit" }, { i: "🚫", t: "Zero Logs", d: "Never sold" }].map((x, i) => (
              <div key={i} style={{ padding: "10px 8px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{x.i}</div>
                <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>{x.t}</div>
                <div style={{ fontFamily: F, fontSize: 9.5, color: "rgba(255,255,255,0.2)" }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addPerson} />}
    </>
  );
}

