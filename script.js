const tablet = document.getElementById("tablet");
const micBtn = document.getElementById("micBtn");
const robotFace = document.getElementById("face");
const eyes = document.querySelectorAll(".eye");
const leftArm = document.querySelector(".arm.left");
const rightArm = document.querySelector(".arm.right");

// Моргание глаз каждые 2.5 секунды
setInterval(() => {
  eyes.forEach(e => e.style.height="6px");
  setTimeout(() => eyes.forEach(e=>e.style.height="45px"),180);
},2500);

// Жесты рук и головы
function gesture(yes=true){
  rightArm.style.transform="rotate(25deg)";
  leftArm.style.transform="rotate(-15deg)";
  robotFace.style.transform=yes?"rotate(5deg)":"rotate(-5deg)";
  setTimeout(()=>{
    rightArm.style.transform="rotate(0deg)";
    leftArm.style.transform="rotate(0deg)";
    robotFace.style.transform="rotate(0deg)";
  },500);
}

// Память
let memory = JSON.parse(localStorage.getItem("robotMemory")||"{}");
function saveMemory(){ localStorage.setItem("robotMemory",JSON.stringify(memory)); }

// Эффект «печатающегося текста» на табличке
async function typeTablet(text){
  tablet.textContent="";
  for(let i=0;i<=text.length;i++){
    tablet.textContent=text.substring(0,i);
    await new Promise(r=>setTimeout(r,25));
  }
}

// --- Cloudflare Worker ---
async function askAI(text){
  try{
    const res=await fetch("https://pukipuki.damp-glade-283e.workers.dev/",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:text})
    });
    const data=await res.json();
    return data.answer||"Я пока не знаю 😅";
  }catch{
    return "Связь с ИИ временно недоступна 💥";
  }
}

// --- Ответ робота ---
async function respond(text){
  if(memory[text]){
    await typeTablet(memory[text]);
    gesture(memory[text].toLowerCase().includes("нет")?false:true);
    return;
  }
  const answer=await askAI(text);
  memory[text]=answer;
  saveMemory();
  await typeTablet(answer);
  gesture(answer.toLowerCase().includes("нет")?false:true);
}

// --- Голосовой ввод ---
micBtn.onclick=()=>{
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ tablet.textContent="Твой браузер не поддерживает голос. Попробуй Chrome!"; return; }
  const recognition = new SpeechRecognition();
  recognition.lang="ru-RU";
  recognition.interimResults=false;
  recognition.onstart=()=>{ tablet.textContent="Слушаю тебя... 🎧"; };
  recognition.onerror=()=>{ tablet.textContent="Не удалось распознать голос. Попробуй ещё раз!"; };
  recognition.onresult=async(e)=>{
    const transcript=e.results[0][0].transcript;
    await respond(transcript);
  };
  recognition.start();
};
