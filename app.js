import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  query, orderBy, deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyBDf7wFAybRoUoofVXr-4vJMFXwfmATn8k",
  authDomain: "familydash-9d0dd.firebaseapp.com",
  projectId: "familydash-9d0dd",
  storageBucket: "familydash-9d0dd.firebasestorage.app",
  messagingSenderId: "1087350004176",
  appId: "1:1087350004176:web:8660e048082b2db0f781d5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* CLOCK */
setInterval(()=>{
  const n=new Date();
  time.textContent=n.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"});
  date.textContent=n.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});
},1000);

/* LIST */
function bind(name,id){
  const q=query(collection(db,name),orderBy("createdAt","asc"));
  onSnapshot(q,s=>{
    const el=document.getElementById(id);
    el.innerHTML="";
    s.forEach(d=>{
      const li=document.createElement("li");

      const input=document.createElement("input");
      input.value=d.data().text;

      input.onchange=()=>{
        updateDoc(doc(db,name,d.id),{text:input.value});
      };

      li.ondblclick=()=>deleteDoc(doc(db,name,d.id));

      li.appendChild(input);
      el.appendChild(li);
    });
  });
}

bind("komIhag","komihag-list");
bind("attGora","attgora-list");
bind("rutiner","rutiner-list");

/* POPUP */
let current="";
window.openPopup=(t)=>{
  current=t;
  popup.classList.remove("hidden");
};
window.closePopup=()=>popup.classList.add("hidden");

window.addItem=async()=>{
  const val=popup-input.value;
  if(!val) return;
  await addDoc(collection(db,current),{
    text:val,
    createdAt:Date.now()
  });
  popup-input.value="";
};

/* IMAGE */
const imgs=[
"assets/foton/1.jpg",
"assets/foton/2.jpg",
"assets/foton/3.jpg",
"assets/foton/4.jpg",
"assets/foton/5.jpg"
];
let i=0;
const sec=document.getElementById("image-section");
sec.style.backgroundImage=`url(${imgs[0]})`;

setInterval(()=>{
  i=(i+1)%imgs.length;
  sec.style.backgroundImage=`url(${imgs[i]})`;
},600000);

/* WEATHER */
async function weather(){
  const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.3&longitude=18.4&current_weather=true&daily=temperature_2m_max,temperature_2m_min");
  const d=await r.json();

  weather-main.innerHTML=`${Math.round(d.current_weather.temperature)}° ☀️`;
  forecast.innerHTML=`${Math.round(d.daily.temperature_2m_max[0])}° / ${Math.round(d.daily.temperature_2m_min[0])}°`;
}
weather();

/* QR */
QRCode.toCanvas(document.getElementById("qr"),location.href);

/* AUTO REFRESH */
setInterval(()=>location.reload(),180000);
