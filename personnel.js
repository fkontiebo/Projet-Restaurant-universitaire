const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const STORAGE_KEY = "restoU.menu.week";
const STORAGE_FREQ = "restoU.freq.semaine";

document.addEventListener("DOMContentLoaded", () => {
  const thead = document.getElementById("thead");
  const tbody = document.getElementById("tbody");
  const saveBtn = document.getElementById("save");
  const exportBtn = document.getElementById("export");
  const importBtn = document.getElementById("import");
  const fileInput = document.getElementById("file-input");
  const studentsCount = document.getElementById("etudiants-count");

  let platPairs = 3;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed.platPairs === "number") {
        platPairs = Math.max(1, Math.min(6, parsed.platPairs));
      }
      return parsed.data || null;
    } catch {
      return null;
    }
  }

  function buildTable() {
  const headerRow = ["Jour"];

  // On veut 3 colonnes fixes : Plat, Garniture, Dessert
  const labels = ["Plat", "Garniture", "Dessert"];
  for (let i = 0; i < 3; i++) {
    headerRow.push(labels[i]);          // nom du plat
    headerRow.push(`Quantité ${i+1}`);  // quantité associée
  }

  thead.innerHTML = `
    <tr>
      ${headerRow.map(h => `<th>${h}</th>`).join("")}
    </tr>
  `;

    tbody.innerHTML = DAYS.map((day) => {
      let cells = [`<td>${day}</td>`];
      for (let i = 1; i <= platPairs; i++) {
        cells.push(
          `<td><input type="text" inputmode="text" name="${day}-plat-${i}" placeholder="Nom du plat" aria-label="${day} plat ${i}"></td>`
        );
        if (i !== platPairs || i === 1) {
          cells.push(
            `<td><input type="number" min="0" step="1" name="${day}-qte-${i}" placeholder="0" aria-label="${day} quantité ${i}"></td>`
          );
        }
      }
      return `<tr data-day="${day}">${cells.join("")}</tr>`;
    }).join("");

    const saved = load();
    if (saved) {
      for (const day of DAYS) {
        const row = saved[day] || {};
        for (let i = 1; i <= platPairs; i++) {
          const platInput = document.querySelector(`input[name="${day}-plat-${i}"]`);
          if (platInput && row[`plat${i}`] !== undefined) platInput.value = row[`plat${i}`] ?? "";
          const qteInput = document.querySelector(`input[name="${day}-qte-${i}"]`);
          if (qteInput && row[`qte${i}`] !== undefined) qteInput.value = row[`qte${i}`] ?? "";
        }
      }
    }
  }

  function updateStudentsChip() {
    try {
      const raw = localStorage.getItem(STORAGE_FREQ);
      if (!raw) {
        studentsCount.textContent = 0;
        return;
      }
      const freq = JSON.parse(raw);
      const total = Object.values(freq).reduce((a, b) => a + (Number(b) || 0), 0);
      studentsCount.textContent = total;
    } catch (e) {
      studentsCount.textContent = 0;
    }
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

  buildTable();
  updateStudentsChip();



  saveBtn.addEventListener("click", () => {
    const data = {};
    for (const day of DAYS) {
      data[day] = {};
      for (let i = 1; i <= platPairs; i++) {
        const plat =
          document.querySelector(`input[name="${day}-plat-${i}"]`)?.value?.trim() || "";
        const qteEl = document.querySelector(`input[name="${day}-qte-${i}"]`);
        const qte = qteEl ? Number(qteEl.value || 0) : undefined;
        data[day][`plat${i}`] = plat;
        if (qteEl) data[day][`qte${i}`] = isFinite(qte) && qte >= 0 ? qte : 0;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ platPairs, data }));
    toast("Menus enregistrés ✅");
  });

  exportBtn.addEventListener("click", () => {
    const payload =
      localStorage.getItem(STORAGE_KEY) || JSON.stringify({ platPairs, data: {} });
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menus_restoU.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.platPairs)
        platPairs = Math.max(1, Math.min(6, Number(parsed.platPairs)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      buildTable();
      toast("Menus importés 📥");
    } catch (err) {
      alert("Fichier invalide");
    } finally {
      fileInput.value = "";
    }
  });
});
