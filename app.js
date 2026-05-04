import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyBDf7wFAybRoUoofVXr-4vJMFXwfmATn8k",
  authDomain: "familydash-9d0dd.firebaseapp.com",
  projectId: "familydash-9d0dd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* CLOCK */
setInterval(()=>{
  const n=new Date();
  document.getElementById("time").textContent =
    n.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"});
  document.getElementById("date").textContent =
    n.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});
},1000);

/* LISTS */
function bind(name,id){
  const q=query(collection(db,name),orderBy("createdAt","asc"));
  onSnapshot(q,snap=>{
    const el=document.getElementById(id);
    el.innerHTML="";
    snap.forEach(d=>{
      const li=document.createElement("li");
      li.textContent=d.data().text;
      el.appendChild(li);
    });
  });
}

bind("komIhag","komihag-list");
bind("attGora","attgora-list");
bind("rutiner","rutiner-list");

/* IMAGE FIX */
const imgs=[
"assets/foton/1.jpg",
"assets/foton/2.jpg",
"assets/foton/3.jpg",
"assets/foton/4.jpg",
"assets/foton/5.jpg"
];

let i=0;
const imgEl=document.getElementById("image-section");

function setImg(){
  imgEl.style.backgroundImage=`url(${imgs[i]})`;
}
setImg();

setInterval(()=>{
  i=(i+1)%imgs.length;
  setImg();
},600000);

/* WEATHER FIX */
async function weather(){
  const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.3&longitude=18.4&current_weather=true");
  const d=await r.json();

  document.getElementById("weather-main").innerText =
    Math.round(d.current_weather.temperature)+"°";
}
weather();

/* QR */
QRCode.toCanvas(document.getElementById("qr"), window.location.href);

/* AUTO REFRESH */
setInterval(()=>location.reload(),180000);
