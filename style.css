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
   GENERIC LIST LOGIC
===================== */

function bindList({ colName, listId, moreId }) {
  const ref = collection(db, colName);
  const q = query(ref, orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    const listEl = document.getElementById(listId);
    const moreEl = document.getElementById(moreId);

    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));

    // visa max 8
    const visible = items.slice(0, 8);
    const hiddenCount = Math.max(items.length - 8, 0);

    listEl.innerHTML = "";
    visible.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.text;
      listEl.appendChild(li);
    });

    moreEl.textContent = hiddenCount > 0 ? `+${hiddenCount} fler` : "";
  });
}

/* Bind dashboard lists */
bindList({ colName: "komIhag", listId: "komihag-list", moreId: "komihag-more" });
bindList({ colName: "attGora", listId: "attgora-list", moreId: "attgora-more" });

/* =====================
   POPUP
===================== */

let currentType = null;
let unsubscribePopup = null;

window.openPopup = (type) => {
  currentType = type;

  document.getElementById("popup").classList.remove("hidden");
  document.getElementById("popup-title").textContent =
    type === "komihag" ? "Kom ihåg" : "Att göra";

  const listEl = document.getElementById("popup-list");
  listEl.innerHTML = "";

  const colName = type === "komihag" ? "komIhag" : "attGora";
  const ref = collection(db, colName);
  const q = query(ref, orderBy("createdAt", "desc"));

  if (unsubscribePopup) unsubscribePopup();

  unsubscribePopup = onSnapshot(q, (snap) => {
    listEl.innerHTML = "";

    snap.forEach((docSnap) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${docSnap.data().text}</span>
        <span style="opacity:.6">Ta bort</span>
      `;

      li.onclick = () => deleteDoc(doc(db, colName, docSnap.id));

      listEl.appendChild(li);
    });
  });

  // fokus direkt
  setTimeout(() => {
    document.getElementById("popup-input").focus();
  }, 50);
};

window.closePopup = () => {
  document.getElementById("popup").classList.add("hidden");
};

window.addItem = async () => {
  const input = document.getElementById("popup-input");
  const text = input.value.trim();
  if (!text) return;

  const colName = currentType === "komihag" ? "komIhag" : "attGora";
  const ref = collection(db, colName);

  await addDoc(ref, {
    text,
    createdAt: Date.now()
  });

  input.value = "";
  input.focus();
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

function setImage(idx) {
  section.style.backgroundImage = `url(${images[idx]})`;
}

function changeImage() {
  section.style.opacity = 0;
  setTimeout(() => {
    current = (current + 1) % images.length;
    setImage(current);
    section.style.opacity = 1;
  }, 500);
}

setImage(0);
setInterval(changeImage, 600000); // 10 min

/* =====================
   CLOCK / DATE
===================== */

function updateClock() {
  const now = new Date();

  document.getElementById("time").textContent =
    now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  document.getElementById("date").textContent =
    now.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
}

setInterval(updateClock, 1000);
updateClock();
