const DAYS_FREQ = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const STORAGE_FREQ_KEY = "restoU.freq.semaine";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("tbody");
  const totalEl = document.getElementById("kpi-total");
  const avgEl = document.getElementById("kpi-avg");
  const maxEl = document.getElementById("kpi-max");
  const saveBtn = document.getElementById("save");
  const exportBtn = document.getElementById("export");
  const importBtn = document.getElementById("import");
  const resetBtn = document.getElementById("reset");
  const file = document.getElementById("file");

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_FREQ_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function readValues() {
    const out = {};
    for (const day of DAYS_FREQ) {
      const el = document.querySelector(`input[name="${day}"]`);
      out[day] = Number(el?.value || 0);
    }
    return out;
  }

  function recalc() {
    const vals = readValues();
    const arr = Object.values(vals);
    const total = arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
    const avg = Math.round(total / Math.max(1, DAYS_FREQ.length));
    totalEl.textContent = total.toLocaleString("fr-FR");
    avgEl.textContent = avg.toLocaleString("fr-FR");

    let maxDay = "—",
      maxVal = -1;
    for (const [d, v] of Object.entries(vals)) {
      if (v > maxVal) {
        maxVal = v;
        maxDay = d + " (" + v.toLocaleString("fr-FR") + ")";
      }
    }
    maxEl.textContent = maxVal >= 0 ? maxDay : "—";
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      background: "#111",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: "999px",
      boxShadow: "0 10px 30px rgba(0,0,0,.15)",
      zIndex: "9999",
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  // Build rows
  tbody.innerHTML = DAYS_FREQ.map(
    (d) =>
      `<tr><td>${d}</td><td><input type="number" min="0" step="1" name="${d}" placeholder="0" aria-label="${d} – nombre d'étudiants"></td></tr>`
  ).join("");

  const saved = load();
  if (saved) {
    for (const [day, val] of Object.entries(saved)) {
      const el = document.querySelector(`input[name="${day}"]`);
      if (el) el.value = val;
    }
  }

  recalc();

  tbody.addEventListener("input", recalc);

  saveBtn.addEventListener("click", () => {
    localStorage.setItem(STORAGE_FREQ_KEY, JSON.stringify(readValues()));
    toast("Enregistré ✅");
  });

  exportBtn.addEventListener("click", () => {
    const payload = JSON.stringify(readValues(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "frequentation_restoU.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => file.click());

  file.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      for (const day of DAYS_FREQ) {
        const el = document.querySelector(`input[name="${day}"]`);
        if (el) el.value = Number(obj[day] || 0);
      }
      recalc();
      toast("Importé 📥");
    } catch {
      alert("Fichier invalide");
    }
    file.value = "";
  });

  resetBtn.addEventListener("click", () => {
    if (!confirm("Réinitialiser les valeurs ?")) return;
    for (const day of DAYS_FREQ) {
      const el = document.querySelector(`input[name="${day}"]`);
      if (el) el.value = "";
    }
    localStorage.removeItem(STORAGE_FREQ_KEY);
    recalc();
  });
});
