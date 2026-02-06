// ===== ЭЛЕМЕНТЫ =====
const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");

// ===== СОСТОЯНИЯ =====
let memory = [];               // 🧠 большая память
let isListening = false;       // защита от двойного микрофона

// ===== ЭФФЕКТ ПЕЧАТИ =====
async function typeWriter(text) {
    tabletText.textContent = "";
    for (let char of text) {
        tabletText.textContent += char;
        await new Promise(r => setTimeout(r, 25));
    }
}

// ===== СТАТУС ГЛАЗ =====
function setStatus(status) {
    eyes.forEach(e => {
        e.style.animation = "none";

        if (status === "listen") {
            e.style.background = "#ff66ff";
        } 
        else if (status === "think") {
            e.style.background = "#ffd966";
            e.style.animation = "pulse 0.6s infinite alternate";
        } 
        else {
            e.style.background = "#66f2ff";
        }
    });
}

// ===== ЗАПРОС К ИИ =====
async function askAI(message) {
    setStatus("think");
    tabletText.textContent = "Думаю… 🤍";

    // сохраняем вопрос
    memory.push({ role: "user", content: message });
    if (memory.length > 20) memory = memory.slice(-20);

    try {
        const response = await fetch(
            "https://pukipuki.damp-glade-283e.workers.dev/",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    memory
                })
            }
        );

        const data = await response.json();
        const answer = data.answer || "Я здесь 🤍";

        // сохраняем ответ
        memory.push({ role: "assistant", content: answer });
        if (memory.length > 20) memory = memory.slice(-20);

        setStatus("idle");
        await typeWriter(answer);

    } catch (e) {
        setStatus("idle");
        await typeWriter("Я рядом 🤍 Давай попробуем ещё раз");
    }
}

// ===== МИКРОФОН (УМНЫЙ, ДЛЯ ВСЕХ ТЕЛЕФОНОВ) =====
micBtn.onclick = () => {
    const Speech =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    // ❌ если голос недоступен
    if (!Speech) {
        setStatus("idle");
        tabletText.textContent =
            "На этом телефоне я лучше понимаю текст 🤍 Напиши мне сообщение";
        return;
    }

    // защита от повторного нажатия
    if (isListening) return;
    isListening = true;

    const recognition = new Speech();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        setStatus("listen");
        tabletText.textContent = "Я слушаю тебя… 🎧";
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        isListening = false;
        askAI(text);
    };

    recognition.onerror = () => {
        isListening = false;
        setStatus("idle");
        tabletText.textContent =
            "Я рядом 🤍 Если хочешь — напиши сообщение";
    };

    recognition.onend = () => {
        isListening = false;
        setStatus("idle");
    };

    recognition.start();
};
