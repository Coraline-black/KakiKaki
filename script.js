const tabletText = document.querySelector("#tablet .text-content");
const micBtn = document.getElementById("micBtn");
const eyes = document.querySelectorAll(".eye");
const smile = document.querySelector(".smile");

// 1. Анимация моргания
function blink() {
  eyes.forEach(e => e.style.transform = "scaleY(0.1)");
  setTimeout(() => {
    eyes.forEach(e => e.style.transform = "scaleY(1)");
  }, 150);
}
setInterval(blink, 4000);

// 2. Улучшенный эффект печати
async function typeWriter(text) {
  tabletText.innerHTML = "";
  let i = 0;
  const speed = 30; // Скорость печати
  
  return new Promise((resolve) => {
    function type() {
      if (i < text.length) {
        tabletText.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

// 3. Состояния робота
const setRobotState = (state) => {
  switch(state) {
    case 'listen':
      eyes.forEach(e => e.style.background = "#ff00ff");
      smile.style.height = "10px";
      smile.style.borderRadius = "50%";
      break;
    case 'think':
      eyes.forEach(e => e.style.animation = "pulse 1s infinite");
      break;
    case 'idle':
      eyes.forEach(e => {
        e.style.background = "#00f2ff";
        e.style.animation = "none";
      });
      smile.style.height = "2px";
      break;
  }
};

// 4. Интеграция с AI
async function askAI(message) {
  setRobotState('think');
  tabletText.textContent = "Хм... дай подумать...";
  
  try {
    const response = await fetch("https://pukipuki.damp-glade-283e.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    return data.answer || "Я не смог найти ответ, попробуй еще раз!";
  } catch (error) {
    return "Ой, кажется, у меня пропала связь с мозгом (ошибка сети).";
  } finally {
    setRobotState('idle');
  }
}

// 5. Голосовое управление
micBtn.onclick = () => {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) {
    typeWriter("Твой браузер не поддерживает голос. Используй Chrome.");
    return;
  }

  const rec = new Speech();
  rec.lang = 'ru-RU';

  rec.onstart = () => {
    setRobotState('listen');
    tabletText.textContent = "Слушаю тебя внимательно...";
  };

  rec.onerror = () => {
    setRobotState('idle');
    typeWriter("Я ничего не услышал...");
  };

  rec.onresult = async (event) => {
    const query = event.results[0][0].transcript;
    const answer = await askAI(query);
    await typeWriter(answer);
  };

  rec.start();
};
