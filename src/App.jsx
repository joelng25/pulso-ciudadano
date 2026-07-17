import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Settings, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient";

const PALETTE = ["#B8862B", "#2E5339", "#7A3B69", "#3C5A78", "#8C4B2F", "#5C6B4B"];
const DEFAULT_CANDIDATES = ["Lista A", "Lista B", "Lista C", "Lista D", "Voto en blanco / Indeciso"];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function TallyGroup({ count }) {
  const fullGroups = Math.floor(count / 5);
  const remainder = count % 5;
  const groups = [];
  for (let i = 0; i < fullGroups; i++) groups.push(5);
  if (remainder > 0) groups.push(remainder);
  if (groups.length === 0) groups.push(0);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
      {groups.map((g, gi) => (
        <div key={gi} style={{ position: "relative", display: "flex", gap: "3px", alignItems: "flex-end", height: "22px" }}>
          {Array.from({ length: Math.min(g, 4) }).map((_, i) => (
            <div key={i} style={{ width: "2px", height: "20px", background: "#14213D", opacity: 0.85 }} />
          ))}
          {g === 5 && (
            <div
              style={{
                position: "absolute",
                left: "-2px",
                top: "10px",
                width: "26px",
                height: "2px",
                background: "#B8862B",
                transform: "rotate(-32deg)",
                transformOrigin: "left center",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("landing");
  const [candidates, setCandidates] = useState(DEFAULT_CANDIDATES);
  const [form, setForm] = useState({ name: "", email: "", region: "" });
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [myChoice, setMyChoice] = useState(null);
  const [votes, setVotes] = useState([]);
  const [votesLoading, setVotesLoading] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from("candidates")
        .select("label")
        .order("sort_order", { ascending: true });
      if (!err && data && data.length > 0) {
        setCandidates(data.map((d) => d.label));
      }
    })();
  }, []);

  const loadVotes = useCallback(async () => {
    setVotesLoading(true);
    const { data, error: err } = await supabase
      .from("votes")
      .select("name, email, region, candidate, created_at");
    if (!err && data) setVotes(data);
    setVotesLoading(false);
  }, []);

  useEffect(() => {
    if (step === "done" || step === "results") loadVotes();
  }, [step, loadVotes]);

  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.region.trim()) {
      setError("Completa los tres campos para continuar.");
      return;
    }
    setBusy(true);
    try {
      const email = normalizeEmail(form.email);
      const { data, error: err } = await supabase
        .from("votes")
        .select("candidate")
        .eq("email", email)
        .maybeSingle();
      if (err) throw err;
      if (data) {
        setMyChoice(data.candidate);
        setStep("done");
      } else {
        setStep("vote");
      }
    } catch (e) {
      setError("No pudimos verificar tu registro. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const handleVoteSubmit = async () => {
    if (!selected) {
      setError("Elige una opción antes de continuar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const email = normalizeEmail(form.email);
      const { error: err } = await supabase.from("votes").insert({
        name: form.name.trim(),
        email,
        region: form.region.trim(),
        candidate: selected,
      });
      if (err) {
        // 23505 = violación de restricción única (ese correo ya votó)
        if (err.code === "23505") {
          const { data } = await supabase
            .from("votes")
            .select("candidate")
            .eq("email", email)
            .maybeSingle();
          setMyChoice(data ? data.candidate : selected);
          setStep("done");
          return;
        }
        throw err;
      }
      setMyChoice(selected);
      setStep("done");
    } catch (e) {
      setError("No pudimos registrar tu voto. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddCandidate = async () => {
    const label = newCandidate.trim();
    if (!label) return;
    const { error: err } = await supabase
      .from("candidates")
      .insert({ label, sort_order: candidates.length + 1 });
    if (!err) {
      setCandidates((prev) => {
        const withoutBlank = prev.filter((c) => !c.startsWith("Voto en blanco"));
        return [...withoutBlank, label, "Voto en blanco / Indeciso"];
      });
      setNewCandidate("");
    } else {
      setError("No se pudo añadir la lista.");
    }
  };

  const tallies = candidates.map((c) => ({
    name: c,
    count: votes.filter((v) => v.candidate === c).length,
  }));
  const totalVotes = votes.length;

  const regionMap = {};
  votes.forEach((v) => {
    const r = v.region || "Sin región";
    regionMap[r] = (regionMap[r] || 0) + 1;
  });
  const regionEntries = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ minHeight: "100%", background: "#EEF0E9", color: "#14213D", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .pc-display { font-family: 'Fraunces', serif; }
        .pc-mono { font-family: 'IBM Plex Mono', monospace; }
        .pc-btn { transition: transform .15s ease, box-shadow .15s ease; }
        .pc-btn:hover { transform: translateY(-1px); }
        .pc-card { transition: border-color .15s ease, box-shadow .15s ease; }
        .pc-ballot:hover { border-color: #B8862B !important; }
        input:focus, button:focus-visible { outline: 2px solid #B8862B; outline-offset: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .pc-btn, .pc-card { transition: none; } }
      `}</style>

      <div style={{ borderBottom: "1px solid #D7D9CD", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#B8862B" }} />
          <span className="pc-display" style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Pulso Ciudadano
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setStep("results")}
            className="pc-mono"
            style={{ fontSize: "12px", background: "none", border: "none", color: "#14213D", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Ver resultados
          </button>
          <button
            onClick={() => setAdminOpen((o) => !o)}
            aria-label="Modo administrador"
            style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, padding: "4px" }}
          >
            <Settings size={16} color="#14213D" />
          </button>
        </div>
      </div>

      {adminOpen && (
        <div style={{ background: "#14213D", color: "#EEF0E9", padding: "12px 24px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <span className="pc-mono" style={{ fontSize: "12px", opacity: 0.8 }}>Añadir lista/candidatura:</span>
          <input
            value={newCandidate}
            onChange={(e) => setNewCandidate(e.target.value)}
            placeholder="Nombre de la lista"
            style={{ padding: "6px 10px", borderRadius: "4px", border: "none", fontSize: "13px", minWidth: "180px" }}
          />
          <button
            onClick={handleAddCandidate}
            className="pc-btn"
            style={{ background: "#B8862B", color: "#14213D", border: "none", padding: "6px 14px", borderRadius: "4px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            Añadir
          </button>
        </div>
      )}

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px" }}>
        {step === "landing" && (
          <div style={{ padding: "72px 0 56px" }}>
            <div className="pc-mono" style={{ fontSize: "12px", letterSpacing: "0.08em", color: "#8C4B2F", marginBottom: "18px", textTransform: "uppercase" }}>
              Encuesta de opinión · No oficial
            </div>
            <h1 className="pc-display" style={{ fontSize: "48px", lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 20px" }}>
              Antes de que cuenten los votos, cuéntanos el tuyo.
            </h1>
            <p style={{ fontSize: "17px", lineHeight: 1.6, color: "#3A4258", maxWidth: "560px", margin: "0 0 32px" }}>
              Un sondeo de opinión abierto sobre las próximas elecciones. Regístrate, marca tu preferencia
              y observa cómo se acumulan las papeletas en tiempo real, lista por lista.
            </p>
            <button
              onClick={() => setStep("register")}
              className="pc-btn"
              style={{ background: "#14213D", color: "#EEF0E9", border: "none", padding: "13px 26px", borderRadius: "3px", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              Registrarme para opinar <ChevronRight size={16} />
            </button>

            <div style={{ marginTop: "56px", padding: "20px 22px", background: "#fff", border: "1px solid #D7D9CD", borderRadius: "4px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <ShieldCheck size={18} color="#2E5339" style={{ flexShrink: 0, marginTop: "2px" }} />
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#3A4258", margin: 0 }}>
                  Este sitio recoge opiniones con fines de sondeo público y no sustituye ni forma parte de
                  ningún proceso electoral oficial. Un correo, un voto: si vuelves a registrarte con el mismo
                  correo verás la elección que ya marcaste.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "register" && (
          <div style={{ padding: "56px 0" }}>
            <h2 className="pc-display" style={{ fontSize: "30px", fontWeight: 600, margin: "0 0 8px" }}>Regístrate</h2>
            <p style={{ color: "#3A4258", fontSize: "14px", margin: "0 0 28px" }}>
              Solo lo usamos para evitar votos duplicados y agrupar resultados por región.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "420px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "6px" }}>
                Nombre completo
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ padding: "11px 12px", border: "1px solid #C7CABB", borderRadius: "3px", fontSize: "14px", fontFamily: "'Inter', sans-serif" }}
                  placeholder="Tu nombre y apellido"
                />
              </label>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "6px" }}>
                Correo electrónico
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRegisterSubmit(e); }}
                  style={{ padding: "11px 12px", border: "1px solid #C7CABB", borderRadius: "3px", fontSize: "14px", fontFamily: "'Inter', sans-serif" }}
                  placeholder="tucorreo@ejemplo.com"
                />
              </label>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "6px" }}>
                Región / ciudad
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRegisterSubmit(e); }}
                  style={{ padding: "11px 12px", border: "1px solid #C7CABB", borderRadius: "3px", fontSize: "14px", fontFamily: "'Inter', sans-serif" }}
                  placeholder="Ej: Badalona"
                />
              </label>

              {error && <div style={{ color: "#8C4B2F", fontSize: "13px" }}>{error}</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={handleRegisterSubmit}
                  disabled={busy}
                  className="pc-btn"
                  style={{ background: "#14213D", color: "#EEF0E9", border: "none", padding: "12px 22px", borderRadius: "3px", fontSize: "14px", fontWeight: 600, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {busy && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  Continuar
                </button>
                <button type="button" onClick={() => setStep("landing")} style={{ background: "none", border: "none", color: "#3A4258", fontSize: "14px", cursor: "pointer" }}>
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "vote" && (
          <div style={{ padding: "56px 0" }}>
            <h2 className="pc-display" style={{ fontSize: "30px", fontWeight: 600, margin: "0 0 8px" }}>Marca tu papeleta</h2>
            <p style={{ color: "#3A4258", fontSize: "14px", margin: "0 0 28px" }}>Elige una opción. Solo puedes votar una vez.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "460px" }}>
              {candidates.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelected(c)}
                  className="pc-card pc-ballot"
                  style={{
                    textAlign: "left",
                    padding: "16px 18px",
                    borderRadius: "4px",
                    border: selected === c ? "2px solid #B8862B" : "1px solid #C7CABB",
                    background: selected === c ? "#FBF6EA" : "#fff",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: 500,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {c}
                  <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #14213D", background: selected === c ? "#14213D" : "transparent", flexShrink: 0 }} />
                </button>
              ))}
            </div>

            {error && <div style={{ color: "#8C4B2F", fontSize: "13px", marginTop: "14px" }}>{error}</div>}

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={handleVoteSubmit}
                disabled={busy}
                className="pc-btn"
                style={{ background: "#14213D", color: "#EEF0E9", border: "none", padding: "12px 22px", borderRadius: "3px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                {busy ? "Enviando…" : "Emitir mi opinión"}
              </button>
              <button onClick={() => setStep("register")} style={{ background: "none", border: "none", color: "#3A4258", fontSize: "14px", cursor: "pointer" }}>
                Volver
              </button>
            </div>
          </div>
        )}

        {(step === "done" || step === "results") && (
          <div style={{ padding: "56px 0 72px" }}>
            {step === "done" && myChoice && (
              <div style={{ marginBottom: "36px", padding: "18px 20px", background: "#F2F6EE", border: "1px solid #C7D6BC", borderRadius: "4px" }}>
                <span className="pc-mono" style={{ fontSize: "12px", color: "#2E5339" }}>REGISTRADO</span>
                <p style={{ margin: "6px 0 0", fontSize: "15px" }}>
                  Tu opinión quedó marcada como <strong>{myChoice}</strong>. Gracias por participar.
                </p>
              </div>
            )}

            <h2 className="pc-display" style={{ fontSize: "30px", fontWeight: 600, margin: "0 0 4px" }}>Resultados en vivo</h2>
            <p className="pc-mono" style={{ fontSize: "12px", color: "#3A4258", margin: "0 0 32px" }}>
              {votesLoading ? "Actualizando…" : `${totalVotes} papeleta${totalVotes === 1 ? "" : "s"} contabilizada${totalVotes === 1 ? "" : "s"}`}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "40px" }}>
              {tallies.map((t) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <div style={{ width: "150px", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>{t.name}</div>
                  <TallyGroup count={t.count} />
                  <div className="pc-mono" style={{ fontSize: "12px", color: "#8C4B2F", marginLeft: "auto" }}>{t.count}</div>
                </div>
              ))}
            </div>

            {totalVotes > 0 && (
              <div style={{ height: "260px", marginBottom: "40px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tallies} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D7D9CD" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#3A4258" }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "#14213D" }} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "4px", border: "1px solid #D7D9CD" }} />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                      {tallies.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {regionEntries.length > 0 && (
              <div>
                <h3 className="pc-mono" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#3A4258", margin: "0 0 12px" }}>
                  Participación por región
                </h3>
                <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #D7D9CD" }}>
                  {regionEntries.map(([region, count]) => (
                    <div key={region} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #D7D9CD", fontSize: "14px" }}>
                      <span>{region}</span>
                      <span className="pc-mono" style={{ color: "#8C4B2F" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: "32px", display: "flex", gap: "14px" }}>
              <button onClick={loadVotes} style={{ background: "none", border: "1px solid #C7CABB", padding: "9px 16px", borderRadius: "3px", fontSize: "13px", cursor: "pointer" }}>
                Actualizar resultados
              </button>
              {step === "results" && (
                <button onClick={() => setStep("register")} style={{ background: "none", border: "none", color: "#3A4258", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
                  Participar en la encuesta
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #D7D9CD", padding: "20px 24px", textAlign: "center" }}>
        <span className="pc-mono" style={{ fontSize: "11px", color: "#8B8E7E" }}>
          Pulso Ciudadano — sondeo de opinión independiente, sin afiliación oficial.
        </span>
      </div>
    </div>
  );
}
