/* ============================================
   UNIKORN GLOBAL — Quote Builder logic
   ============================================ */

// ---------- Config ----------
// TODO: replace with your own EmailJS credentials (emailjs.com)
const EMAILJS_PUBLIC_KEY = "dtxxe48IOxVnpeieh";
const EMAILJS_SERVICE_ID = "service_qy91wll";
const EMAILJS_TEMPLATE_ID_TEAM = "template_djlpd8o";
const EMAILJS_TEMPLATE_ID_CLIENT = "template_387rqwl";

const WEEKS_PER_MONTH = 4.33;

const SERVICES = [
  { id: "administration",        name: "Administration",            rate: 150, max: 20 },
  { id: "executive-assistance",  name: "Executive Assistance",      rate: 180, max: 20 },
  { id: "operations-support",    name: "Operations Support",        rate: 200, max: 20 },
  { id: "project-coordination",  name: "Project Coordination",      rate: 220, max: 15 },
  { id: "sops-documentation",    name: "SOPs & Documentation",      rate: 250, max: 15 },
  { id: "marketing-administration", name: "Marketing Administration", rate: 250, max: 15 },
  { id: "business-research",     name: "Business Research",         rate: 250, max: 15 },
  { id: "process-improvement",   name: "Process Improvement",       rate: 300, max: 10 },
  { id: "business-consulting",   name: "Business Consulting",       rate: 400, max: 10 },
];

const PACKAGES = {
  launch:   { name: "Launch",           hours: 10, price: 1500 },
  essential:{ name: "Essential",        hours: 20, price: 2900 },
  growth:   { name: "Growth",           hours: 35, price: 5100 },
  partner:  { name: "Business Partner", hours: 50, price: 7750 },
};

// ---------- State ----------
let state = {
  mode: null,          // "package" | "custom"
  selectedPackage: null,
  serviceHours: Object.fromEntries(SERVICES.map(s => [s.id, 0])), // weekly hours per service
};

// ---------- DOM refs ----------
const packageGrid = document.getElementById("packageGrid");
const stepCustom = document.getElementById("step-custom");
const serviceList = document.getElementById("serviceList");

const weeklyHoursEl = document.getElementById("weeklyHours");
const monthlyHoursEl = document.getElementById("monthlyHours");
const recommendedPackageEl = document.getElementById("recommendedPackage");
const quotePriceEl = document.getElementById("quotePrice");
const summaryTogglePriceEl = document.getElementById("summaryTogglePrice");

const summaryCard = document.getElementById("summaryCard");
const summaryToggle = document.getElementById("summaryToggle");
const summaryBody = document.getElementById("summaryBody");

const quoteForm = document.getElementById("quoteForm");
const submitButton = document.getElementById("submitButton");
const formStatus = document.getElementById("formStatus");

