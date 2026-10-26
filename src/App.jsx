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
import { ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

import { SPAIN_REGIONS, CANARIAS_REGION, SPAIN_MAP_SIZE, CANARIAS_MAP_SIZE } from "./spainMapData";

const PALETTE = ["#B8862B", "#2E5339", "#7A3B69", "#3C5A78", "#8C4B2F", "#5C6B4B"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CANDIDATES = ["PP", "PSOE", "Vox", "Sumar", "Podemos", "Se Acabó La Fiesta", "Voto en blanco / Indeciso"];
// A candidatura without regions stands nationwide; otherwise only in its comunidades.
export function isCandidateAvailable(label, region, regionsByLabel) {
  const allowed = regionsByLabel[label];
  if (!allowed) return true;
  return Boolean(region) && allowed.includes(region);
}

const COMUNIDADES_AUTONOMAS = [
  "Andalucía",
  "Aragón",
  "Asturias",
  "Islas Baleares",
  "Canarias",
  "Cantabria",
  "Castilla-La Mancha",
  "Castilla y León",
  "Cataluña",
  "Extremadura",
  "Galicia",
  "La Rioja",
  "Comunidad de Madrid",
  "Región de Murcia",
  "Navarra",
  "País Vasco",
  "Comunidad Valenciana",
  "Ceuta",
  "Melilla",
];

function SpainMap({ regionWinners, regionCounts, candidateColors, candidates }) {
  const [hovered, setHovered] = useState(null);
  const [picked, setPicked] = useState(null);
  const focus = picked || hovered;

  function colorFor(name) {
    const winner = regionWinners[name];
    if (!winner) return "#DEDCCB";
    const idx = candidates.indexOf(winner);
    return candidateColors[winner] || PALETTE[idx >= 0 ? idx % PALETTE.length : 0];
  }

  const canariasBoxPad = 10;
  const canariasBoxX = 8;
  const canariasBoxY = SPAIN_MAP_SIZE.height + 26;
  const totalWidth = SPAIN_MAP_SIZE.width;
  const totalHeight = SPAIN_MAP_SIZE.height + 26 + CANARIAS_MAP_SIZE.height + canariasBoxPad * 2 + 8;

  function regionShape(r, isCanarias) {
    const isHovered = hovered === r.name || picked === r.name;
    return (
      <g
        key={r.name}
        onMouseEnter={() => setHovered(r.name)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => setPicked((p) => (p === r.name ? null : r.name))}
        role="button"
        aria-label={`Ver resultados en ${r.name}`}
        style={{ cursor: "pointer" }}
      >
        <path
          d={r.path}
          fill={colorFor(r.name)}
          stroke={isHovered ? "#14213D" : "#EEF0E9"}
          strokeWidth={isHovered ? 1.6 : 0.8}
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "flex-start" }}>
      <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} style={{ width: "100%", maxWidth: "560px", flexShrink: 0 }}>
        {SPAIN_REGIONS.map((r) => regionShape(r, false))}

        {/* Recuadro aparte para Canarias, como en los mapas convencionales de España */}
        <rect
          x={canariasBoxX}
          y={canariasBoxY}
          width={CANARIAS_MAP_SIZE.width + canariasBoxPad * 2}
          height={CANARIAS_MAP_SIZE.height + canariasBoxPad * 2}
          fill="none"
          stroke="#C7CABB"
          strokeDasharray="3 3"
          rx="4"
        />
        <text
          x={canariasBoxX + 6}
          y={canariasBoxY - 6}
          fontSize="10"
          fontFamily="'IBM Plex Mono', monospace"
          fill="#8B8E7E"
        >
          CANARIAS
        </text>
        <g transform={`translate(${canariasBoxX + canariasBoxPad}, ${canariasBoxY + canariasBoxPad})`}>
          {regionShape(CANARIAS_REGION, true)}
        </g>
      </svg>

      <div style={{ minWidth: "180px", flex: "1 1 180px" }}>
        <h4 className="pc-mono" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#3A4258", margin: "0 0 12px" }}>
          Leyenda
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {candidates.map((c, i) => (
            <div key={c} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ width: "14px", height: "14px", borderRadius: "3px", flexShrink: 0, background: candidateColors[c] || PALETTE[i % PALETTE.length] }} />
              <span style={{ fontSize: "13px" }}>{c}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
            <span style={{ width: "14px", height: "14px", borderRadius: "3px", flexShrink: 0, background: "#DEDCCB", border: "1px solid #C7CABB" }} />
            <span style={{ fontSize: "13px", color: "#8B8E7E" }}>Sin votos todavía</span>
          </div>
        </div>

        <div style={{ marginTop: "18px", padding: "12px 14px", background: "#fff", border: "1px solid #D7D9CD", borderRadius: "4px", minHeight: "62px" }}>
          {focus ? (
            <RegionBreakdown
              region={focus}
              counts={regionCounts[focus] || {}}
              candidateColors={candidateColors}
              candidates={candidates}
              pinned={picked === focus}
              onClose={() => setPicked(null)}
            />
          ) : (
            <div style={{ fontSize: "12px", color: "#8B8E7E" }}>Pulsa una comunidad del mapa para ver todos sus resultados.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function regionResults(counts) {
  const total = Object.values(counts).reduce((a, b) => a + Number(b), 0);
  const rows = Object.entries(counts)
    .map(([name, n]) => ({ name, count: Number(n), pct: total ? (Number(n) * 100) / total : 0 }))
    .sort((a, b) => b.count - a.count);
  return { total, rows };
}

function RegionBreakdown({ region, counts, candidateColors, candidates, pinned, onClose }) {
  const { total, rows } = regionResults(counts);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
        <div style={{ fontWeight: 700, fontSize: "13px" }}>{region}</div>
        {pinned && (
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "12px", color: "#3A4258", cursor: "pointer", textDecoration: "underline" }}>
            Cerrar
          </button>
        )}
      </div>
      <div className="pc-mono" style={{ fontSize: "11px", color: "#8B8E7E", margin: "2px 0 10px" }}>
        {total} voto{total === 1 ? "" : "s"}
      </div>
      {total === 0 ? (
        <div style={{ fontSize: "12px", color: "#3A4258" }}>Todavía sin votos registrados.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {rows.map((r) => {
            const idx = candidates.indexOf(r.name);
            const color = candidateColors[r.name] || PALETTE[idx >= 0 ? idx % PALETTE.length : 0];
            return (
              <div key={r.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span>{r.name}</span>
                  <span className="pc-mono" style={{ color: "#8C4B2F" }}>{r.pct.toFixed(1)}% · {r.count}</span>
                </div>
                <div style={{ height: "5px", background: "#EEF0E9", borderRadius: "3px", marginTop: "3px" }}>
                  <div style={{ width: `${r.pct}%`, height: "100%", background: color, borderRadius: "3px", border: color.toLowerCase().startsWith("#fff") ? "1px solid #C7CABB" : "none" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
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
  const [candidateColors, setCandidateColors] = useState({});
  const [candidateRegions, setCandidateRegions] = useState({});
  const [form, setForm] = useState({ name: "", email: "", region: "" });
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [myChoice, setMyChoice] = useState(null);
  const [isEditingVote, setIsEditingVote] = useState(false);
  const [votes, setVotes] = useState([]);
  const [votesLoading, setVotesLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { data, error: err } = await supabase
        .from("candidates")
        .select("label, color, regions")
        .order("sort_order", { ascending: true });
      if (err) {
        // Database without the regional column yet: everything is nationwide.
        ({ data, error: err } = await supabase
          .from("candidates")
          .select("label, color")
          .order("sort_order", { ascending: true }));
      }
      if (!err && data && data.length > 0) {
        setCandidates(data.map((d) => d.label));
        const colorMap = {};
        data.forEach((d) => {
          if (d.color) colorMap[d.label] = d.color;
        });
        setCandidateColors(colorMap);
        const regionMap = {};
        data.forEach((d) => {
          if (Array.isArray(d.regions) && d.regions.length > 0) regionMap[d.label] = d.regions;
        });
        setCandidateRegions(regionMap);
      }
    })();
  }, []);

  const loadVotes = useCallback(async () => {
    setVotesLoading(true);
    const { data, error: err } = await supabase.rpc("vote_results");
    if (!err && data) setVotes(data);
    else setError("No se pudieron cargar los recuentos. Revisa la configuración segura del servicio.");
    setVotesLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Cuando llega una sesión de Google, precargamos nombre/correo y pasamos
  // directo al paso de registro (solo falta pedir la región).
  useEffect(() => {
    if (session?.user) {
      const gName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        "";
      setForm((f) => ({ ...f, name: f.name || gName, email: session.user.email || "" }));
      if (step === "landing") setStep("register");
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleLogin = async () => {
    setError("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setForm({ name: "", email: "", region: "" });
    setIsEditingVote(false);
    setStep("landing");
  };

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
    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError("Escribe un correo electrónico válido (ej: nombre@ejemplo.com).");
      return;
    }
    if (!session?.user) { setError("Inicia sesión con Google para verificar tu cuenta."); return; }
    setBusy(true);
    try {
      const { data: rows, error: err } = await supabase.rpc("my_vote");
      const data = rows?.[0];
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
    if (!selected || !isCandidateAvailable(selected, form.region, candidateRegions)) {
      setSelected(null);
      setError("Elige una opción antes de continuar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Inicia sesión con una cuenta verificada.");
      const { error: err } = await supabase.rpc("cast_vote", {
        voter_name: form.name.trim(),
        voter_region: form.region.trim(),
        selected_candidate: selected,
      });
      if (err) throw err;
      setMyChoice(selected);
      setIsEditingVote(false);
      setStep("done");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error al guardar el voto:", e);
      if (e && (e.code === "42501" || /row-level security|permission denied/i.test(e.message || ""))) {
        setError(
          "La cuenta no tiene permiso para este voto. Revisa la configuración segura; no habilites escrituras públicas."
        );
      } else {
        setError(`No pudimos registrar tu voto. Intenta de nuevo.${e?.message ? ` (${e.message})` : ""}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleStartEditVote = () => {
    setSelected(myChoice);
    setError("");
    setIsEditingVote(true);
    setStep("vote");
  };

  const ballotCandidates = candidates.filter((c) => isCandidateAvailable(c, form.region, candidateRegions));

  const tallies = candidates.map((c) => ({
    name: c,
    count: votes.filter((v) => v.candidate === c).reduce((sum,v) => sum + Number(v.vote_count),0),
  }));
  const totalVotes = votes.reduce((sum,v) => sum + Number(v.vote_count),0);

  const regionMap = {};
  votes.forEach((v) => {
    const r = v.region || "Sin región";
    regionMap[r] = (regionMap[r] || 0) + Number(v.vote_count);
  });
  const regionEntries = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);

  // Conteo de votos por candidato dentro de cada comunidad, y el candidato
  // con más votos en cada una (para colorear el mapa).
  const regionCandidateCounts = {};
  votes.forEach((v) => {
    if (!v.region) return;
    if (!regionCandidateCounts[v.region]) regionCandidateCounts[v.region] = {};
    regionCandidateCounts[v.region][v.candidate] = (regionCandidateCounts[v.region][v.candidate] || 0) + Number(v.vote_count);
  });
  const regionWinners = {};
  Object.entries(regionCandidateCounts).forEach(([region, counts]) => {
    let winner = null;
    let max = 0;
    Object.entries(counts).forEach(([candidate, count]) => {
      if (count > max) {
        max = count;
        winner = candidate;
      }
    });
    regionWinners[region] = winner;
  });

  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: "100%", background: "#EEF0E9", color: "#14213D", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: "480px", background: "#fff", border: "1px solid #D7D9CD", borderRadius: "6px", padding: "28px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#8C4B2F", marginBottom: "10px" }}>
            ⚠️ Falta configuración de Supabase
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#3A4258", margin: "0 0 12px" }}>
            No se encontraron <code>VITE_SUPABASE_URL</code> ni <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#3A4258", margin: 0 }}>
            Local: crea un archivo <code>.env</code> a partir de <code>.env.example</code>.<br />
            Desplegado (Vercel/Netlify): añade esas dos variables en la configuración
            del proyecto y vuelve a desplegar.
          </p>
        </div>
      </div>
    );
  }

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
          {session?.user && (
            <span className="pc-mono" style={{ fontSize: "11px", color: "#3A4258" }}>
              {session.user.email}
            </span>
          )}
          <button
            onClick={() => setStep("results")}
            className="pc-mono"
            style={{ fontSize: "12px", background: "none", border: "none", color: "#14213D", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Ver resultados
          </button>
          {session?.user && (
            <button
              onClick={handleLogout}
              className="pc-mono"
              style={{ fontSize: "12px", background: "none", border: "none", color: "#8C4B2F", cursor: "pointer" }}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>

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
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "320px" }}>
              <button
                onClick={handleGoogleLogin}
                className="pc-btn"
                style={{ background: "#fff", color: "#14213D", border: "1px solid #C7CABB", padding: "12px 20px", borderRadius: "3px", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
                </svg>
                Continuar con Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#8B8E7E", fontSize: "12px" }}>
                <div style={{ flex: 1, height: "1px", background: "#D7D9CD" }} />
                o
                <div style={{ flex: 1, height: "1px", background: "#D7D9CD" }} />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="pc-btn"
                style={{ background: "#14213D", color: "#EEF0E9", border: "none", padding: "13px 26px", borderRadius: "3px", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                Verificar mi cuenta <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ marginTop: "56px", padding: "20px 22px", background: "#fff", border: "1px solid #D7D9CD", borderRadius: "4px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <ShieldCheck size={18} color="#2E5339" style={{ flexShrink: 0, marginTop: "2px" }} />
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#3A4258", margin: 0 }}>
                  Este sitio recoge opiniones con fines de sondeo público y no sustituye ni forma parte de
                  ningún proceso electoral oficial. Una cuenta verificada, un voto. No garantiza una persona única: puedes tener varias cuentas.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "register" && (
          <div style={{ padding: "56px 0" }}>
            <h2 className="pc-display" style={{ fontSize: "30px", fontWeight: 600, margin: "0 0 8px" }}>
              {session?.user ? "Ya casi está" : "Regístrate"}
            </h2>
            <p style={{ color: "#3A4258", fontSize: "14px", margin: "0 0 28px" }}>
              {session?.user
                ? "Verificamos tu cuenta con Google, no tu identidad civil. Solo falta tu región."
                : "Solo lo usamos para evitar votos duplicados y agrupar resultados por región."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "420px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "6px" }}>
                Nombre completo
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!!session?.user}
                  style={{ padding: "11px 12px", border: "1px solid #C7CABB", borderRadius: "3px", fontSize: "14px", fontFamily: "'Inter', sans-serif", background: session?.user ? "#F1EFE6" : "#fff", color: session?.user ? "#6B7280" : "#14213D" }}
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
                  disabled={!!session?.user}
                  style={{ padding: "11px 12px", border: "1px solid #C7CABB", borderRadius: "3px", fontSize: "14px", fontFamily: "'Inter', sans-serif", background: session?.user ? "#F1EFE6" : "#fff", color: session?.user ? "#6B7280" : "#14213D" }}
                  placeholder="tucorreo@ejemplo.com"
                />
              </label>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "6px" }}>
                Comunidad autónoma
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  style={{
                    padding: "11px 12px",
                    border: "1px solid #C7CABB",
                    borderRadius: "3px",
                    fontSize: "14px",
                    fontFamily: "'Inter', sans-serif",
                    background: "#fff",
                    color: form.region ? "#14213D" : "#8B8E7E",
                    cursor: "pointer",
                  }}
                >
                  <option value="" disabled>
                    Selecciona tu comunidad autónoma
                  </option>
                  {COMUNIDADES_AUTONOMAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                <button
                  type="button"
                  onClick={() => (session?.user ? handleLogout() : setStep("landing"))}
                  style={{ background: "none", border: "none", color: "#3A4258", fontSize: "14px", cursor: "pointer" }}
                >
                  {session?.user ? "Usar otra cuenta" : "Volver"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "vote" && (
          <div style={{ padding: "56px 0" }}>
            <h2 className="pc-display" style={{ fontSize: "30px", fontWeight: 600, margin: "0 0 8px" }}>
              {isEditingVote ? "Cambia tu papeleta" : "Marca tu papeleta"}
            </h2>
            <p style={{ color: "#3A4258", fontSize: "14px", margin: "0 0 28px" }}>
              {isEditingVote
                ? "Elige tu nueva opción. Sustituirá el voto que ya tenías registrado."
                : "Elige una opción. Solo puedes votar una vez."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "460px" }}>
              {form.region && (
                <p style={{ color: "#3A4258", fontSize: "13px", margin: "0 0 4px" }}>
                  Candidaturas que se presentan en {form.region}.
                </p>
              )}
              {ballotCandidates.map((c) => (
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
                {busy ? "Enviando…" : isEditingVote ? "Actualizar mi voto" : "Emitir mi opinión"}
              </button>
              <button
                onClick={() => {
                  if (isEditingVote) {
                    setIsEditingVote(false);
                    setSelected(null);
                    setStep("done");
                  } else {
                    setStep("register");
                  }
                }}
                style={{ background: "none", border: "none", color: "#3A4258", fontSize: "14px", cursor: "pointer" }}
              >
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
                <p style={{ margin: "6px 0 12px", fontSize: "15px" }}>
                  Tu opinión quedó marcada como <strong>{myChoice}</strong>. Gracias por participar.
                </p>
                <button
                  onClick={handleStartEditVote}
                  className="pc-mono"
                  style={{ fontSize: "12px", background: "none", border: "1px solid #C7D6BC", padding: "7px 14px", borderRadius: "3px", color: "#2E5339", cursor: "pointer" }}
                >
                  Cambiar mi voto
                </button>
              </div>
            )}

            <h2 className="pc-display" style={{ fontSize: "30px", fontWeight: 600, margin: "0 0 4px" }}>Resultados en vivo</h2>
            <p className="pc-mono" style={{ fontSize: "12px", color: "#3A4258", margin: "0 0 32px" }}>
              {votesLoading ? "Actualizando…" : `${totalVotes} papeleta${totalVotes === 1 ? "" : "s"} contabilizada${totalVotes === 1 ? "" : "s"}`}
            </p>

            {(() => {
              const ranked = [...tallies].sort((a, b) => b.count - a.count);
              const colorOf = (name) => candidateColors[name] || PALETTE[Math.max(0, candidates.indexOf(name)) % PALETTE.length];
              const pct = (n) => (totalVotes ? (n * 100) / totalVotes : 0);
              const top = ranked.filter((t) => t.count > 0).slice(0, 3);
              return (
                <>
                  {top.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                      {top.map((t, i) => (
                        <div key={t.name} style={{ background: "#fff", border: "1px solid #D7D9CD", borderTop: `4px solid ${colorOf(t.name)}`, borderRadius: "6px", padding: "14px 16px" }}>
                          <div className="pc-mono" style={{ fontSize: "11px", color: "#8B8E7E", textTransform: "uppercase", letterSpacing: "0.06em" }}>{i + 1}.º puesto</div>
                          <div style={{ fontWeight: 700, fontSize: "15px", margin: "4px 0 2px" }}>{t.name}</div>
                          <div className="pc-display" style={{ fontSize: "30px", fontWeight: 600, lineHeight: 1.1 }}>{pct(t.count).toFixed(1)}%</div>
                          <div className="pc-mono" style={{ fontSize: "11px", color: "#3A4258" }}>{t.count} votos</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalVotes > 0 && (
                    <div aria-hidden="true" style={{ display: "flex", height: "14px", borderRadius: "7px", overflow: "hidden", marginBottom: "28px", border: "1px solid #D7D9CD" }}>
                      {ranked.filter((t) => t.count > 0).map((t) => (
                        <div key={t.name} title={`${t.name}: ${pct(t.count).toFixed(1)}%`} style={{ width: `${pct(t.count)}%`, background: colorOf(t.name) }} />
                      ))}
                    </div>
                  )}

                  <div style={{ background: "#fff", border: "1px solid #D7D9CD", borderRadius: "6px", padding: "8px 18px", marginBottom: "40px" }}>
                    {ranked.map((t, i) => (
                      <div key={t.name} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 170px) 1fr auto", alignItems: "center", gap: "14px", padding: "11px 0", borderBottom: i < ranked.length - 1 ? "1px solid #EEF0E9" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, minWidth: 0 }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, background: colorOf(t.name), border: "1px solid #C7CABB" }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                        </div>
                        <div style={{ height: "8px", background: "#EEF0E9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${pct(t.count)}%`, height: "100%", background: colorOf(t.name), borderRadius: "4px", transition: "width .6s ease" }} />
                        </div>
                        <div className="pc-mono" style={{ fontSize: "12px", textAlign: "right", minWidth: "92px" }}>
                          <strong style={{ color: "#14213D" }}>{pct(t.count).toFixed(1)}%</strong>
                          <span style={{ color: "#8B8E7E" }}> · {t.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            {totalVotes > 0 && (
              <div style={{ marginBottom: "40px" }}>
                <h3 className="pc-mono" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#3A4258", margin: "0 0 16px" }}>
                  Mapa por comunidad autónoma · pulsa para ver el detalle
                </h3>
                <SpainMap
                  regionWinners={regionWinners}
                  regionCounts={regionCandidateCounts}
                  candidateColors={candidateColors}
                  candidates={candidates}
                />
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
                <button onClick={handleGoogleLogin} style={{ background: "none", border: "none", color: "#3A4258", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
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
