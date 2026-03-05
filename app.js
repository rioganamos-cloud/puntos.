const SUPABASE_URL = "https://mldxqjkodyteeaafbbgy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZHhxamtvZHl0ZWVhYWZiYmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzAyNjAsImV4cCI6MjA4ODI0NjI2MH0.sUzvxyBUregItjOrjfizEhzBnV32iPRg7gBPmXAmPa0";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function obtenerPuntos30d(username) {
  const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();

  const { data, error } = await supabase
    .from("movements")
    .select("points, created_at")
    .eq("username", username)
    .gte("created_at", since);

  if (error) throw error;

  let total = 0;
  for (const m of data) total += (m.points || 0);
  return total;
}

async function ver() {
  const u = document.getElementById("userQuery").value.trim();
  if (!u) return;

  const out = document.getElementById("out");
  out.textContent = "Buscando...";

  try {
    const puntos = await obtenerPuntos30d(u);
    out.textContent = `Usuario ${u} — Puntos (últimos 30 días): ${puntos}`;
  } catch (e) {
    out.textContent = "Error: " + (e.message || "no se pudo consultar");
  }
}

document.getElementById("btnBuscar").addEventListener("click", ver);
document.getElementById("userQuery").addEventListener("keydown", (e)=>{
  if (e.key === "Enter") ver();
});
