/**
 * PukiPuki AI - Ultimate Intelligence Script
 * Возможности: Память контекста, слежение глазами, озвучка, распознавание речи.
 */

const PukiConfig = {
    apiUrl: "https://pukipuki.damp-glade-283e.workers.dev/",
    voiceEnabled: true,
    maxHistory: 10 // Сколько сообщений робот будет помнить
};

// Элементы DOM
const tablet = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");
const robotFace = document.getElementById("face");
const leftArm = document.querySelector(".left-arm");
const rightArm = document.querySelector(".right-arm");

// Глобальное состояние
let conversationHistory = []; // Здесь хранится память робота
let isListening = false;

// --- 1. Продвинутый Интеллект (Работа с API) ---
async function askAI(userText) {
    updateRobotState('thinking');
    
    // Добавляем сообщение пользователя в память
    conversationHistory.push({ role: "user", content: userText });
    if (conversationHistory.length > PukiConfig.maxHistory) conversationHistory.shift();

    try {
        const response = await fetch(PukiConfig.apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: userText,
                history: conversationHistory // Отправляем всю историю для "ума"
            })
        });

        const data = await response.json();
        const aiAnswer = data.answer || "Мои нейронные связи запутались. Повтори?";
        
        // Добавляем ответ ИИ в память
        conversationHistory.push({ role: "assistant", content: aiAnswer });
        
        await typeAndSpeak(aiAnswer);
    } catch (error) {
        console.error("Ошибка API:", error);
        typeAndSpeak("Ошибка связи. Проверь интернет или сервер!");
    } finally {
        updateRobotState('idle');
    }
}

// --- 2. Эффект печати + Озвучка (TTS) ---
async function typeAndSpeak(text) {
    // 1. Озвучка (если включена)
    if (PukiConfig.voiceEnabled) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 1.1; // Чуть быстрее для естественности
        utterance.pitch = 1.2; // Немного "роботизированный" высокий голос
        window.speechSynthesis.speak(utterance);
    }

    // 2. Эффект печати на планшете
    tablet.textContent = "";
    for (let char of text) {
        tablet.textContent += char;
        await new Promise(r => setTimeout(r, 30));
    }
}

// --- 3. Интерактивность: Слежение за мышью ---
document.addEventListener('mousemove', (e) => {
    if (isListening) return; // Не отвлекаемся, когда слушаем

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const rect = robotFace.getBoundingClientRect();
    const faceX = rect.left + rect.width / 2;
    const faceY = rect.top + rect.height / 2;

    const angleX = (mouseX - faceX) / 30; // Ограничиваем поворот
    const angleY = (mouseY - faceY) / 30;

    // Поворачиваем голову и двигаем зрачки
    robotFace.style.transform = `rotateY(${angleX}deg) rotateX(${-angleY}deg)`;
    eyes.forEach(eye => {
        eye.style.transform = `translate(${angleX * 1.5}px, ${angleY * 1.5}px)`;
    });
});

// --- 4. Состояния робота (Визуальные эффекты) ---
function updateRobotState(state) {
    switch (state) {
        case 'listening':
            isListening = true;
            eyes.forEach(e => { e.style.background = "#ff00ff"; e.style.boxShadow = "0 0 20px #ff00ff"; });
            tablet.textContent = "Слушаю...";
            break;
        case 'thinking':
            isListening = false;
            eyes.forEach(e => e.classList.add('pulse-eye')); // Нужен CSS-класс с анимацией
            tablet.textContent = "Думаю...";
            break;
        case 'idle':
            isListening = false;
            eyes.forEach(e => { e.style.background = "#00f2ff"; e.style.boxShadow = "0 0 15px #00f2ff"; e.classList.remove('pulse-eye'); });
            break;
    }
}

// --- 5. Работа с микрофоном ---
micBtn.onclick = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return alert("Браузер не поддерживает голос.");

    const recognition = new Speech();
    recognition.lang = 'ru-RU';

    recognition.onstart = () => updateRobotState('listening');
    recognition.onerror = () => updateRobotState('idle');
    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        askAI(transcript);
    };

    recognition.start();
};

// Моргание по таймеру
setInterval(() => {
    if (!isListening) {
        eyes.forEach(e => e.style.transform += ' scaleY(0.1)');
        setTimeout(() => eyes.forEach(e => e.style.transform = e.style.transform.replace(' scaleY(0.1)', '')), 150);
    }
}, 4000);
