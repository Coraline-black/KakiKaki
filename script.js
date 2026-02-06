const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");

async function typeWriter(text) {
    tabletText.textContent = "";
    for (let char of text) {
        tabletText.textContent += char;
        await new Promise(r => setTimeout(r, 30));
    }
}

function setStatus(status) {
    eyes.forEach(e => {
        e.style.animation = "none";
        if (status === 'think') {
            e.style.background = "#ffcc00"; // Желтый — думает
            e.style.boxShadow = "0 0 15px #ffcc00";
            e.style.animation = "pulse 0.5s infinite alternate"; 
        } else if (status === 'listen') {
            e.style.background = "#ff00ff"; // Розовый — слушает
            e.style.boxShadow = "0 0 15px #ff00ff";
        } else {
            e.style.background = "#00f2ff"; // Голубой — ждет
            e.style.boxShadow = "0 0 15px #00f2ff";
        }
    });
}

async function askAI(message) {
    setStatus('think');
    tabletText.textContent = "Пуки думает...";
    
    try {
        // Мы отправляем запрос на твой воркер
        const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message }) // Передаем только текст
        });
        
        const data = await response.json();
        setStatus('idle');
        
        // Берем ответ из поля answer, которое мы настроили в Cloudflare
        const finalAnswer = data.answer || "Я получил пустой ответ от процессора...";
        await typeWriter(finalAnswer);
        
    } catch (e) {
        setStatus('idle');
        await typeWriter("Ошибка связи! Проверь интернет или воркер. 💥");
        console.error("Критическая ошибка:", e);
    }
}

micBtn.onclick = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
        alert("Твой браузер не поддерживает голосовой ввод. Попробуй Chrome или Safari.");
        return;
    }
    
    const rec = new Speech();
    rec.lang = 'ru-RU';
    
    rec.onstart = () => { 
        setStatus('listen'); 
        tabletText.textContent = "Слушаю тебя..."; 
    };
    
    rec.onresult = (e) => {
        const result = e.results[0][0].transcript;
        askAI(result);
    };
    
    rec.onerror = (err) => {
        setStatus('idle');
        tabletText.textContent = "Я не расслышал, повтори?";
        console.error("Ошибка распознавания:", err);
    };
    
    rec.start();
};
