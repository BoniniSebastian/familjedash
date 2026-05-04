import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
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
setInterval(() => {
  const now = new Date();
  document.getElementById("time").textContent =
    now.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"});
  document.getElementById("date").textContent =
    now.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});
},1000);

/* LISTS */
function bind(colName, id) {
  const q = query(collection(db, colName), orderBy("createdAt","desc"));
  onSnapshot(q, snap => {
    const el = document.getElementById(id);
    el.innerHTML = "";
    snap.forEach(d => {
      const li = document.createElement("li");
      li.textContent = d.data().text;

      li.onclick = async () => {
        const newText = prompt("Ändra:", d.data().text);
        if(newText) {
          await updateDoc(doc(db,colName,d.id), { text:newText });
        }
      };

      li.ondblclick = () => deleteDoc(doc(db,colName,d.id));

      el.appendChild(li);
    });
  });
}

bind("komIhag","komihag-list");
bind("attGora","attgora-list");
bind("rutiner","rutiner-list");

/* POPUP */
let current = "";

window.openPopup = (type) => {
  current = type;
  document.getElementById("popup").classList.remove("hidden");
  document.getElementById("popup-title").textContent = type;
};

window.closePopup = () => {
  document.getElementById("popup").classList.add("hidden");
};

window.addItem = async () => {
  const input = document.getElementById("popup-input");
  if(!input.value) return;

  await addDoc(collection(db,current), {
    text: input.value,
    createdAt: Date.now()
  });

  input.value = "";
};

/* IMAGE */
const imgs = [
  "assets/foton/1.jpg",
  "assets/foton/2.jpg",
  "assets/foton/3.jpg",
  "assets/foton/4.jpg",
  "assets/foton/5.jpg"
];

let i = 0;
const sec = document.getElementById("image-section");

function change() {
  sec.style.opacity = 0;
  setTimeout(()=>{
    i=(i+1)%imgs.length;
    sec.style.backgroundImage=`url(${imgs[i]})`;
    sec.style.opacity=1;
  },300);
}
sec.style.backgroundImage=`url(${imgs[0]})`;
setInterval(change,600000);

/* WEATHER */
async function weather() {
  const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.3&longitude=18.4&current_weather=true");
  const d = await r.json();
  document.getElementById("weather").innerHTML = `<h1>${Math.round(d.current_weather.temperature)}°</h1>`;
}
weather();

/* QR */
QRCode.toCanvas(document.getElementById("qr"), window.location.href);

/* AUTO REFRESH */
setInterval(()=>location.reload(),180000);
