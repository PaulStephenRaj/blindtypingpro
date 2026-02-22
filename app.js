const passages = [
  `Computer Science is the discipline that studies how computers process information and solve complex problems through logical instructions and systematic design. It combines mathematics, engineering, and analytical thinking to develop efficient algorithms that can perform tasks such as searching large datasets, sorting information, optimizing routes, and automating decision-making processes. An algorithm is a well-defined sequence of steps that takes input, processes it, and produces output within a finite amount of time. Programmers implement these algorithms using languages such as Python, Java, C++, and JavaScript, depending on the requirements of the application and the target platform.

Data structures play a crucial role in organizing and managing information in memory. Structures like arrays, linked lists, stacks, queues, trees, hash tables, and graphs allow developers to store and retrieve data efficiently. The choice of data structure directly affects the performance and scalability of a system. Time and space complexity are measured using Big-O notation, such as O(n), O(log n), and O(n²), to evaluate how an algorithm performs as the input size increases.

Operating systems act as intermediaries between hardware and software by managing the CPU, memory, storage devices, and input/output operations. Concepts such as process scheduling, multitasking, concurrency, and memory management ensure that multiple programs can run smoothly at the same time. Computer networks enable communication between devices using protocols like TCP/IP, allowing data to be transmitted securely across the internet.`,
  "Technology helps us learn faster when feedback is instant and clear for every participant.",
  "A calm mind and steady rhythm can improve typing performance during competition rounds."
];

const passageSelect = document.getElementById("passageSelect");
const timeLimitSelect = document.getElementById("timeLimit");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const targetTextEl = document.getElementById("targetText");
const inputArea = document.getElementById("inputArea");
const typedOverlay = document.getElementById("typedOverlay");
const timeEl = document.getElementById("time");
const correctCharsEl = document.getElementById("correctChars");
const mistakesEl = document.getElementById("mistakes");
const accuracyEl = document.getElementById("accuracy");
const wpmEl = document.getElementById("wpm");
const statusEl = document.getElementById("status");

let target = "";
let startTime = null;
let timerId = null;
let running = false;
let roundDurationSeconds = 5 * 60;

function initPassages() {
  passages.forEach((text, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `Passage ${index + 1}`;
    passageSelect.appendChild(option);
  });
  setTarget(0);
}

function setTarget(index) {
  target = passages[index] || passages[0];
  targetTextEl.textContent = target;
}

function getSelectedDurationSeconds() {
  return (Number(timeLimitSelect.value) || 5) * 60;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getElapsedSeconds() {
  if (!startTime) {
    return 0;
  }
  return Math.floor((Date.now() - startTime) / 1000);
}

function updateTimerDisplay() {
  const remaining = Math.max(0, roundDurationSeconds - getElapsedSeconds());
  timeEl.textContent = formatTime(remaining);
  return remaining;
}

function sanitize(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function calculateStats(typedText) {
  let correct = 0;
  let mistakes = 0;

  for (let i = 0; i < typedText.length; i += 1) {
    if (typedText[i] === target[i]) {
      correct += 1;
    } else {
      mistakes += 1;
    }
  }

  const totalTyped = typedText.length;
  const accuracy = totalTyped === 0 ? 100 : Math.round((correct / totalTyped) * 100);

  const elapsedSeconds = Math.max(1, getElapsedSeconds());
  const grossWpm = Math.round((typedText.length / 5) / (elapsedSeconds / 60));

  return { correct, mistakes, accuracy, grossWpm };
}

function paintTypedText(typedText) {
  const fragments = [];

  for (let i = 0; i < typedText.length; i += 1) {
    const char = sanitize(typedText[i]);
    if (typedText[i] === target[i]) {
      fragments.push(`<span class="correct">${char}</span>`);
    } else {
      fragments.push(`<span class="incorrect">${char}</span>`);
    }
  }

  if (typedText.length < target.length) {
    const pendingText = sanitize(target.slice(typedText.length));
    fragments.push(`<span class="pending">${pendingText}</span>`);
  }

  typedOverlay.innerHTML = fragments.join("");
}

function update() {
  const typedText = inputArea.value;
  paintTypedText(typedText);

  if (!startTime) {
    return;
  }

  const { correct, mistakes, accuracy, grossWpm } = calculateStats(typedText);
  correctCharsEl.textContent = String(correct);
  mistakesEl.textContent = String(mistakes);
  accuracyEl.textContent = `${accuracy}%`;
  wpmEl.textContent = String(grossWpm);

  if (typedText.length >= target.length) {
    stopRound("Completed");
  }
}

function startRound() {
  if (running) {
    return;
  }

  running = true;
  if (!startTime) {
    inputArea.value = "";
  }

  roundDurationSeconds = getSelectedDurationSeconds();
  startTime = Date.now();
  statusEl.textContent = "Running";
  inputArea.focus();
  updateTimerDisplay();

  timerId = window.setInterval(() => {
    const remaining = updateTimerDisplay();
    if (remaining <= 0) {
      stopRound("Time Up");
    }
  }, 1000);

  update();
}

function stopRound(status = "Stopped") {
  running = false;
  statusEl.textContent = status;

  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function resetRound() {
  stopRound("Waiting");
  startTime = null;
  roundDurationSeconds = getSelectedDurationSeconds();
  inputArea.value = "";
  timeEl.textContent = formatTime(roundDurationSeconds);
  correctCharsEl.textContent = "0";
  mistakesEl.textContent = "0";
  accuracyEl.textContent = "100%";
  wpmEl.textContent = "0";
  paintTypedText("");
}

passageSelect.addEventListener("change", (event) => {
  setTarget(Number(event.target.value));
  resetRound();
});

timeLimitSelect.addEventListener("change", resetRound);

document.addEventListener("keydown", (event) => {
  if (running) {
    return;
  }

  if (event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  if (event.key.length !== 1 && event.key !== "Enter") {
    return;
  }

  const isEditingTarget = ["TEXTAREA", "INPUT", "SELECT"].includes(document.activeElement?.tagName || "");

  if (!isEditingTarget) {
    event.preventDefault();
    startRound();
    inputArea.value = event.key === "Enter" ? "\n" : event.key;
    update();
    return;
  }

  startRound();
});

startBtn.addEventListener("click", startRound);
resetBtn.addEventListener("click", resetRound);
inputArea.addEventListener("input", update);

initPassages();
resetRound();