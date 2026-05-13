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
  updateDoc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDf7wFAybRoUoofVXr-4vJMFXwfmATn8k",
  authDomain: "familydash-9d0dd.firebaseapp.com",
  projectId: "familydash-9d0dd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* CLOCK */
function updateClock(){
  const n = new Date();

  document.getElementById("time").textContent =
    n.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  document.getElementById("date").textContent =
    n.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
}

updateClock();
setInterval(updateClock, 1000);

/* IMAGE ROTATION */
const imgs = [
  "assets/foton/1.jpg",
  "assets/foton/2.jpg",
  "assets/foton/3.jpg",
  "assets/foton/4.jpg",
  "assets/foton/5.jpg"
];

let i = 0;
const bg = document.getElementById("image-bg");

function rotate(){
  bg.style.backgroundImage = `url(${imgs[i]})`;
  i = (i + 1) % imgs.length;
}

rotate();
setInterval(rotate, 8000);

/* CARD PREVIEWS */
function bind(col, id){
  const q = query(collection(db, col), orderBy("createdAt", "asc"));

  onSnapshot(q, snap => {
    const el = document.getElementById(id);
    el.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();
      if(data.done) return;

      const li = document.createElement("li");
      li.textContent = data.text;
      el.appendChild(li);
    });
  });
}

bind("komIhag", "komihag-list");
bind("attGora", "attgora-list");

/* POPUP */
let current = "";
let unsubscribePopup = null;

window.openPopup = (type, title) => {
  current = type;

  document.getElementById("popup-title").textContent = title;
  document.getElementById("popup").classList.remove("hidden");

  const activeList = document.getElementById("popup-list");
  const doneList = document.getElementById("popup-done-list");
  const input = document.getElementById("popup-input");

  input.value = "";
  setTimeout(() => input.focus(), 100);

  if(unsubscribePopup) unsubscribePopup();

  const q = query(collection(db, type), orderBy("createdAt", "asc"));

  unsubscribePopup = onSnapshot(q, snap => {
    activeList.innerHTML = "";
    doneList.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();
      const subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];

      const li = document.createElement("li");
      li.className = "task-item";

      const topRow = document.createElement("div");
      topRow.className = "task-top-row";

      const left = document.createElement("div");
      left.className = "popup-item-left";

      const check = document.createElement("button");
      check.className = data.done ? "check checked" : "check";
      check.textContent = data.done ? "✓" : "";

      check.onclick = async (e) => {
        e.stopPropagation();
        await updateDoc(doc(db, type, d.id), { done: !data.done });
      };

      const span = document.createElement("span");
      span.textContent = data.text;

      span.onclick = async () => {
        const val = prompt("Ändra", data.text);
        if(val && val.trim()){
          await updateDoc(doc(db, type, d.id), { text: val.trim() });
        }
      };

      left.appendChild(check);
      left.appendChild(span);

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "Ta bort";
      del.onclick = () => deleteDoc(doc(db, type, d.id));

      topRow.appendChild(left);
      topRow.appendChild(del);

      li.appendChild(topRow);

      const subWrap = document.createElement("div");
      subWrap.className = "subtasks";

      subtasks.forEach((sub, index) => {
        const subRow = document.createElement("div");
        subRow.className = sub.done ? "subtask done-subtask" : "subtask";

        const subCheck = document.createElement("button");
        subCheck.className = sub.done ? "sub-check checked" : "sub-check";
        subCheck.textContent = sub.done ? "✓" : "";

        subCheck.onclick = async (e) => {
          e.stopPropagation();

          const updated = [...subtasks];
          updated[index] = {
            ...updated[index],
            done: !updated[index].done
          };

          await updateDoc(doc(db, type, d.id), { subtasks: updated });
        };

        const subText = document.createElement("span");
        subText.textContent = sub.text;

        const subDelete = document.createElement("button");
        subDelete.className = "sub-delete";
        subDelete.textContent = "×";

        subDelete.onclick = async (e) => {
          e.stopPropagation();

          const updated = subtasks.filter((_, idx) => idx !== index);
          await updateDoc(doc(db, type, d.id), { subtasks: updated });
        };

        subRow.appendChild(subCheck);
        subRow.appendChild(subText);
        subRow.appendChild(subDelete);

        subWrap.appendChild(subRow);
      });

      const subInput = document.createElement("input");
      subInput.className = "subtask-input";
      subInput.placeholder = "Lägg till delmål...";

      subInput.addEventListener("keydown", async (e) => {
        if(e.key === "Enter"){
          e.preventDefault();

          const value = subInput.value.trim();
          if(!value) return;

          const updated = [
            ...subtasks,
            {
              text: value,
              done: false
            }
          ];

          await updateDoc(doc(db, type, d.id), { subtasks: updated });
          subInput.value = "";
        }
      });

      subWrap.appendChild(subInput);
      li.appendChild(subWrap);

      if(data.done){
        li.classList.add("done-item");
        doneList.appendChild(li);
      } else {
        activeList.appendChild(li);
      }
    });
  });
};

