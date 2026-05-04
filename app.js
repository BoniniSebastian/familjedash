import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc
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
setInterval(() => {
  const now = new Date();
  document.getElementById("time").textContent =
    now.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"});

  document.getElementById("date").textContent =
    now.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});
},1000);

/* LISTS */
function bind(col,id){
  const q=query(collection(db,col),orderBy("createdAt","asc"));
  onSnapshot(q,snap=>{
    const el=document.getElementById(id);
    el.innerHTML="";
    snap.forEach(d=>{
      const li=document.createElement("li");
      li.textContent=d.data().text;

      li.onclick = () => {
        if(confirm("Ta bort?")){
          deleteDoc(doc(db,col,d.id));
        }
      };

      el.appendChild(li);
    });
  });
}

bind("komIhag","komihag-list");
bind("attGora","attgora-list");
bind("rutiner","rutiner-list");

/* POPUP */
let current="";

window.openPopup = (type)=>{
  current=type;
  document.getElementById("popup").classList.remove("hidden");
  document.getElementById("popup-title").textContent=type;

  const list=document.getElementById("popup-list");
  list.innerHTML="";

  const q=query(collection(db,type),orderBy("createdAt","asc"));
  onSnapshot(q,snap=>{
    list.innerHTML="";
    snap.forEach(d=>{
      const li=document.createElement("li");
      li.textContent=d.data().text;
      list.appendChild(li);
    });
  });
};

window.closePopup = ()=>{
  document.getElementById("popup").classList.add("hidden");
};

window.addItem = async ()=>{
  const input=document.getElementById("popup-input");
  if(!input.value) return;

  await addDoc(collection(db,current),{
    text:input.value,
    createdAt:Date.now()
  });

  input.value="";
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
const el=document.getElementById("image-section");

function setImg(){
  el.style.backgroundImage=`url(${imgs[i]})`;
}
setImg();

setInterval(()=>{
  i=(i+1)%imgs.length;
  setImg();
},600000);

/* WEATHER */
async function weather(){
  const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.3&longitude=18.4&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FStockholm");
  const d=await r.json();

  document.getElementById("weather-main").innerHTML =
    `${Math.round(d.current_weather.temperature)}°`;

  document.getElementById("forecast").innerHTML =
    `Max ${Math.round(d.daily.temperature_2m_max[0])}° / Min ${Math.round(d.daily.temperature_2m_min[0])}°`;
}
weather();

/* QR */
QRCode.toCanvas(document.getElementById("qr"), window.location.href);

/* AUTO REFRESH */
setInterval(()=>location.reload(),180000);
