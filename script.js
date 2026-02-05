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
            e.style.animation = "pulse 0.5s infinite alternate"; 
        } else if (status === 'listen') {
            e.style.background = "#ff00ff"; // Розовый — слушает
        } else {
            e.style.background = "#00f2ff"; // Голубой — ждет
        }
    });
}

async function askAI(message) {
    setStatus('think');
    try {
        const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        setStatus('idle');
        
        // ВНИМАНИЕ: берем ответ из data.answer (как в твоем воркере)
        const finalAnswer = data.answer || "Я получил пустой ответ...";
        await typeWriter(finalAnswer);
        
    } catch (e) {
        setStatus('idle');
        await typeWriter("Ошибка связи с моим процессором... 💥");
        console.error(e);
    }
}

micBtn.onclick = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return alert("Браузер не поддерживает голос.");
    const rec = new Speech();
    rec.lang = 'ru-RU';
    rec.onstart = () => { setStatus('listen'); tabletText.textContent = "Слушаю..."; };
    rec.onresult = (e) => askAI(e.results[0][0].transcript);
    rec.onerror = () => setStatus('idle');
    rec.start();
};
