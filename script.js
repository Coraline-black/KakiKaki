const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");

let recognition = null;
let isListening = false;
let memory = [];

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
            e.style.background = "#ffcc00";
            e.style.animation = "pulse 0.5s infinite alternate";
        } else if (status === 'listen') {
            e.style.background = "#ff00ff";
        } else {
            e.style.background = "#00f2ff";
        }
    });
}

async function askAI(message) {
    setStatus('think');
    memory.push({ role: "user", content: message });

    try {
        const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                memory 
            })
        });

        const data = await response.json();
        setStatus('idle');

        const answer = data.answer || "Я задумался...";
        memory.push({ role: "assistant", content: answer });

        if (memory.length > 20) memory = memory.slice(-20);

        await typeWriter(answer);

    } catch (e) {
        setStatus('idle');
        await typeWriter("Связь прервалась… попробуй ещё раз 💭");
    }
}

// ГЛАВНАЯ ФУНКЦИЯ ДЛЯ ТЕЛЕФОНОВ
micBtn.onclick = () => {
    if (isListening) return;

    // Магия для iOS: "пробуждаем" аудио-движок
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Speech) {
        alert("Голос не поддерживается. Пожалуйста, используй Safari на iPhone или Chrome на Android! 😔");
        return;
    }

    recognition = new Speech();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false; // Важно для мобильных: одна фраза - одна сессия

    recognition.onstart = () => {
        isListening = true;
        setStatus("listen");
        tabletText.textContent = "Слушаю…";
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        isListening = false;
        recognition.stop();
        askAI(text);
    };

    recognition.onerror = (event) => {
        isListening = false;
        setStatus("idle");
        console.error("Speech kit error:", event.error);
        if (event.error === 'not-allowed') {
            alert("Пожалуйста, разреши доступ к микрофону в настройках твоего телефона!");
        }
    };

    recognition.onend = () => {
        isListening = false;
        if (tabletText.textContent === "Слушаю…") {
             setStatus("idle");
             tabletText.textContent = "Нажми снова, я не расслышал...";
        }
    };

    // Запуск на мобильных устройствах иногда требует задержки
    try {
        recognition.start();
    } catch (e) {
        console.log("Recognition уже запущен или заблокирован");
    }
};
