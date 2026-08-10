/* ============================================
   UNIKORN GLOBAL — Student Associate Intake logic
   ============================================ */

// ---------- Config ----------
// Reuses the same EmailJS account as the Quote Builder.
// Create a dedicated template for this intake form's email, then paste its ID below.
const EMAILJS_PUBLIC_KEY = "dtxxe48IOxVnpeieh";
const EMAILJS_SERVICE_ID = "service_qy91wll";
const EMAILJS_TEMPLATE_ID_INTAKE = "YOUR_INTAKE_TEMPLATE_ID";

const DIGITAL_SKILLS = [
  { id: "office", label: "Microsoft Office / Google Workspace" },
  { id: "canva", label: "Canva" },
  { id: "ai", label: "AI / ChatGPT" },
  { id: "research", label: "Online Research" },
  { id: "socialMedia", label: "Social Media" },
  { id: "taskMgmt", label: "Task Management Systems" },
];

const WORK_STYLE_LIMIT = 4;

// ---------- DOM refs ----------
const form = document.getElementById("intakeForm");
const successScreen = document.getElementById("successScreen");
const submitButton = document.getElementById("intakeSubmitButton");
const formStatus = document.getElementById("intakeFormStatus");
const digitalSkillsGrid = document.getElementById("digitalSkillsGrid");
const workStyleGroup = document.getElementById("workStyleGroup");
const workStyleLimitNote = document.getElementById("workStyleLimitNote");

// ---------- Build digital skills rating rows ----------
function buildDigitalSkills() {
  digitalSkillsGrid.innerHTML = DIGITAL_SKILLS.map(skill => `
    <div class="in-rating-row">
      <span class="in-rating-label">${skill.label}</span>
      <div class="in-rating-scale" role="radiogroup" aria-label="${skill.label}">
        ${[1, 2, 3, 4, 5].map(n => `
          <div class="in-rating-scale-option">
            <input type="radio" name="digital_${skill.id}" id="digital_${skill.id}_${n}" value="${n}" required>
            <label class="in-rating-scale-label" for="digital_${skill.id}_${n}">${n}</label>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

// ---------- "Other" text field toggling ----------
function attachOtherToggles() {
  form.addEventListener("change", (e) => {
    if (e.target.dataset.otherToggle) {
      const targetInput = document.getElementById(e.target.dataset.otherToggle);
      if (e.target.type === "radio") {
        // clear any other-toggle text inputs in the same group first
        const groupName = e.target.name;
        form.querySelectorAll(`input[name="${groupName}"][data-other-toggle]`).forEach(radio => {
          const otherInput = document.getElementById(radio.dataset.otherToggle);
          otherInput.disabled = !radio.checked;
          if (!radio.checked) otherInput.value = "";
        });
      } else {
        targetInput.disabled = !e.target.checked;
        if (!e.target.checked) targetInput.value = "";
      }
    }
  });
}

// ---------- Work style 4-item limit ----------
function attachWorkStyleLimit() {
  const checkboxes = workStyleGroup.querySelectorAll('input[type="checkbox"]');

  function updateState() {
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    checkboxes.forEach(cb => {
      if (!cb.checked) cb.disabled = checkedCount >= WORK_STYLE_LIMIT;
    });
    workStyleLimitNote.textContent = checkedCount >= WORK_STYLE_LIMIT
      ? `Maximum of ${WORK_STYLE_LIMIT} selected.`
      : `${checkedCount} of ${WORK_STYLE_LIMIT} selected.`;
    workStyleLimitNote.classList.toggle("at-limit", checkedCount >= WORK_STYLE_LIMIT);
  }

  checkboxes.forEach(cb => cb.addEventListener("change", updateState));
  updateState();
}

// ---------- Payload building ----------
function buildPayload(formData) {
  const getAll = (name) => formData.getAll(name).join(", ") || "—";
  const get = (name) => formData.get(name) || "—";

  const skills = getAll("skills") + (formData.get("skillsOther") ? ` (${formData.get("skillsOther")})` : "");
  const currentStatus = get("currentStatus") + (formData.get("currentStatusOther") ? ` (${formData.get("currentStatusOther")})` : "");

  const digitalSkillsSummary = DIGITAL_SKILLS.map(skill =>
    `${skill.label}: ${formData.get(`digital_${skill.id}`) || "—"}/5`
  ).join(" | ");

  return {
    full_name: get("fullName"),
    email: get("email"),
    phone: get("phone"),
    location: get("location"),
    current_status: currentStatus,
    study_field: get("studyField"),
    skills: skills,
    strongest_skill: get("strongestSkill"),
    overall_ability: get("overallAbility"),
    digital_skills: digitalSkillsSummary,
    work_style: getAll("workStyle"),
    q_new_task: get("qNewTask"),
    q_deadline: get("qDeadline"),
    q_why_join: get("qWhyJoin"),
    weekly_hours: get("weeklyHours"),
    availability: getAll("availability"),
    reliable_access: get("reliableAccess"),
    has_portfolio: get("hasPortfolio"),
    portfolio_details: get("portfolioDetails"),
  };
}

// ---------- Submit handler ----------
function attachSubmitHandler() {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const payload = buildPayload(formData);

    setLoading(true);
    setStatus("", "");

    try {
      if (typeof emailjs !== "undefined" && EMAILJS_TEMPLATE_ID_INTAKE !== "YOUR_INTAKE_TEMPLATE_ID") {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_INTAKE, payload, EMAILJS_PUBLIC_KEY);
      } else {
        console.log("Student intake payload (EmailJS template not configured):", payload);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      form.hidden = true;
      successScreen.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong submitting your application. Please try again.", "error");
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
  if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
  buildDigitalSkills();
  attachOtherToggles();
  attachWorkStyleLimit();
  attachSubmitHandler();
}

document.addEventListener("DOMContentLoaded", init);
    
