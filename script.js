const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");

// ===== ПАМЯТЬ на время сессии =====
let memory = JSON.parse(sessionStorage.getItem("robotMemory")) || [];
let isListening = false;

async function typeWriter(text) {
    tabletText.textContent = "";
    for (let char of text) {
        tabletText.textContent += char;
        await new Promise(r => setTimeout(r, 25));
    }
}

function setStatus(status) {
    eyes.forEach(e => {
        e.style.animation = "none";
        if (status === 'think') {
            e.style.background = "#ffd966"; // желтые глаза при обдумывании
            e.style.animation = "pulse 0.6s infinite alternate";
        } else if (status === 'listen') {
            e.style.background = "#ff66ff"; // фиолетовые глаза при прослушивании
        } else {
            e.style.background = "#00f2ff"; // синие глаза обычно
        }
    });
}

async function askAI(message) {
    setStatus('think');
    tabletText.textContent = "Думаю… 🤍";

    memory.push({ role: "user", content: message });
    if (memory.length > 20) memory = memory.slice(-20);
    sessionStorage.setItem("robotMemory", JSON.stringify(memory));

    try {
        const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, memory })
        });

        const data = await response.json();
        const answer = data.answer || "Я здесь 🤍";

        memory.push({ role: "assistant", content: answer });
        if (memory.length > 20) memory = memory.slice(-20);
        sessionStorage.setItem("robotMemory", JSON.stringify(memory));

        setStatus('idle');
        await typeWriter(answer);

    } catch {
        setStatus('idle');
        await typeWriter("Я рядом 🤍 Попробуем ещё раз");
    }
}

// ===== ГОЛОСОВОЙ ВВОД (через кнопку) =====
micBtn.onclick = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Speech) {
        tabletText.textContent = "На этом устройстве голосовой ввод недоступен. Используй текст 🤍";
        return;
    }

    if (isListening) return;
    isListening = true;

    const recognition = new Speech();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        setStatus('listen'); // фиолетовые глаза
        tabletText.textContent = "Я слушаю тебя… 🎧";
    };

    recognition.onresult = (event) => {
        isListening = false;
        const transcript = event.results[0][0].transcript;
        askAI(transcript);
    };

    recognition.onerror = () => {
        isListening = false;
        setStatus('idle');
    };

    recognition.onend = () => {
        isListening = false;
        setStatus('idle'); // синие глаза
    };

    recognition.start();
};

// ===== ТЕКСТОВЫЙ ВВОД (запасной вариант) =====
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = () => {
    const text = textInput.value.trim();
    if (!text) return;
    textInput.value = "";
    askAI(text);
};

textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
});
