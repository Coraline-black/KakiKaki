const card = document.getElementById("card");
const head = document.getElementById("face");
const eyes = document.querySelectorAll(".eye");
const leftArm = document.querySelector(".arm.left");
const rightArm = document.querySelector(".arm.right");
const talkBtn = document.getElementById("talkBtn");

// --- Моргание глаз ---
setInterval(() => {
  eyes.forEach(e => e.style.height = "6px");
  setTimeout(() => eyes.forEach(e => e.style.height = "50px"), 180);
}, 2500);

// --- Жесты ---
function yes() {
  head.style.transform = "rotate(6deg)";
  rightArm.style.transform = "rotate(25deg)";
  leftArm.style.transform = "rotate(-15deg)";
  setTimeout(() => {
    head.style.transform = "rotate(0deg)";
    rightArm.style.transform = "rotate(0deg)";
    leftArm.style.transform = "rotate(0deg)";
  }, 500);
}

function no() {
  head.style.transform = "rotate(-6deg)";
  rightArm.style.transform = "rotate(25deg)";
  leftArm.style.transform = "rotate(-15deg)";
  setTimeout(() => {
    head.style.transform = "rotate(0deg)";
    rightArm.style.transform = "rotate(0deg)";
    leftArm.style.transform = "rotate(0deg)";
  }, 500);
}

// --- Имя пользователя ---
let userName = localStorage.getItem("robotUserName");
if (!userName) {
  userName = prompt("Привет! Как тебя зовут?");
  localStorage.setItem("robotUserName", userName);
}

// --- Память робота ---
let memory = JSON.parse(localStorage.getItem("robotMemory") || "{}");
function saveMemory() { localStorage.setItem("robotMemory", JSON.stringify(memory)); }

// --- Cloudflare Worker ---
async function askCloudAI(text) {
  try {
    const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await response.json();
    return data.answer || "Я пока не знаю 🤔";
  } catch {
    return "Связь с ИИ временно недоступна 💥";
  }
}

// --- Основной ответ ---
async function respondAI(text) {
  text = text.toLowerCase();

  // Математика
  if (/\d+\s*[\+\-\*\/]\s*\d+/.test(text)) {
    try {
      const answer = eval(text);
      card.textContent = `Ответ: ${answer}`;
      yes();
      return;
    } catch { card.textContent = "Ошибка 😅"; no(); return; }
  }

  const key = text + "||" + userName;
  if (memory[key]) {
    card.textContent = memory[key];
    memory[key].toLowerCase().includes("нет") ? no() : yes();
    return;
  }

  const cloudAnswer = await askCloudAI(text);
  card.textContent = cloudAnswer;
  cloudAnswer.toLowerCase().includes("нет") ? no() : yes();

  memory[key] = cloudAnswer;
  saveMemory();
}

// --- Голосовой ввод ---
talkBtn.onclick = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    card.textContent = "Браузер не поддерживает голос. Используй Safari!";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  card.textContent = "🎧 Слушаю тебя…";

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    card.textContent = `Ты: "${transcript}" — Думаю... 💭`;
    await respondAI(transcript);
  };

  recognition.onerror = () => { card.textContent = "Не удалось распознать голос. Попробуй ещё раз!"; };

  recognition.start();
};
