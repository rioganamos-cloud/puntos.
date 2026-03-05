const SUPABASE_URL = "https://mldxqjkodyteeaafbbgy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZHhxamtvZHl0ZWVhYWZiYmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzAyNjAsImV4cCI6MjA4ODI0NjI2MH0.sUzvxyBUregItjOrjfizEhzBnV32iPRg7gBPmXAmPa0";

window.sb = window.sb || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function categoria(p) {
  if (p >= 1000) return "LEYENDA";
  if (p >= 400) return "DIAMANTE";
  if (p >= 150) return "ORO";
  if (p >= 50) return "PLATA";
  return "BRONCE";
}

function progreso(p) {
  if (p >= 1000) return { next: null, faltan: 0, pct: 100 };

  let base = 0, target = 50, next = "PLATA";
  if (p >= 50) { base = 50; target = 150; next = "ORO"; }
  if (p >= 150) { base = 150; target = 400; next = "DIAMANTE"; }
  if (p >= 400) { base = 400; target = 1000; next = "LEYENDA"; }

  const rango = Math.max(1, target - base);
  const avanz = Math.min(rango, Math.max(0, p - base));
  const pct = Math.round((avanz / rango) * 100);

  return { next, faltan: Math.max(0, target - p), pct };
}

async function puntos30d(username) {
  const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();

  const { data, error } = await window.sb
    .from("movements")
    .select("points, created_at, type, amount_ars")
    .eq("username", username)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) throw error;

  let total = 0;
  for (const m of data) total += (m.points || 0);

  return { total, movimientos: data.slice(0, 10) };
}

async function verPuntos() {
  const inp = document.getElementById("userQuery");
  const box = document.getElementById("resBox");
  const title = document.getElementById("resTitle");
  const text = document.getElementById("resText");
  const progFill = document.getElementById("resProg");
  const progText = document.getElementById("resProgText");
  const movList = document.getElementById("movList");

  const u = (inp?.value || "").trim();
  if (!u) return;

  box.style.display = "block";
  title.textContent = "Buscando...";
  text.textContent = "";
  progFill.style.width = "0%";
  progText.textContent = "";
  movList.innerHTML = "";

  try {
    const { total, movimientos } = await puntos30d(u);
    const cat = categoria(total);
    const pr = progreso(total);

    title.textContent = `${u} — ${cat}`;
    text.textContent = `Puntos (últimos 30 días): ${total}`;

    progFill.style.width = `${pr.pct}%`;
    progText.textContent = pr.next
      ? `Te faltan ${pr.faltan} puntos para ${pr.next} (${pr.pct}%)`
      : `Nivel máximo alcanzado (100%)`;

    // Movimientos
    if (movimientos.length === 0) {
      movList.innerHTML = `<li class="muted">No hay movimientos en los últimos 30 días.</li>`;
    } else {
      movList.innerHTML = movimientos.map(m => {
        const fecha = new Date(m.created_at).toLocaleString();
        const sign = m.points >= 0 ? "+" : "";
        const extra = m.type === "CARGA" ? ` ($${m.amount_ars})` : "";
        return `<li>${fecha} — ${m.type}${extra} — <strong>${sign}${m.points}</strong></li>`;
      }).join("");
    }

  } catch (e) {
    title.textContent = "Error";
    text.textContent = e.message || "No se pudo consultar.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnBuscar");
  const inp = document.getElementById("userQuery");
  if (btn) btn.addEventListener("click", verPuntos);
  if (inp) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") verPuntos(); });
});
