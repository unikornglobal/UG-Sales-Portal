/* ============================================
   UNIKORN GLOBAL — Business Capacity Check logic
   ============================================ */

// ---------- Config ----------
// Reuses the same EmailJS account AND the same "UG Quote Request" team
// template as the Quote Builder (template_djlpd8o) — so results land in
// your inbox in the same familiar layout, no new template needed.
const EMAILJS_PUBLIC_KEY = "dtxxe48IOxVnpeieh";
const EMAILJS_SERVICE_ID = "service_qy91wll";
const EMAILJS_TEMPLATE_ID_QUIZ = "template_djlpd8o";

const RATING_OPTIONS = [
  { value: 0, emoji: "✅", label: "Never" },
  { value: 1, emoji: "🟡", label: "Sometimes" },
  { value: 2, emoji: "🟠", label: "Often" },
  { value: 3, emoji: "🔴", label: "Almost Always" },
];

const CATEGORIES = [
  {
    id: "admin",
    name: "Executive & Administrative Support",
    hook: "\u201cI spend too much time on admin instead of growing my business.\u201d",
    statements: [
      "Emails and paperwork pile up.",
      "I struggle to keep my calendar and appointments organised.",
      "Important tasks sometimes get forgotten.",
      "I work after hours just to catch up.",
    ],
  },
  {
    id: "operations",
    name: "Business Operations",
    hook: "\u201cMy business feels disorganised.\u201d",
    statements: [
      "We don't have clear systems or processes.",
      "Staff do things differently every time.",
      "I constantly have to solve the same problems.",
      "Things slow down when I'm not available.",
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Brand Support",
    hook: "\u201cMy business isn't attracting enough customers.\u201d",
    statements: [
      "I struggle to market consistently.",
      "Our social media is inactive.",
      "We don't have professional marketing material.",
      "We rely mostly on word of mouth.",
    ],
  },
  {
    id: "projects",
    name: "Project Coordination",
    hook: "\u201cProjects don't always get finished smoothly.\u201d",
    statements: [
      "Deadlines are often missed.",
      "Different people don't communicate well.",
      "I struggle to keep track of everything.",
      "Projects become stressful.",
    ],
  },
  {
    id: "sales",
    name: "Sales & Customer Support",
    hook: "\u201cWe're losing opportunities.\u201d",
    statements: [
      "Customer enquiries wait too long.",
      "Follow-ups don't always happen.",
      "Quotes are delayed.",
      "We don't have a clear sales process.",
    ],
  },
  {
    id: "finance",
    name: "Finance & Business Administration",
    hook: "\u201cMy business finances feel reactive.\u201d",
    statements: [
      "Invoices are sent late.",
      "I don't always know who owes me money.",
      "Paperwork builds up.",
      "Financial admin causes stress.",
    ],
  },
  {
    id: "compliance",
    name: "Health, Safety & Compliance",
    hook: "\u201cI'm not confident we're fully compliant.\u201d",
    statements: [
      "Safety documentation isn't always up to date.",
      "Staff haven't received recent training.",
      "We only think about compliance when there's a problem.",
      "I'm unsure what legal requirements apply.",
    ],
  },
  {
    id: "strategy",
    name: "Business Strategy & Growth",
    hook: "\u201cI know where I want to go, but I struggle to get there.\u201d",
    statements: [
      "I spend all my time working in the business.",
      "I don't have a clear growth plan.",
      "Opportunities get delayed because I'm too busy.",
      "My business depends too much on me.",
    ],
  },
];

const CATEGORY_TIERS = [
  { max: 3, tier: "green", emoji: "🟢", label: "Strong Foundation", desc: "You're managing this area well. Small improvements could make it even stronger." },
  { max: 7, tier: "yellow", emoji: "🟡", label: "Growth Opportunity", desc: "This area could benefit from better systems and extra support." },
  { max: 10, tier: "orange", emoji: "🟠", label: "High Priority", desc: "This challenge is likely costing your business valuable time and money." },
  { max: 12, tier: "red", emoji: "🔴", label: "Immediate Attention", desc: "This area is limiting your business's growth and should be addressed as soon as possible." },
];

const OVERALL_TIERS = [
  { max: 24, emoji: "🌱", label: "Healthy Business", desc: "Your business has a solid foundation with only a few areas needing attention." },
  { max: 48, emoji: "⭐", label: "Growing Business", desc: "You're making progress, but there are clear opportunities to improve efficiency." },
  { max: 72, emoji: "🚀", label: "Capacity Challenge", desc: "Your business is likely being held back by limited capacity rather than lack of potential." },
  { max: 96, emoji: "🦄", label: "Ready for Transformation", desc: "Your business doesn't need to work harder — it needs more capacity, better systems, and the right support to grow sustainably." },
];

// ---------- State ----------
let currentSection = -1; // -1 = intro, 0-7 = sections, 8 = results
const answers = CATEGORIES.map(cat => cat.statements.map(() => null));

// ---------- DOM refs ----------
const screenIntro = document.getElementById("screen-intro");
const screenResults = document.getElementById("screen-results");
const sectionsContainer = document.getElementById("sectionsContainer");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const ccProgress = document.getElementById("ccProgress");
const ccProgressFill = document.getElementById("ccProgressFill");
const ccProgressLabel = document.getElementById("ccProgressLabel");

const resultsForm = document.getElementById("resultsForm");
const ccSubmitButton = document.getElementById("ccSubmitButton");
const ccFormStatus = document.getElementById("ccFormStatus");

// ---------- Build section screens ----------
function buildSections() {
  CATEGORIES.forEach((cat, sIndex) => {
    const section = document.createElement("section");
    section.className = "cc-screen cc-section";
    section.id = `section-${sIndex}`;
    section.hidden = true;

    const statementsHtml = cat.statements.map((text, qIndex) => `
      <div class="cc-statement">
        <div class="cc-statement-text">${text}</div>
        <div class="cc-rating" role="radiogroup" aria-label="${text}">
          ${RATING_OPTIONS.map(opt => `
            <div class="cc-rating-option">
              <input type="radio" name="s${sIndex}-q${qIndex}" id="s${sIndex}-q${qIndex}-v${opt.value}" value="${opt.value}" data-section="${sIndex}" data-question="${qIndex}">
              <label class="cc-rating-label" for="s${sIndex}-q${qIndex}-v${opt.value}">
                <span class="cc-rating-emoji">${opt.emoji}</span>
                <span>${opt.label}</span>
              </label>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");

    section.innerHTML = `
      <span class="step-eyebrow">${sIndex + 1}. ${cat.name}</span>
      <p class="cc-section-hook">${cat.hook}</p>
      ${statementsHtml}
      <div class="cc-section-nav">
        <button type="button" class="cc-nav-back" data-nav="back" ${sIndex === 0 ? "disabled" : ""}>&larr; Back</button>
        <button type="button" class="cc-nav-next" data-nav="next" disabled>
          ${sIndex === CATEGORIES.length - 1 ? "See My Results" : "Next"}
        </button>
      </div>
    `;

    sectionsContainer.appendChild(section);
  });
}

function attachSectionListeners() {
  sectionsContainer.addEventListener("change", (e) => {
    if (e.target.type !== "radio") return;
    const sIndex = parseInt(e.target.dataset.section);
    const qIndex = parseInt(e.target.dataset.question);
    answers[sIndex][qIndex] = parseInt(e.target.value);
    updateNextButton(sIndex);
  });

  sectionsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-nav]");
    if (!btn) return;
    const section = btn.closest(".cc-section");
    const sIndex = parseInt(section.id.replace("section-", ""));
    if (btn.dataset.nav === "next") {
      goToSection(sIndex + 1);
    } else {
      goToSection(sIndex - 1);
    }
  });
}

