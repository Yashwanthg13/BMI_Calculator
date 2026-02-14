const MAX_HISTORY = 6;

const elements = {
  form: document.getElementById("bmi-form"),
  height: document.getElementById("height"),
  weight: document.getElementById("weight"),
  age: document.getElementById("age"),
  sex: document.getElementById("sex"),
  heightLabel: document.getElementById("height-label"),
  weightLabel: document.getElementById("weight-label"),
  error: document.getElementById("error"),
  bmiValue: document.getElementById("bmi-value"),
  bmiCategory: document.getElementById("bmi-category"),
  healthyRange: document.getElementById("healthy-range"),
  meterIndicator: document.getElementById("meter-indicator"),
  historyList: document.getElementById("history-list"),
  clearHistory: document.getElementById("clear-history"),
  reset: document.getElementById("reset"),
  unitButtons: document.querySelectorAll(".unit-btn")
};

let unitSystem = "metric";

function setUnitSystem(system) {
  unitSystem = system;
  const isMetric = unitSystem === "metric";
  elements.heightLabel.textContent = isMetric ? "Height (cm)" : "Height (in)";
  elements.weightLabel.textContent = isMetric ? "Weight (kg)" : "Weight (lb)";
  elements.height.placeholder = isMetric ? "e.g., 175" : "e.g., 69";
  elements.weight.placeholder = isMetric ? "e.g., 70" : "e.g., 154";

  elements.unitButtons.forEach((button) => {
    const selected = button.dataset.system === unitSystem;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
}

function getCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy weight";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

function calculateBMI(height, weight) {
  if (unitSystem === "metric") {
    const meters = height / 100;
    return weight / (meters * meters);
  }

  return (703 * weight) / (height * height);
}

function getHealthyRange(height) {
  if (unitSystem === "metric") {
    const meters = height / 100;
    const low = 18.5 * meters * meters;
    const high = 24.9 * meters * meters;
    return `${low.toFixed(1)} - ${high.toFixed(1)} kg`;
  }

  const low = (18.5 * height * height) / 703;
  const high = (24.9 * height * height) / 703;
  return `${low.toFixed(1)} - ${high.toFixed(1)} lb`;
}

function setMeterPosition(bmi) {
  const clamped = Math.max(10, Math.min(40, bmi));
  const percent = ((clamped - 10) / 30) * 100;
  elements.meterIndicator.style.left = `${percent}%`;
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem("bmiHistory")) || [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem("bmiHistory", JSON.stringify(entries));
}

function addHistoryEntry(entry) {
  const history = readHistory();
  history.unshift(entry);
  saveHistory(history.slice(0, MAX_HISTORY));
  renderHistory();
}

function renderHistory() {
  const history = readHistory();
  if (!history.length) {
    elements.historyList.innerHTML = '<li class="muted">No saved calculations yet.</li>';
    return;
  }

  elements.historyList.innerHTML = history
    .map(
      (entry) =>
        `<li><strong>${entry.bmi}</strong> (${entry.category}) · ${entry.height} / ${entry.weight} · ${entry.date}</li>`
    )
    .join("");
}

function clearError() {
  elements.error.textContent = "";
}

function setError(message) {
  elements.error.textContent = message;
}

function handleSubmit(event) {
  event.preventDefault();
  clearError();

  const height = Number(elements.height.value);
  const weight = Number(elements.weight.value);

  if (!height || !weight || height <= 0 || weight <= 0) {
    setError("Please enter a valid positive height and weight.");
    return;
  }

  const bmi = calculateBMI(height, weight);
  const category = getCategory(bmi);

  elements.bmiValue.textContent = bmi.toFixed(1);
  elements.bmiCategory.textContent = category;
  elements.healthyRange.textContent = `Healthy weight range for your height: ${getHealthyRange(height)}.`;
  setMeterPosition(bmi);

  addHistoryEntry({
    bmi: bmi.toFixed(1),
    category,
    height: `${height} ${unitSystem === "metric" ? "cm" : "in"}`,
    weight: `${weight} ${unitSystem === "metric" ? "kg" : "lb"}`,
    date: new Date().toLocaleString()
  });
}

function handleReset() {
  elements.form.reset();
  clearError();
  elements.bmiValue.textContent = "--";
  elements.bmiCategory.textContent = "Enter values and calculate.";
  elements.healthyRange.textContent = "Healthy weight range will appear here.";
  elements.meterIndicator.style.left = "0%";
}

elements.form.addEventListener("submit", handleSubmit);
elements.reset.addEventListener("click", handleReset);
elements.clearHistory.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
});

elements.unitButtons.forEach((button) => {
  button.addEventListener("click", () => setUnitSystem(button.dataset.system));
});

renderHistory();
setUnitSystem("metric");
