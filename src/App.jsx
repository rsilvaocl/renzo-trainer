import { useState, useEffect, useRef, useCallback } from "react";

// ── EXERCISE DATA ────────────────────────────────────────────────────────────
const LEVELS = [
  {
    id: 1,
    name: "Vibración",
    emoji: "🐍",
    color: "#FF6B6B",
    bg: "#FFF0F0",
    desc: "Hacemos vibrar la lengua",
    exercises: [
      { target: "rrrr", display: "rrrr", hint: "Vibra la lengua contra el paladar", type: "sustained" },
      { target: "rrr", display: "rrr", hint: "Como un motor de avión", type: "sustained" },
    ],
  },
  {
    id: 2,
    name: "Sílabas /r/",
    emoji: "🎵",
    color: "#4ECDC4",
    bg: "#F0FFFE",
    desc: "La r suavecita entre vocales",
    exercises: [
      { target: "ara", display: "ara", hint: "Suave, como en 'cara'" },
      { target: "ero", display: "ero", hint: "Como en 'pero'" },
      { target: "iru", display: "iru", hint: "Inténtalo despacio" },
      { target: "oro", display: "oro", hint: "Como el metal precioso" },
    ],
  },
  {
    id: 3,
    name: "Palabras /r/",
    emoji: "🌟",
    color: "#F7DC6F",
    bg: "#FFFDE7",
    desc: "Palabras con r suave",
    exercises: [
      { target: "pera", display: "pera 🍐", hint: "La fruta amarilla" },
      { target: "loro", display: "loro 🦜", hint: "El pájaro que habla" },
      { target: "faro", display: "faro 🏠", hint: "Ilumina el mar" },
      { target: "muro", display: "muro 🧱", hint: "Una pared alta" },
      { target: "toro", display: "toro 🐂", hint: "Animal grande y fuerte" },
    ],
  },
  {
    id: 4,
    name: "Palabras /rr/",
    emoji: "🚀",
    color: "#A29BFE",
    bg: "#F3F0FF",
    desc: "La rr fuerte al inicio",
    exercises: [
      { target: "rosa", display: "rosa 🌹", hint: "Flor muy bonita" },
      { target: "rana", display: "rana 🐸", hint: "Salta al agua" },
      { target: "ropa", display: "ropa 👕", hint: "Lo que te pones" },
      { target: "rueda", display: "rueda ⚙️", hint: "Gira y gira" },
      { target: "ratón", display: "ratón 🐭", hint: "Pequeño y rápido" },
    ],
  },
  {
    id: 5,
    name: "Dífonos",
    emoji: "🏆",
    color: "#FD79A8",
    bg: "#FFF0F6",
    desc: "¡El nivel más difícil!",
    exercises: [
      { target: "tren", display: "tren 🚂", hint: "Va por las vías" },
      { target: "fresa", display: "fresa 🍓", hint: "Roja y dulce" },
      { target: "broma", display: "broma 😄", hint: "Para reírse" },
      { target: "dragón", display: "dragón 🐉", hint: "Escupe fuego" },
      { target: "primo", display: "primo 👦", hint: "Familiar tuyo" },
      { target: "frío", display: "frío 🧊", hint: "Cuando hace frío" },
    ],
  },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function checkMatch(heard, target) {
  const h = normalize(heard);
  const t = normalize(target);
  if (h === t) return "perfect";
  if (h.includes(t) || t.includes(h)) return "good";
  // Check if heard at least contains vowel structure
  const targetVowels = t.replace(/[^aeiou]/g, "");
  const heardVowels = h.replace(/[^aeiou]/g, "");
  if (targetVowels === heardVowels && targetVowels.length >= 2) return "close";
  return "miss";
}

// ── STAR COMPONENT ────────────────────────────────────────────────────────────
function Stars({ count, max = 3 }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 22, opacity: i < count ? 1 : 0.2, transition: "opacity 0.3s" }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

// ── WAVEFORM VISUALIZER ───────────────────────────────────────────────────────
function Waveform({ active, result }) {
  const bars = 20;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 48 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = active ? Math.random() * 32 + 8 : 4;
        const color =
          result === "perfect" ? "#4ECDC4" :
          result === "good" ? "#F7DC6F" :
          result === "close" ? "#FD79A8" :
          result === "miss" ? "#FF6B6B" :
          active ? "#A29BFE" : "#DDD";
        return (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: 4,
              backgroundColor: color,
              height: active ? undefined : 4,
              animation: active ? `wave ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
              transition: "background-color 0.3s",
            }}
          />
        );
      })}
    </div>
  );
}

// ── FEEDBACK OVERLAY ──────────────────────────────────────────────────────────
function FeedbackBadge({ result, heard }) {
  if (!result) return null;
  const cfg = {
    perfect: { emoji: "🎉", text: "¡Perfecto!", color: "#4ECDC4", bg: "#E8FFFD" },
    good:    { emoji: "😊", text: "¡Muy bien!", color: "#27AE60", bg: "#EAFAF1" },
    close:   { emoji: "🤏", text: "¡Casi!", color: "#F39C12", bg: "#FEF9E7" },
    miss:    { emoji: "💪", text: "Inténtalo de nuevo", color: "#E74C3C", bg: "#FDEDEC" },
  }[result];
  return (
    <div style={{
      background: cfg.bg,
      border: `2px solid ${cfg.color}`,
      borderRadius: 16,
      padding: "12px 20px",
      textAlign: "center",
      animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{ fontSize: 32 }}>{cfg.emoji}</div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18, color: cfg.color }}>{cfg.text}</div>
      {heard && (
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
          Escuché: <em>"{heard}"</em>
        </div>
      )}
    </div>
  );
}

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }) {
  return (
    <div style={{ background: "#F0F0F0", borderRadius: 999, height: 10, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${(value / max) * 100}%`,
        background: color,
        borderRadius: 999,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function RenzoTrainer() {
  const [screen, setScreen] = useState("home"); // home | level | exercise | results
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentEx, setCurrentEx] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null); // perfect|good|close|miss
  const [heardText, setHeardText] = useState("");
  const [sessionScore, setSessionScore] = useState([]);
  const [totalStars, setTotalStars] = useState(() => parseInt(localStorage.getItem("renzo_stars") || "0"));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("renzo_streak") || "0"));
  const [levelScores, setLevelScores] = useState(() => JSON.parse(localStorage.getItem("renzo_levels") || "{}"));
  const recognitionRef = useRef(null);
  const waveTimerRef = useRef(null);
  const [waveActive, setWaveActive] = useState(false);

  const level = LEVELS[currentLevel];
  const exercise = level?.exercises[currentEx];

  // Speech recognition setup
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "es-CL";
    rec.interimResults = false;
    rec.maxAlternatives = 5;

    rec.onstart = () => { setListening(true); setWaveActive(true); setResult(null); setHeardText(""); };
    rec.onend = () => { setListening(false); setWaveActive(false); };
    rec.onerror = () => { setListening(false); setWaveActive(false); };

    rec.onresult = (e) => {
      const alternatives = Array.from(e.results[0]).map(a => a.transcript.trim());
      let bestResult = "miss";
      let bestHeard = alternatives[0];
      for (const alt of alternatives) {
        const r = checkMatch(alt, exercise.target);
        if (["perfect","good","close","miss"].indexOf(r) < ["perfect","good","close","miss"].indexOf(bestResult)) {
          bestResult = r;
          bestHeard = alt;
        }
      }
      setResult(bestResult);
      setHeardText(bestHeard);
      setSessionScore(prev => [...prev, bestResult]);
      if (bestResult === "perfect" || bestResult === "good") {
        const newStars = totalStars + (bestResult === "perfect" ? 3 : 2);
        setTotalStars(newStars);
        localStorage.setItem("renzo_stars", newStars);
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [exercise, totalStars]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const nextExercise = () => {
    if (currentEx + 1 < level.exercises.length) {
      setCurrentEx(e => e + 1);
      setResult(null);
      setHeardText("");
    } else {
      // Level complete
      const goods = sessionScore.filter(s => s === "perfect" || s === "good").length;
      const pct = goods / sessionScore.length;
      const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
      const newLevelScores = { ...levelScores, [currentLevel]: Math.max(levelScores[currentLevel] || 0, stars) };
      setLevelScores(newLevelScores);
      localStorage.setItem("renzo_levels", JSON.stringify(newLevelScores));
      setScreen("results");
    }
  };

  const startLevel = (idx) => {
    setCurrentLevel(idx);
    setCurrentEx(0);
    setSessionScore([]);
    setResult(null);
    setHeardText("");
    setScreen("exercise");
  };

  // ── SCREENS ────────────────────────────────────────────────────────────────

  if (screen === "home") return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Nunito', sans-serif",
      padding: "0 0 40px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        @keyframes wave { from { height: 8px; } to { height: 36px; } }
        @keyframes popIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px 20px" }}>
        <div style={{ fontSize: 64, animation: "float 3s ease-in-out infinite" }}>🦁</div>
        <h1 style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontSize: 36,
          color: "white",
          margin: "8px 0 4px",
          textShadow: "0 2px 12px rgba(0,0,0,0.2)",
        }}>¡Hola, Renzo!</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, margin: 0 }}>
          Entrenemos la <strong>R</strong> juntos hoy 💪
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        margin: "16px 20px",
        background: "rgba(255,255,255,0.15)",
        borderRadius: 20,
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-around",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>⭐ {totalStars}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Estrellas</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>🔥 {streak}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Días seguidos</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>
            {Object.keys(levelScores).length}/{LEVELS.length}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Niveles</div>
        </div>
      </div>

      {/* Level cards */}
      <div style={{ padding: "0 20px" }}>
        <h2 style={{ color: "white", fontFamily: "'Baloo 2'", fontSize: 22, marginBottom: 12 }}>
          Elige tu misión
        </h2>
        {LEVELS.map((lvl, idx) => {
          const unlocked = idx === 0 || levelScores[idx - 1] >= 1;
          const stars = levelScores[idx] || 0;
          return (
            <div
              key={lvl.id}
              onClick={() => unlocked && startLevel(idx)}
              style={{
                background: unlocked ? "white" : "rgba(255,255,255,0.3)",
                borderRadius: 20,
                padding: "16px 20px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 16,
                cursor: unlocked ? "pointer" : "default",
                opacity: unlocked ? 1 : 0.6,
                boxShadow: unlocked ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
                transition: "transform 0.15s",
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: lvl.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
              }}>
                {unlocked ? lvl.emoji : "🔒"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: unlocked ? "#2D3436" : "#636e72" }}>
                  Nivel {lvl.id}: {lvl.name}
                </div>
                <div style={{ fontSize: 13, color: "#636e72", marginTop: 2 }}>{lvl.desc}</div>
                <div style={{ marginTop: 6 }}>
                  <Stars count={stars} />
                </div>
              </div>
              {unlocked && (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: lvl.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 900,
                  fontSize: 18,
                }}>›</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div style={{
        margin: "20px 20px 0",
        background: "rgba(255,255,255,0.15)",
        borderRadius: 16,
        padding: "14px 16px",
        color: "rgba(255,255,255,0.9)",
        fontSize: 14,
        backdropFilter: "blur(10px)",
      }}>
        💡 <strong>Consejo del día:</strong> Practica 10 minutitos cada día y verás cómo mejora tu R
      </div>
    </div>
  );

  if (screen === "exercise") return (
    <div style={{
      minHeight: "100vh",
      background: level.bg,
      fontFamily: "'Nunito', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        @keyframes wave { from { height: 8px; } to { height: 36px; } }
        @keyframes popIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Top bar */}
      <div style={{
        background: level.color,
        padding: "16px 20px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={() => setScreen("home")}
          style={{
            background: "rgba(255,255,255,0.3)",
            border: "none",
            borderRadius: 10,
            padding: "6px 12px",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 18,
          }}
        >‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>
            {level.emoji} Nivel {level.id}: {level.name}
          </div>
          <ProgressBar value={currentEx} max={level.exercises.length} color="rgba(255,255,255,0.7)" />
        </div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
          {currentEx + 1}/{level.exercises.length}
        </div>
      </div>

      {/* Exercise card */}
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Word display */}
        <div style={{
          background: "white",
          borderRadius: 28,
          padding: "32px 24px",
          textAlign: "center",
          boxShadow: `0 8px 30px ${level.color}33`,
        }}>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Di esta palabra
          </div>
          <div style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontSize: 52,
            fontWeight: 800,
            color: level.color,
            lineHeight: 1.1,
          }}>
            {exercise?.display}
          </div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 12 }}>
            💡 {exercise?.hint}
          </div>
        </div>

        {/* Waveform */}
        <div style={{
          background: "white",
          borderRadius: 20,
          padding: "16px 20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          <Waveform active={waveActive} result={result} />
          {listening && (
            <div style={{ textAlign: "center", fontSize: 13, color: "#A29BFE", fontWeight: 700, marginTop: 8 }}>
              🎤 Escuchando...
            </div>
          )}
        </div>

        {/* Feedback */}
        {result && <FeedbackBadge result={result} heard={heardText} />}

        {/* Mic button */}
        <div style={{ textAlign: "center", marginTop: "auto" }}>
          {!result ? (
            <button
              onMouseDown={startListening}
              onTouchStart={startListening}
              onMouseUp={stopListening}
              onTouchEnd={stopListening}
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: listening
                  ? "linear-gradient(135deg, #FF6B6B, #EE5A24)"
                  : `linear-gradient(135deg, ${level.color}, ${level.color}CC)`,
                border: "none",
                fontSize: 40,
                cursor: "pointer",
                boxShadow: listening
                  ? "0 0 0 16px rgba(255,107,107,0.2), 0 8px 24px rgba(255,107,107,0.4)"
                  : `0 8px 24px ${level.color}66`,
                transition: "all 0.2s",
                animation: listening ? "pulse 1s ease-in-out infinite" : "none",
              }}
            >
              🎤
            </button>
          ) : (
            <button
              onClick={nextExercise}
              style={{
                background: level.color,
                color: "white",
                border: "none",
                borderRadius: 20,
                padding: "16px 40px",
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
                boxShadow: `0 8px 20px ${level.color}66`,
              }}
            >
              {currentEx + 1 < level.exercises.length ? "Siguiente ›" : "¡Terminar! 🎉"}
            </button>
          )}
          {!listening && !result && (
            <div style={{ fontSize: 13, color: "#999", marginTop: 12 }}>
              Mantén presionado el micrófono y habla
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (screen === "results") {
    const perfects = sessionScore.filter(s => s === "perfect").length;
    const goods = sessionScore.filter(s => s === "good").length;
    const total = sessionScore.length;
    const pct = Math.round(((perfects + goods) / total) * 100);
    const finalStars = pct >= 80 ? 3 : pct >= 50 ? 2 : 1;
    const msgs = [
      ["¡Campeón total!", "🏆", "#F7DC6F"],
      ["¡Muy bien hecho!", "🌟", "#4ECDC4"],
      ["¡Sigue practicando!", "💪", "#A29BFE"],
    ];
    const [msg, msgEmoji, msgColor] = finalStars === 3 ? msgs[0] : finalStars === 2 ? msgs[1] : msgs[2];

    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
          @keyframes popIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          * { box-sizing: border-box; }
        `}</style>

        <div style={{ fontSize: 80, animation: "float 2s ease-in-out infinite" }}>{msgEmoji}</div>
        <h1 style={{ fontFamily: "'Baloo 2'", color: "white", fontSize: 36, margin: "8px 0 4px", textAlign: "center" }}>
          {msg}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: 24 }}>
          Nivel {level.id}: {level.name}
        </p>

        <div style={{
          background: "white",
          borderRadius: 28,
          padding: 28,
          width: "100%",
          maxWidth: 340,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Stars count={finalStars} />
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, textAlign: "center", color: msgColor, marginBottom: 4 }}>
            {pct}%
          </div>
          <ProgressBar value={pct} max={100} color={msgColor} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 20 }}>
            {[
              { label: "Perfectas", count: perfects, color: "#4ECDC4", emoji: "🎯" },
              { label: "Bien", count: goods, color: "#27AE60", emoji: "😊" },
              { label: "Intentos", count: total - perfects - goods, color: "#E74C3C", emoji: "🔁" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", background: "#F8F9FA", borderRadius: 14, padding: "12px 8px" }}>
                <div style={{ fontSize: 24 }}>{s.emoji}</div>
                <div style={{ fontWeight: 900, fontSize: 22, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, marginTop: 24 }}>
          {currentLevel + 1 < LEVELS.length && finalStars >= 1 && (
            <button
              onClick={() => startLevel(currentLevel + 1)}
              style={{
                background: "white",
                color: "#764ba2",
                border: "none",
                borderRadius: 16,
                padding: "16px",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              Siguiente nivel 🚀
            </button>
          )}
          <button
            onClick={() => startLevel(currentLevel)}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "2px solid rgba(255,255,255,0.4)",
              borderRadius: 16,
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Repetir nivel 🔁
          </button>
          <button
            onClick={() => setScreen("home")}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              border: "none",
              padding: "12px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return null;
}