window.closePopup = () => {
  document.getElementById("popup").classList.add("hidden");
};

window.addItem = async () => {
  const input = document.getElementById("popup-input");

  if(!input.value.trim()) return;

  await addDoc(collection(db, current), {
    text: input.value.trim(),
    createdAt: Date.now(),
    done: false,
    subtasks: []
  });

  input.value = "";
  input.focus();
};

/* KEYBOARD */
document.addEventListener("keydown", e => {
  const popupOpen =
    !document.getElementById("popup").classList.contains("hidden");

  const notesOpen =
    !document.getElementById("notesPopup").classList.contains("hidden");

  if(e.key === "Escape"){
    if(popupOpen) closePopup();
    if(notesOpen) closeNotesPopup();
  }

  if(
    e.key === "Enter" &&
    popupOpen &&
    document.activeElement.id === "popup-input"
  ){
    e.preventDefault();
    addItem();
  }
});

/* NOTES */
const notesRef = doc(db, "snabbanteckningar", "main");

async function loadNote(){
  const snap = await getDoc(notesRef);

  if(snap.exists()){
    const text = snap.data().text || "";

    document.getElementById("notes-preview").textContent =
      text.trim() ? text : "Tryck för att skriva.";
  }
}

window.openNotesPopup = async () => {
  const snap = await getDoc(notesRef);
  const text = snap.exists() ? snap.data().text || "" : "";

  document.getElementById("notes-input").value = text;
  document.getElementById("notesPopup").classList.remove("hidden");

  setTimeout(() => {
    document.getElementById("notes-input").focus();
  }, 100);
};

window.closeNotesPopup = () => {
  document.getElementById("notesPopup").classList.add("hidden");
};

window.saveNote = async () => {
  const text = document.getElementById("notes-input").value;

  await setDoc(notesRef, {
    text,
    updatedAt: Date.now()
  });

  document.getElementById("notes-preview").textContent =
    text.trim() ? text : "Tryck för att skriva.";

  closeNotesPopup();
};

loadNote();

/* WEATHER */
async function loadWeather(){
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=59.3&longitude=18.4&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe%2FStockholm"
  );

  const data = await res.json();

  const temp = Math.round(data.current_weather.temperature);
  const max = Math.round(data.daily.temperature_2m_max[0]);
  const min = Math.round(data.daily.temperature_2m_min[0]);

  let icon = "☀️";
  const code = data.current_weather.weathercode;

  if(code > 2 && code < 50) icon = "☁️";
  if(code >= 50 && code < 70) icon = "🌧️";
  if(code >= 70) icon = "❄️";

  document.getElementById("weather-icon").textContent = icon;
  document.getElementById("weather-main").textContent = temp + "°";
  document.getElementById("weather-feels").textContent = "Känns som " + temp + "°";
  document.getElementById("forecast").textContent = "Max " + max + "° / Min " + min + "°";
}

loadWeather();

/* AUTO REFRESH */
setInterval(() => {
  location.reload();
}, 180000);
