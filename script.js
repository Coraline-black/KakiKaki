const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");

let recognition = null;
let isListening = false;

// 🧠 БОЛЬШАЯ ПАМЯТЬ
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
    tabletText.textContent = "Думаю… 🤍";

    memory.push({ role: "user", content: message });

    try {
        const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, memory })
        });

        const data = await response.json();
        setStatus('idle');

        const answer = data.answer || "Я здесь 🤍";
        memory.push({ role: "assistant", content: answer });

        if (memory.length > 20) memory = memory.slice(-20);

        await typeWriter(answer);

    } catch {
        setStatus('idle');
        await typeWriter("Связь немного прервалась, но я снова с тобой 🤍");
    }
}

micBtn.onclick = () => {
    if (isListening) return;

    const Speech =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!Speech) {
        alert("Голос не поддерживается на этом устройстве 😔");
        return;
    }

    recognition = new Speech();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isListening = true;
        setStatus("listen");
        tabletText.textContent = "Слушаю тебя… 🎧";
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        isListening = false;
        askAI(text); // ✅ БЕЗ stop()
    };

    recognition.onerror = () => {
        isListening = false;
        setStatus("idle");
    };

    recognition.onend = () => {
        isListening = false;
        setStatus("idle");
    };

    recognition.start();
};