function updateNextButton(sIndex) {
  const section = document.getElementById(`section-${sIndex}`);
  const nextBtn = section.querySelector('[data-nav="next"]');
  const allAnswered = answers[sIndex].every(v => v !== null);
  nextBtn.disabled = !allAnswered;
}

// ---------- Navigation ----------
function showOnly(el) {
  [screenIntro, screenResults, ...sectionsContainer.querySelectorAll(".cc-section")].forEach(s => {
    if (s) s.hidden = (s !== el);
  });
}

function goToSection(index) {
  if (index < 0) {
    currentSection = -1;
    ccProgress.hidden = true;
    showOnly(screenIntro);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (index >= CATEGORIES.length) {
    showResults();
    return;
  }
  currentSection = index;
  ccProgress.hidden = false;
  updateProgress();
  showOnly(document.getElementById(`section-${index}`));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProgress() {
  const pct = ((currentSection) / CATEGORIES.length) * 100;
  ccProgressFill.style.width = `${pct}%`;
  ccProgressLabel.textContent = `Section ${currentSection + 1} of ${CATEGORIES.length}`;
}

// ---------- Scoring ----------
function getCategoryTier(score) {
  return CATEGORY_TIERS.find(t => score <= t.max) || CATEGORY_TIERS[CATEGORY_TIERS.length - 1];
}

function getOverallTier(score) {
  return OVERALL_TIERS.find(t => score <= t.max) || OVERALL_TIERS[OVERALL_TIERS.length - 1];
}

function computeScores() {
  const categoryScores = CATEGORIES.map((cat, i) => ({
    id: cat.id,
    name: cat.name,
    score: answers[i].reduce((sum, v) => sum + (v || 0), 0),
  }));
  const overallScore = categoryScores.reduce((sum, c) => sum + c.score, 0);
  return { categoryScores, overallScore };
}

// ---------- Results rendering ----------
function showResults() {
  ccProgress.hidden = true;
  const { categoryScores, overallScore } = computeScores();
  const overallTier = getOverallTier(overallScore);

  document.getElementById("overallEmoji").textContent = overallTier.emoji;
  document.getElementById("overallScore").innerHTML = `${overallScore}<span>/96</span>`;
  document.getElementById("overallTag").textContent = overallTier.label;
  document.getElementById("overallDesc").textContent = overallTier.desc;

  const sorted = [...categoryScores].sort((a, b) => b.score - a.score);

  const breakdownList = document.getElementById("breakdownList");
  breakdownList.innerHTML = sorted.map(cat => {
    const tier = getCategoryTier(cat.score);
    const pct = Math.round((cat.score / 12) * 100);
    return `
      <div class="cc-breakdown-card">
        <div class="cc-breakdown-top">
          <span class="cc-breakdown-name">${cat.name}</span>
          <span class="cc-breakdown-tier cc-tier-${tier.tier}">${tier.emoji} ${tier.label}</span>
        </div>
        <div class="cc-breakdown-track cc-tier-${tier.tier}">
          <div class="cc-breakdown-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join("");

  const topPriority = sorted[0];
  document.getElementById("offerCategory").textContent = topPriority.name;

  showOnly(screenResults);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Form submission ----------
function buildResultsPayload(formData) {
  const { categoryScores, overallScore } = computeScores();
  const sorted = [...categoryScores].sort((a, b) => b.score - a.score);
  const overallTier = getOverallTier(overallScore);

  // Mapped onto the same variable names the "UG Quote Request" team
  // template already uses, so this reuses that template as-is.
  return {
    company_name: formData.get("companyName"),
    contact_person: formData.get("contactPerson"),
    client_email: formData.get("email"),
    client_phone: formData.get("phone"),
    selected_package: `Business Capacity Check — ${overallScore}/96 (${overallTier.label})`,
    selected_services: `Top priority: ${sorted[0].name} · Second priority: ${sorted[1].name}`,
    weekly_hours: "—",
    monthly_hours: "—",
    estimated_investment: "Complimentary consultation requested (no quote yet)",
    requirements: `Full capacity breakdown — ${sorted.map(c => `${c.name}: ${c.score}/12`).join(", ")}.`,
  };
}

function attachFormHandler() {
  resultsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(resultsForm);
    const payload = buildResultsPayload(formData);

    setLoading(true);
    setStatus("", "");

    try {
      if (typeof emailjs !== "undefined" && EMAILJS_TEMPLATE_ID_QUIZ !== "YOUR_QUIZ_TEMPLATE_ID") {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_QUIZ, payload, EMAILJS_PUBLIC_KEY);
      } else {
        console.log("Capacity check payload (EmailJS template not configured):", payload);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setStatus("Thank you! Check your inbox — your complimentary plan is on its way.", "success");
      resultsForm.reset();
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong sending your request. Please try again or email us directly.", "error");
    } finally {
      setLoading(false);
    }
  });
}

function setLoading(isLoading) {
  ccSubmitButton.classList.toggle("loading", isLoading);
  ccSubmitButton.disabled = isLoading;
}

function setStatus(message, type) {
  ccFormStatus.textContent = message;
  ccFormStatus.className = "form-status" + (type ? ` ${type}` : "");
}

// ---------- Restart ----------
function restart() {
  CATEGORIES.forEach((cat, sIndex) => {
    cat.statements.forEach((_, qIndex) => {
      answers[sIndex][qIndex] = null;
      const section = document.getElementById(`section-${sIndex}`);
      section.querySelectorAll(`input[name="s${sIndex}-q${qIndex}"]`).forEach(input => input.checked = false);
    });
    updateNextButton(sIndex);
  });
  goToSection(-1);
}

// ---------- Init ----------
function init() {
  if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
  buildSections();
  attachSectionListeners();
  attachFormHandler();

  startButton.addEventListener("click", () => goToSection(0));
  restartButton.addEventListener("click", restart);
}

document.addEventListener("DOMContentLoaded", init);
