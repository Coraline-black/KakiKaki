const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");
const smile = document.querySelector(".smile");

// 1. Плавная печать текста (без голоса)
async function typeWriter(text) {
    tabletText.innerHTML = "";
    let i = 0;
    // Скорость печати: 30мс на символ
    for (let char of text) {
        tabletText.innerHTML += char;
        await new Promise(r => setTimeout(r, 30));
        // Автопрокрутка вниз, если текст длинный
        tabletText.scrollTop = tabletText.scrollHeight;
    }
}

// 2. Индикация состояний (Визуальный интеллект)
function setStatus(status) {
    eyes.forEach(e => e.classList.remove('pulse-eye'));
    
    if (status === 'listen') {
        eyes.forEach(e => e.style.background = "#ff00ff"); // Розовый — слушаю
        tabletText.textContent = "Слушаю тебя...";
    } else if (status === 'think') {
        eyes.forEach(e => e.style.background = "#ffcc00"); // Желтый — думаю
        eyes.forEach(e => e.classList.add('pulse-eye'));
        tabletText.textContent = "Обрабатываю запрос...";
    } else if (status === 'error') {
        eyes.forEach(e => e.style.background = "#ff4444"); // Красный — сбой
        tabletText.textContent = "Что-то пошло не так... Попробуй еще раз.";
    } else {
        eyes.forEach(e => e.style.background = "#00f2ff"); // Голубой — жду
    }
}

// 3. Главная функция общения
async function askAI(userMessage) {
    setStatus('think');

    try {
        // Таймаут 15 секунд, чтобы не висел вечно
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage }),
            signal: controller.signal
        });

        clearTimeout(timeout);
        const data = await response.json();
        
        setStatus('idle');
        
        // Если API прислало ответ — печатаем его
        if (data.answer) {
            await typeWriter(data.answer);
        } else {
            await typeWriter("Я задумался и не нашел ответа. Давай спросим по-другому?");
        }

    } catch (err) {
        console.error("Ошибка:", err);
        setStatus('error');
        await typeWriter("Не удалось связаться с сервером. Проверь интернет!");
    }
}

// 4. Голосовое управление (Speech Recognition)
micBtn.onclick = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!Speech) {
        tabletText.textContent = "Твой браузер не поддерживает распознавание речи.";
        return;
    }

    const recognition = new Speech();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false; // Ждем финальную фразу

    recognition.onstart = () => setStatus('listen');
    
    recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        askAI(result); // Отправляем распознанный текст нейросети
    };

    recognition.onerror = () => setStatus('idle');
    recognition.onend = () => {
        if (tabletText.textContent === "Слушаю тебя...") setStatus('idle');
    };

    recognition.start();
};