// ---------- Build service sliders ----------
function buildServiceCards() {
  SERVICES.forEach(service => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <div class="service-card-top">
        <div>
          <div class="service-name">${service.name}</div>
          <div class="service-rate">R${service.rate}/hour</div>
        </div>
        <div class="service-value" id="value-${service.id}">0 hrs/wk</div>
      </div>
      <input
        type="range"
        class="hours-slider"
        id="slider-${service.id}"
        min="0"
        max="${service.max}"
        step="0.5"
        value="0"
        data-service="${service.id}"
        aria-label="${service.name} weekly hours"
      >
    `;
    serviceList.appendChild(card);
  });
}

function attachSliderListeners() {
  SERVICES.forEach(service => {
    const slider = document.getElementById(`slider-${service.id}`);
    slider.addEventListener("input", () => {
      const val = parseFloat(slider.value);
      state.serviceHours[service.id] = val;
      updateSliderFill(slider);
      document.getElementById(`value-${service.id}`).textContent = `${val} hrs/wk`;
      recalculate();
    });
    updateSliderFill(slider);
  });
}

function updateSliderFill(slider) {
  const pct = (parseFloat(slider.value) / parseFloat(slider.max)) * 100;
  slider.style.setProperty("--fill", `${pct}%`);
}

// ---------- Package selection ----------
function attachPackageListeners() {
  const cards = packageGrid.querySelectorAll(".package-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      const pkg = card.dataset.package;

      if (pkg === "custom") {
        state.mode = "custom";
        state.selectedPackage = null;
        openCustomStep();
      } else {
        state.mode = "package";
        state.selectedPackage = pkg;
        closeCustomStep();
        resetSliders();
      }
      recalculate();
    });
  });
}

function openCustomStep() {
  stepCustom.classList.add("open");
  stepCustom.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCustomStep() {
  stepCustom.classList.remove("open");
}

function resetSliders() {
  SERVICES.forEach(service => {
    state.serviceHours[service.id] = 0;
    const slider = document.getElementById(`slider-${service.id}`);
    slider.value = 0;
    updateSliderFill(slider);
    document.getElementById(`value-${service.id}`).textContent = "0 hrs/wk";
  });
}

// ---------- Recommendation engine ----------
function recommendPackage(monthlyHours) {
  if (monthlyHours <= 10) return "Launch";
  if (monthlyHours <= 20) return "Essential";
  if (monthlyHours <= 35) return "Growth";
  if (monthlyHours <= 50) return "Business Partner";
  return "Custom Solution";
}

// ---------- Core calculation ----------
function recalculate() {
  let weeklyHours = 0;
  let monthlyHours = 0;
  let price = 0;
  let recommended = "—";

  if (state.mode === "package" && state.selectedPackage) {
    const pkg = PACKAGES[state.selectedPackage];
    monthlyHours = pkg.hours;
    weeklyHours = Math.round((pkg.hours / WEEKS_PER_MONTH) * 10) / 10;
    price = pkg.price;
    recommended = pkg.name;
  } else if (state.mode === "custom") {
    weeklyHours = SERVICES.reduce((sum, s) => sum + state.serviceHours[s.id], 0);
    price = SERVICES.reduce((sum, s) => sum + state.serviceHours[s.id] * WEEKS_PER_MONTH * s.rate, 0);
    monthlyHours = weeklyHours * WEEKS_PER_MONTH;
    recommended = recommendPackage(monthlyHours);
  }

  weeklyHoursEl.textContent = `${round1(weeklyHours)} hours`;
  monthlyHoursEl.textContent = `${round1(monthlyHours)} hours`;
  recommendedPackageEl.textContent = recommended;

  const roundedPrice = Math.round(price);
  quotePriceEl.innerHTML = `R${roundedPrice.toLocaleString("en-ZA")}<span>/month</span>`;
  summaryTogglePriceEl.textContent = `R${roundedPrice.toLocaleString("en-ZA")}/mo`;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// ---------- Summary panel toggle (mobile) ----------
function attachSummaryToggle() {
  summaryToggle.addEventListener("click", () => {
    const isOpen = summaryCard.classList.toggle("open");
    summaryToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// ---------- Form submission ----------
function buildQuotePayload(formData) {
  const selectedServices = state.mode === "custom"
    ? SERVICES.filter(s => state.serviceHours[s.id] > 0)
        .map(s => `${s.name}: ${state.serviceHours[s.id]} hrs/wk`)
        .join(", ")
    : "N/A (fixed package)";

  const weeklyHours = state.mode === "custom"
    ? SERVICES.reduce((sum, s) => sum + state.serviceHours[s.id], 0)
    : Math.round((PACKAGES[state.selectedPackage].hours / WEEKS_PER_MONTH) * 10) / 10;

  const monthlyHours = state.mode === "custom"
    ? weeklyHours * WEEKS_PER_MONTH
    : PACKAGES[state.selectedPackage].hours;

  const price = state.mode === "custom"
    ? SERVICES.reduce((sum, s) => sum + state.serviceHours[s.id] * WEEKS_PER_MONTH * s.rate, 0)
    : PACKAGES[state.selectedPackage].price;

  const packageName = state.mode === "custom"
    ? recommendPackage(monthlyHours) + " (Custom Bundle)"
    : PACKAGES[state.selectedPackage].name;

  return {
    company_name: formData.get("companyName"),
    contact_person: formData.get("contactPerson"),
    client_email: formData.get("email"),
    client_phone: formData.get("phone"),
    requirements: formData.get("requirements") || "—",
    selected_package: packageName,
    selected_services: selectedServices,
    weekly_hours: round1(weeklyHours),
    monthly_hours: round1(monthlyHours),
    estimated_investment: `R${Math.round(price).toLocaleString("en-ZA")}/month`,
  };
}

function attachFormHandler() {
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!state.mode || (state.mode === "package" && !state.selectedPackage)) {
      setStatus("Please choose a package or build a custom bundle first.", "error");
      document.getElementById("step-packages").scrollIntoView({ behavior: "smooth" });
      return;
    }

    const formData = new FormData(quoteForm);
    const payload = buildQuotePayload(formData);

    setLoading(true);
    setStatus("", "");

    try {
      if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_TEAM, payload, EMAILJS_PUBLIC_KEY);
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_CLIENT, payload, EMAILJS_PUBLIC_KEY);
      } else {
        // EmailJS not configured yet — log payload so the flow can still be tested.
        console.log("Quote payload (EmailJS not configured):", payload);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setStatus("Thank you! Your proposal request has been sent — check your inbox for confirmation.", "success");
      quoteForm.reset();
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong sending your request. Please try again or email us directly.", "error");
    } finally {
      setLoading(false);
    }
  });
}

function setLoading(isLoading) {
  submitButton.classList.toggle("loading", isLoading);
  submitButton.disabled = isLoading;
}

function setStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = "form-status" + (type ? ` ${type}` : "");
}

// ---------- Init ----------
function init() {
  if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
  buildServiceCards();
  attachSliderListeners();
  attachPackageListeners();
  attachSummaryToggle();
  attachFormHandler();
  recalculate();
}

document.addEventListener("DOMContentLoaded", init);
