// DOM элементы
const chatWindow = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const talkBtn = document.getElementById("talkBtn");
const status = document.getElementById("status");

const robotFace = document.getElementById("face");
const eyes = document.querySelectorAll(".eye");
const leftArm = document.querySelector(".arm.left");
const rightArm = document.querySelector(".arm.right");

// Моргание глаз
setInterval(() => {
  eyes.forEach(e => e.style.height = "6px");
  setTimeout(() => eyes.forEach(e => e.style.height = "40px"), 180);
}, 2500);

// Жесты
function gesture(yes = true) {
  rightArm.style.transform = "rotate(25deg)";
  leftArm.style.transform = "rotate(-15deg)";
  robotFace.style.transform = yes ? "rotate(5deg)" : "rotate(-5deg)";
  setTimeout(() => {
    rightArm.style.transform = "rotate(0deg)";
    leftArm.style.transform = "rotate(0deg)";
    robotFace.style.transform = "rotate(0deg)";
  }, 500);
}

// Память
let memory = JSON.parse(localStorage.getItem("robotMemory") || "{}");
function saveMemory() { localStorage.setItem("robotMemory", JSON.stringify(memory)); }

// Добавление сообщения в чат
function addMessage(text, sender = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Эффект печатающегося текста
async function typeMessage(text) {
  const msg = document.createElement("div");
  msg.className = "message bot";
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  for (let i = 0; i <= text.length; i++) {
    msg.textContent = text.substring(0, i);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    await new Promise(r => setTimeout(r, 25));
  }
}

// --- Обращение к Cloudflare Worker ---
async function askAI(text) {
  status.style.opacity = 1;
  try {
    const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await response.json();
    status.style.opacity = 0;
    return data.answer || "Я пока не знаю 😅";
  } catch {
    status.style.opacity = 0;
    return "Связь с ИИ временно недоступна 💥";
  }
}

// --- Основная функция ответа ---
async function respond(text) {
  addMessage(text, "user");

  // Проверка на память
  if (memory[text]) {
    await typeMessage(memory[text]);
    memory[text].includes("нет") ? gesture(false) : gesture(true);
    return;
  }

  const answer = await askAI(text);
  memory[text] = answer;
  saveMemory();
  await typeMessage(answer);
  answer.toLowerCase().includes("нет") ? gesture(false) : gesture(true);
}

// --- Голосовой ввод ---
talkBtn.onclick = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addMessage("Твой браузер не поддерживает голос. Попробуй Chrome!", "bot");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;

  recognition.onstart = () => { status.style.opacity = 1; status.textContent = "Слушаю тебя... 🎧"; };
  recognition.onerror = () => { status.style.opacity = 0; addMessage("Не удалось распознать голос. Попробуй ещё раз!", "bot"); };
  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    status.style.opacity = 0;
    respond(transcript);
  };

  recognition.start();
};

// --- Отправка через Enter ---
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && userInput.value.trim() !== "") {
    respond(userInput.value.trim());
    userInput.value = "";
  }
});
