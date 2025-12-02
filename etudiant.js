const DAYS_ETU = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const STORAGE_MENUS = "restoU.menu.week";
const STORAGE_RESA = "restoU.reservations";
const STORAGE_FREQ = "restoU.freq.semaine";

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("track");
  const dotsContainer = document.getElementById("dots");
  const selectJour = document.getElementById("jour");
  const pubEl = document.getElementById("date-pub");
  const majEl = document.getElementById("date-maj");
  const form = document.getElementById("resa-form");
  const okAlert = document.getElementById("alert-ok");
  const errAlert = document.getElementById("alert-err");
  const prevBtn = document.querySelector(".nav-prev");
  const nextBtn = document.querySelector(".nav-next");

  function loadMenus() {
    try {
      const raw = localStorage.getItem(STORAGE_MENUS);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.data || null;
    } catch {
      return null;
    }
  }

  function splitItems(str) {
    return (str || "")
      .split(/[;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const menuData = loadMenus() || {};
  let slidesHTML = "";

  DAYS_ETU.forEach((day) => {
    const row = menuData[day] || {};
    const plats = splitItems(row.plat1);
    const garnitures = splitItems(row.plat2);
    const desserts = splitItems(row.plat3);

    const renderList = (items) => {
      if (!items.length) return '<div class="empty">Non renseigné</div>';
      return "<ul>" + items.map((it) => `<li>${it}</li>`).join("") + "</ul>";
    };

    slidesHTML += `
      <article class="slide" data-day="${day}">
        <div class="slide-header">
          <h3>${day}</h3>
          <span class="chip-day">Service midi</span>
        </div>
        <div class="menu-columns">
          <div class="menu-block">
            <h4>Plat</h4>
            ${renderList(plats)}
          </div>
          <div class="menu-block">
            <h4>Garniture</h4>
            ${renderList(garnitures)}
          </div>
          <div class="menu-block">
            <h4>Dessert</h4>
            ${renderList(desserts)}
          </div>
        </div>
      </article>`;
  });

  track.innerHTML = slidesHTML;
  dotsContainer.innerHTML = DAYS_ETU.map(
    (d, i) => `<span class="dot${i === 0 ? " active" : ""}" data-index="${i}"></span>`
  ).join("");

  const dots = [...document.querySelectorAll(".dot")];
  let currentIndex = 0;
  let startX = null,
    isDragging = false,
    currentTranslate = 0,
    lastTranslate = 0;

  function updateCarousel() {
    currentTranslate = -currentIndex * track.clientWidth;
    track.style.transform = `translateX(${currentTranslate}px)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === currentIndex));
    if (selectJour && !selectJour.value) selectJour.value = DAYS_ETU[currentIndex];
  }

  function goTo(index) {
    const max = DAYS_ETU.length - 1;
    currentIndex = Math.max(0, Math.min(max, index));
    updateCarousel();
  }

  prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
  nextBtn.addEventListener("click", () => goTo(currentIndex + 1));
  dots.forEach((dot) =>
    dot.addEventListener("click", () => goTo(Number(dot.dataset.index)))
  );

  track.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    lastTranslate = currentTranslate;
    track.style.transition = "none";
  });

  window.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = "transform .28s ease";
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 50) {
      diff < 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
    } else updateCarousel();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    currentTranslate = lastTranslate + diff;
    track.style.transform = `translateX(${currentTranslate}px)`;
  });

  track.addEventListener("touchstart", (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    lastTranslate = currentTranslate;
    track.style.transition = "none";
  });

  track.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    currentTranslate = lastTranslate + diff;
    track.style.transform = `translateX(${currentTranslate}px)`;
  });

  track.addEventListener("touchend", (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = "transform .28s ease";
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      diff < 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
    } else updateCarousel();
  });

  window.addEventListener("resize", updateCarousel);

  // Remplir le select des jours
  DAYS_ETU.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    selectJour.appendChild(opt);
  });

  // Dates publi / maj
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  pubEl.textContent = formatter.format(now);
  majEl.textContent = formatter.format(now);

  function showAlert(el) {
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 2500);
  }

  function updateFreqFromReservation(resa) {
    try {
      const raw = localStorage.getItem(STORAGE_FREQ);
      let freq = raw ? JSON.parse(raw) : {};
      const day = resa.jour;
      const nb = Math.max(0, Number(resa.nb) || 0);
      if (!DAYS_ETU.includes(day)) return;
      if (typeof freq[day] !== "number") freq[day] = 0;
      freq[day] += nb;
      localStorage.setItem(STORAGE_FREQ, JSON.stringify(freq));
    } catch (e) {
      console.error("Erreur updateFreqFromReservation", e);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errAlert.style.display = "none";
    okAlert.style.display = "none";

    if (!form.checkValidity()) {
      errAlert.style.display = "block";
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.date = new Date().toISOString();

    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_RESA) || "[]");
      existing.push(data);
      localStorage.setItem(STORAGE_RESA, JSON.stringify(existing));

      updateFreqFromReservation(data);

      form.reset();
      selectJour.value = DAYS_ETU[currentIndex];
      showAlert(okAlert);
    } catch (err) {
      console.error(err);
      showAlert(errAlert);
    }
  });

  updateCarousel();
});
