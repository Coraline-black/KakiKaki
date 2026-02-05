const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");

// Функция красивой печати текста
async function typeWriter(text) {
    tabletText.textContent = "";
    let i = 0;
    for (let char of text) {
        tabletText.textContent += char;
        await new Promise(r => setTimeout(r, 30));
    }
}

// Управление анимацией глаз
function setRobotStatus(status) {
    eyes.forEach(e => e.classList.remove('pulse-eye'));
    if (status === 'think') {
        eyes.forEach(e => {
            e.style.background = "#ffcc00"; // Желтый — думает
            e.classList.add('pulse-eye');
        });
    } else if (status === 'listen') {
        eyes.forEach(e => e.style.background = "#ff00ff"); // Розовый — слушает
    } else {
        eyes.forEach(e => e.style.background = "#00f2ff"); // Голубой — ждет
    }
}

// Запрос к ИИ
async function askAI(message) {
    setRobotStatus('think');
    tabletText.textContent = "Обрабатываю запрос...";

    try {
        const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        setRobotStatus('idle');
        
        if (data.answer) {
            await typeWriter(data.answer);
        } else {
            await typeWriter("Я получил пустой ответ. Попробуй еще раз!");
        }
    } catch (error) {
        setRobotStatus('idle');
        await typeWriter("Ошибка связи с сервером. Проверь интернет!");
    }
}

// Работа с микрофоном
micBtn.onclick = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return alert("Браузер не поддерживает голос.");

    const recognition = new Speech();
    recognition.lang = 'ru-RU';

    recognition.onstart = () => {
        setRobotStatus('listen');
        tabletText.textContent = "Слушаю тебя...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        askAI(transcript);
    };

    recognition.onerror = () => setRobotStatus('idle');
    recognition.start();
};
