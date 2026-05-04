import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =====================
   FIREBASE
===================== */

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

/* =====================
   KOM IHÅG
===================== */

const komRef = collection(db, "komIhag");
const komQ = query(komRef, orderBy("createdAt", "desc"), limit(8));

onSnapshot(komQ, (snap) => {
  const list = document.getElementById("komihag-list");
  list.innerHTML = "";

  snap.forEach((docSnap) => {
    const li = document.createElement("li");
    li.textContent = docSnap.data().text;
    li.onclick = () => deleteDoc(doc(db, "komIhag", docSnap.id));
    list.appendChild(li);
  });
});

window.addKomIhag = async () => {
  const input = document.getElementById("komihag-input");
  if (!input.value) return;

  await addDoc(komRef, {
    text: input.value,
    createdAt: Date.now()
  });

  input.value = "";
};

/* =====================
   ATT GÖRA
===================== */

const attRef = collection(db, "attGora");
const attQ = query(attRef, orderBy("createdAt", "desc"), limit(8));

onSnapshot(attQ, (snap) => {
  const list = document.getElementById("attgora-list");
  list.innerHTML = "";

  snap.forEach((docSnap) => {
    const li = document.createElement("li");
    li.textContent = docSnap.data().text;
    li.onclick = () => deleteDoc(doc(db, "attGora", docSnap.id));
    list.appendChild(li);
  });
});

window.addAttGora = async () => {
  const input = document.getElementById("attgora-input");
  if (!input.value) return;

  await addDoc(attRef, {
    text: input.value,
    createdAt: Date.now()
  });

  input.value = "";
};

/* =====================
   IMAGE FEED
===================== */

const images = [
  "assets/foton/img1.jpg",
  "assets/foton/img2.jpg",
  "assets/foton/img3.jpg"
];

let current = 0;
const section = document.getElementById("image-section");

function changeImage() {
  section.style.opacity = 0;

  setTimeout(() => {
    current = (current + 1) % images.length;
    section.style.backgroundImage = `url(${images[current]})`;
    section.style.opacity = 1;
  }, 500);
}

section.style.backgroundImage = `url(${images[0]})`;
setInterval(changeImage, 600000);

/* =====================
   CLOCK
===================== */

function updateClock() {
  const now = new Date();

  document.querySelector(".time").textContent =
    now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  document.querySelector(".date").textContent =
    now.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
}

setInterval(updateClock, 1000);
updateClock();

/* =====================
   NÄSTA (ICS 🔥)
===================== */

const ICS_URL = "https://api.allorigins.win/raw?url=" +
  encodeURIComponent("https://calendar.google.com/calendar/ical/ericssonbonini%40gmail.com/public/basic.ics");

async function getNextEvent() {
  const res = await fetch(ICS_URL);
  const text = await res.text();

  const events = [];
  const parts = text.split("BEGIN:VEVENT");

  parts.forEach(p => {
    const title = p.match(/SUMMARY:(.*)/);
    const start = p.match(/DTSTART:(\d+)/);

    if (title && start) {
      const t = title[1];

      const d = start[1];
      const date = new Date(
        d.slice(0,4),
        d.slice(4,6)-1,
        d.slice(6,8),
        d.slice(9,11),
        d.slice(11,13)
      );

      events.push({ title: t, date });
    }
  });

  const now = new Date();

  const next = events
    .filter(e => e.date > now)
    .sort((a,b) => a.date - b.date)[0];

  if (!next) {
    document.getElementById("next-event").textContent = "Inget planerat";
    return;
  }

  const diff = Math.floor((next.date - now)/60000);
  const hours = Math.floor(diff/60);
  const mins = diff % 60;

  document.getElementById("next-event").innerHTML = `
    <div style="font-size:18px">${next.title}</div>
    <div>${next.date.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"})}</div>
    <div style="opacity:0.7">om ${hours}h ${mins}m</div>
  `;
}

setInterval(getNextEvent, 60000);
getNextEvent();
