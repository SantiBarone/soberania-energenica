import { energyPoints, fetchMonthlyMetrics } from "./data.js";

const monthTrack = document.querySelector("#month-track");
const pointGrid = document.querySelector("#point-grid");
const monthCount = document.querySelector("#month-count");
const currentMonthSummary = document.querySelector("#current-month-summary");
const sixMonthEnergy = document.querySelector("#six-month-energy");
const sixMonthSavings = document.querySelector("#six-month-savings");
const metricsStatus = document.querySelector("#metrics-status");
const numberFormat = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const currencyFormat = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function renderMetricSummary(monthlyMetrics) {
  const energyTotal = monthlyMetrics.reduce((total, metric) => total + metric.energy, 0);
  const savingsTotal = monthlyMetrics.reduce((total, metric) => total + metric.savings, 0);
  const currentMonth = monthlyMetrics[0];

  sixMonthEnergy.textContent = numberFormat.format(energyTotal);
  sixMonthSavings.textContent = currencyFormat.format(savingsTotal);
  currentMonthSummary.textContent =
    `${numberFormat.format(currentMonth.energy)} kWh ahorrados · ${currencyFormat.format(currentMonth.savings)} en ${currentMonth.month}`;
}

function renderMonthlyCards(monthlyMetrics) {
  const previousScrollLeft = monthTrack.scrollLeft;
  monthCount.textContent = monthlyMetrics.length;

  monthTrack.innerHTML = monthlyMetrics.map(({ month, year, energy, savings }) => `
    <article class="month-card">
      <h3>${month} de ${year}</h3>
      <div>
        <p class="month-energy">${numberFormat.format(energy)}</p>
        <p class="month-caption">kWh ahorrados</p>
      </div>
      <div>
        <p class="month-co2">${currencyFormat.format(savings)}</p>
        <p class="month-caption">Ahorro económico</p>
      </div>
    </article>
  `).join("");

  monthTrack.scrollLeft = previousScrollLeft;
  updateMonthSliderButtons();
}

function renderEnergyPoints() {
  pointGrid.innerHTML = energyPoints.map(({ name, image, address, description, link }) => `
    <a class="point-card" href="${link}" target="_blank" rel="noopener noreferrer">
      <div class="point-image-wrap">
        <img class="point-image" src="${image}" alt="${name}" loading="lazy" decoding="async">
        <p class="point-name">${name}</p>
      </div>
      <div class="point-details">
        <h3>${address}</h3>
        <p>${description}</p>
      </div>
    </a>
  `).join("");
}

let updateMonthSliderButtons = () => {};

function setupMonthSlider() {
  const buttons = document.querySelectorAll(".slider-button");
  const stepSize = () => {
    const card = monthTrack.querySelector(".month-card");
    if (!card) return monthTrack.clientWidth;
    return card.getBoundingClientRect().width + Number.parseFloat(getComputedStyle(monthTrack).columnGap || 0);
  };
  const updateButtons = () => {
    const maxScroll = monthTrack.scrollWidth - monthTrack.clientWidth - 1;
    buttons.forEach((button) => {
      button.disabled = button.dataset.direction === "previous"
        ? monthTrack.scrollLeft <= 0
        : monthTrack.scrollLeft >= maxScroll;
    });
  };
  updateMonthSliderButtons = updateButtons;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.direction === "next" ? 1 : -1;
      monthTrack.scrollBy({ left: direction * stepSize(), behavior: "smooth" });
    });
  });

  monthTrack.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();
}

function setupLazyVideos() {
  const videos = document.querySelectorAll("video[data-src]");
  if (!("IntersectionObserver" in window)) {
    videos.forEach((video) => {
      video.src = video.dataset.src;
      video.play().catch(() => {});
    });
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      video.src = video.dataset.src;
      video.play().catch(() => {});
      currentObserver.unobserve(video);
    });
  }, { rootMargin: "300px" });

  videos.forEach((video) => observer.observe(video));
}

let metricsRequestInFlight = false;
let hasLoadedMetrics = false;

async function refreshMonthlyMetrics() {
  if (metricsRequestInFlight) return;
  metricsRequestInFlight = true;

  try {
    const monthlyMetrics = await fetchMonthlyMetrics();
    renderMetricSummary(monthlyMetrics);
    renderMonthlyCards(monthlyMetrics);
    metricsStatus.textContent = `Datos actualizados: ${new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })}. Se actualizan automáticamente cada minuto.`;
    hasLoadedMetrics = true;
  } catch (error) {
    console.error("No se pudieron actualizar las métricas:", error);

    if (!hasLoadedMetrics) {
      const unavailable = "No disponible";
      sixMonthEnergy.textContent = unavailable;
      sixMonthSavings.textContent = unavailable;
      currentMonthSummary.textContent = "No se pudieron cargar las métricas de este mes.";
      monthTrack.innerHTML = "<p>No se pudieron cargar las estadísticas energéticas.</p>";
      monthCount.textContent = "0";
    }

    metricsStatus.textContent = "No se pudieron actualizar los datos. Se volverá a intentar automáticamente.";
  } finally {
    metricsRequestInFlight = false;
  }
}

function initializeWeb() {
  renderEnergyPoints();
  setupLazyVideos();
  setupMonthSlider();
  refreshMonthlyMetrics();
  window.setInterval(() => {
    if (document.visibilityState === "visible") refreshMonthlyMetrics();
  }, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshMonthlyMetrics();
  });
}

initializeWeb();
