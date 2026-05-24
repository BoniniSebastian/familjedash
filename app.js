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
    n.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit"
    });

  document.getElementById("date").textContent =
    n.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
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

let imgIndex = 0;
const bg = document.getElementById("image-bg");

function rotate(){
  bg.style.backgroundImage = `url(${imgs[imgIndex]})`;
  imgIndex = (imgIndex + 1) % imgs.length;
}

rotate();
setInterval(rotate, 30000);

/* HOME PREVIEWS */

function bindRememberPreview(){
  const q = query(collection(db, "komIhag"), orderBy("createdAt", "asc"));

  onSnapshot(q, snap => {
    const el = document.getElementById("komihag-list");
    el.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();
      if(data.done) return;

      const li = document.createElement("li");
      if(data.important) li.classList.add("important-dot");
      li.textContent = data.text;
      el.appendChild(li);
    });
  });
}

function bindActionsPreview(){
  const q = query(collection(db, "attGora"), orderBy("createdAt", "asc"));

  onSnapshot(q, snap => {
    const el = document.getElementById("actions-list");
    el.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();
      if(data.done) return;

      const subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];
      const doneCount = subtasks.filter(s => s.done).length;

      const li = document.createElement("li");

      const title = document.createElement("span");
      title.textContent = data.text;
      li.appendChild(title);

      if(subtasks.length > 0){
        const meta = document.createElement("div");
        meta.className = "subtask-count-preview";
        meta.textContent = `${doneCount} av ${subtasks.length}`;
        li.appendChild(meta);
      }

      el.appendChild(li);
    });
  });
}

bindRememberPreview();
bindActionsPreview();

/* TASK RENDERER */

function renderTaskItem(type, d){
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
    await updateDoc(doc(db, type, d.id), {
      done: !data.done
    });
  };

  const span = document.createElement("span");
  span.textContent = data.text;

  span.onclick = async () => {
    const val = prompt("Ändra", data.text);
    if(val && val.trim()){
      await updateDoc(doc(db, type, d.id), {
        text: val.trim()
      });
    }
  };

  left.appendChild(check);
  left.appendChild(span);

  const controls = document.createElement("div");
  controls.className = "task-controls";

  if(type === "komIhag"){
    const important = document.createElement("button");
    important.className = data.important ? "important-btn active" : "important-btn";
    important.textContent = data.important ? "Viktig" : "Gör viktig";

    important.onclick = async (e) => {
      e.stopPropagation();
      await updateDoc(doc(db, type, d.id), {
        important: !data.important
      });
    };

    controls.appendChild(important);
  }

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "Ta bort";
  del.onclick = () => deleteDoc(doc(db, type, d.id));

  controls.appendChild(del);

  topRow.appendChild(left);
  topRow.appendChild(controls);

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

      await updateDoc(doc(db, type, d.id), {
        subtasks: updated
      });
    };

    const subText = document.createElement("span");
    subText.textContent = sub.text;

    const subDelete = document.createElement("button");
    subDelete.className = "sub-delete";
    subDelete.textContent = "×";

    subDelete.onclick = async (e) => {
      e.stopPropagation();

      const updated = subtasks.filter((_, idx) => idx !== index);

      await updateDoc(doc(db, type, d.id), {
        subtasks: updated
      });
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

      await updateDoc(doc(db, type, d.id), {
        subtasks: updated
      });

      subInput.value = "";
    }
  });

  subWrap.appendChild(subInput);
  li.appendChild(subWrap);

  if(data.done){
    li.classList.add("done-item");
  }

  return li;
}

/* VIEW SYSTEM */

let activeView = null;
let viewReturnTarget = "home";
let unsubscribeRemember = null;
let unsubscribeActions = null;
let unsubscribeLinks = null;
let unsubscribeJobs = null;
let editingJobId = null;

function showCloseButton(){
  document.getElementById("layerClose").classList.remove("hidden");
}

function hideCloseButton(){
  document.getElementById("layerClose").classList.add("hidden");
}

function lockPage(){
  document.body.classList.add("layer-open");
}

function unlockPage(){
  document.body.classList.remove("layer-open");
}

window.openMenu = () => {
  document.getElementById("menuLayer").classList.remove("hidden");
  document.getElementById("menuLayer").classList.add("menu-bounce");
  lockPage();
  showCloseButton();

  setTimeout(() => {
    document.getElementById("menuLayer").classList.remove("menu-bounce");
  }, 520);
};

window.closeMenu = () => {
  closeMenuView(false);
  document.getElementById("menuLayer").classList.add("hidden");
  hideCloseButton();
  unlockPage();
};

window.openMenuView = (view) => {
  viewReturnTarget = "menu";
  openView(view);
};

window.openDashboardView = (view) => {
  viewReturnTarget = "home";
  openView(view);
};

function openView(view){
  activeView = view;

  document.getElementById("viewLayer").classList.remove("hidden");
  lockPage();
  showCloseButton();

  document.querySelectorAll(".menu-view").forEach(el => {
    el.classList.add("hidden");
  });

  if(view === "calendar"){
    document.getElementById("view-title").textContent = "Meny";
    document.getElementById("calendarView").classList.remove("hidden");
  }

  if(view === "remember"){
    document.getElementById("view-title").textContent = viewReturnTarget === "menu" ? "Meny" : "Kom-ihåg";
    document.getElementById("rememberView").classList.remove("hidden");
    bindRememberView();
  }

  if(view === "actions"){
    document.getElementById("view-title").textContent = viewReturnTarget === "menu" ? "Meny" : "Actions";
    document.getElementById("actionsView").classList.remove("hidden");
    bindActionsView();
  }

  if(view === "notes"){
    document.getElementById("view-title").textContent = "Snabbanteckningar";
    document.getElementById("notesView").classList.remove("hidden");
    openNotesView();
  }

  if(view === "links"){
    document.getElementById("view-title").textContent = "Meny";
    document.getElementById("linksView").classList.remove("hidden");
    bindLinksView();
  }

  if(view === "jobs"){
    document.getElementById("view-title").textContent = "Meny";
    document.getElementById("jobsView").classList.remove("hidden");
    bindJobsView();
  }
}

window.closeMenuView = (manageClose = true) => {
  activeView = null;
  document.getElementById("viewLayer").classList.add("hidden");

  document.querySelectorAll(".menu-view").forEach(el => {
    el.classList.add("hidden");
  });

  if(manageClose){
    if(viewReturnTarget === "menu"){
      showCloseButton();
      lockPage();
    } else {
      hideCloseButton();
      unlockPage();
    }
  }
};

window.closeCurrentLayer = () => {
  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  if(viewOpen){
    closeMenuView(true);
    return;
  }

  if(menuOpen){
    closeMenu();
    return;
  }
};

/* REMEMBER VIEW */

function bindRememberView(){
  const activeList = document.getElementById("remember-active");
  const doneList = document.getElementById("remember-done");

  if(unsubscribeRemember) unsubscribeRemember();

  const q = query(collection(db, "komIhag"), orderBy("createdAt", "asc"));

  unsubscribeRemember = onSnapshot(q, snap => {
    activeList.innerHTML = "";
    doneList.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();
      const item = renderTaskItem("komIhag", d);

      if(data.done){
        doneList.appendChild(item);
      } else {
        activeList.appendChild(item);
      }
    });
  });
}

/* ACTIONS VIEW */

function bindActionsView(){
  const activeList = document.getElementById("actions-active");
  const doneList = document.getElementById("actions-done");

  if(unsubscribeActions) unsubscribeActions();

  const q = query(collection(db, "attGora"), orderBy("createdAt", "asc"));

  unsubscribeActions = onSnapshot(q, snap => {
    activeList.innerHTML = "";
    doneList.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();
      const item = renderTaskItem("attGora", d);

      if(data.done){
        doneList.appendChild(item);
      } else {
        activeList.appendChild(item);
      }
    });
  });
}

window.addViewItem = async (collectionName, inputId) => {
  const input = document.getElementById(inputId);

  if(!input.value.trim()) return;

  await addDoc(collection(db, collectionName), {
    text: input.value.trim(),
    createdAt: Date.now(),
    done: false,
    important: false,
    subtasks: []
  });

  input.value = "";
  input.focus();
};

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

async function openNotesView(){
  const snap = await getDoc(notesRef);
  const text = snap.exists() ? snap.data().text || "" : "";

  document.getElementById("notes-input").value = text;

  setTimeout(() => {
    document.getElementById("notes-input").focus();
  }, 100);
}

window.saveNote = async () => {
  const text = document.getElementById("notes-input").value;

  await setDoc(notesRef, {
    text,
    updatedAt: Date.now()
  });

  document.getElementById("notes-preview").textContent =
    text.trim() ? text : "Tryck för att skriva.";
};

loadNote();

/* LINKS */

function normalizeUrl(url){
  if(!url) return "";
  const trimmed = url.trim();

  if(trimmed.startsWith("http://") || trimmed.startsWith("https://")){
    return trimmed;
  }

  return "https://" + trimmed;
}

function bindLinksView(){
  const list = document.getElementById("links-list");

  if(unsubscribeLinks) unsubscribeLinks();

  const q = query(collection(db, "lankar"), orderBy("createdAt", "asc"));

  unsubscribeLinks = onSnapshot(q, snap => {
    list.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();

      const li = document.createElement("li");
      li.className = "link-item";

      const a = document.createElement("a");
      a.href = normalizeUrl(data.url);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = data.title || data.url;

      const urlText = document.createElement("div");
      urlText.className = "link-url";
      urlText.textContent = data.url;

      const left = document.createElement("div");
      left.appendChild(a);
      left.appendChild(urlText);

      const controls = document.createElement("div");
      controls.className = "task-controls";

      const edit = document.createElement("button");
      edit.className = "delete-btn";
      edit.textContent = "Ändra";
      edit.onclick = async () => {
        const newTitle = prompt("Namn", data.title || "");
        if(newTitle === null) return;

        const newUrl = prompt("URL", data.url || "");
        if(newUrl === null) return;

        await updateDoc(doc(db, "lankar", d.id), {
          title: newTitle.trim(),
          url: newUrl.trim()
        });
      };

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "Ta bort";
      del.onclick = () => deleteDoc(doc(db, "lankar", d.id));

      controls.appendChild(edit);
      controls.appendChild(del);

      li.appendChild(left);
      li.appendChild(controls);

      list.appendChild(li);
    });
  });
}

window.addLink = async () => {
  const titleInput = document.getElementById("link-title-input");
  const urlInput = document.getElementById("link-url-input");

  const title = titleInput.value.trim();
  const url = urlInput.value.trim();

  if(!title || !url) return;

  await addDoc(collection(db, "lankar"), {
    title,
    url,
    createdAt: Date.now()
  });

  titleInput.value = "";
  urlInput.value = "";
  titleInput.focus();
};

/* JOBS */

function clearJobForm(){
  editingJobId = null;
  document.getElementById("job-company-input").value = "";
  document.getElementById("job-status-input").value = "";
  document.getElementById("job-notes-input").value = "";
}

function bindJobsView(){
  const list = document.getElementById("jobs-list");

  if(unsubscribeJobs) unsubscribeJobs();

  const q = query(collection(db, "jobbsokaren"), orderBy("createdAt", "desc"));

  unsubscribeJobs = onSnapshot(q, snap => {
    list.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();

      const li = document.createElement("li");
      li.className = "job-item";

      const top = document.createElement("div");
      top.className = "job-top";

      const company = document.createElement("div");
      company.className = "job-company";
      company.textContent = data.company || "Utan företag";

      const status = document.createElement("div");
      status.className = "job-status";
      status.textContent = data.status || "Ingen status";

      top.appendChild(company);
      top.appendChild(status);

      const notes = document.createElement("div");
      notes.className = "job-notes";
      notes.textContent = data.notes || "";

      const controls = document.createElement("div");
      controls.className = "task-controls job-controls";

      const edit = document.createElement("button");
      edit.className = "delete-btn";
      edit.textContent = "Ändra";

      edit.onclick = () => {
        editingJobId = d.id;
        document.getElementById("job-company-input").value = data.company || "";
        document.getElementById("job-status-input").value = data.status || "";
        document.getElementById("job-notes-input").value = data.notes || "";
        document.getElementById("job-company-input").focus();
      };

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "Ta bort";
      del.onclick = () => deleteDoc(doc(db, "jobbsokaren", d.id));

      controls.appendChild(edit);
      controls.appendChild(del);

      li.appendChild(top);

      if(data.notes){
        li.appendChild(notes);
      }

      li.appendChild(controls);

      list.appendChild(li);
    });
  });
}

window.saveJob = async () => {
  const company = document.getElementById("job-company-input").value.trim();
  const status = document.getElementById("job-status-input").value.trim();
  const notes = document.getElementById("job-notes-input").value.trim();

  if(!company && !status && !notes) return;

  if(editingJobId){
    await updateDoc(doc(db, "jobbsokaren", editingJobId), {
      company,
      status,
      notes,
      updatedAt: Date.now()
    });
  } else {
    await addDoc(collection(db, "jobbsokaren"), {
      company,
      status,
      notes,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  clearJobForm();
};

/* SWIPE DOWN GESTURE */

let touchStartY = 0;
let touchStartX = 0;
let validSwipeStart = false;

function isTypingTarget(el){
  if(!el) return false;

  const tag = el.tagName ? el.tagName.toLowerCase() : "";

  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
}

document.addEventListener("touchstart", e => {
  if(!e.touches || !e.touches.length) return;

  const target = e.target;

  if(isTypingTarget(target)){
    validSwipeStart = false;
    return;
  }

  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const pageIsAtTop =
    window.scrollY <= 5;

  validSwipeStart =
    menuOpen ||
    viewOpen ||
    pageIsAtTop;

}, { passive: true });

document.addEventListener("touchend", e => {
  if(!validSwipeStart) return;
  if(!e.changedTouches || !e.changedTouches.length) return;

  const endY = e.changedTouches[0].clientY;
  const endX = e.changedTouches[0].clientX;

  const diffY = endY - touchStartY;
  const diffX = Math.abs(endX - touchStartX);

  if(diffY < 48 || diffX > 90) return;

  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  if(viewOpen){
    closeMenuView(true);
    return;
  }

  if(menuOpen){
    closeMenu();
    return;
  }

  openMenu();

}, { passive: true });

/* KEYBOARD */

document.addEventListener("keydown", e => {
  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  if(e.key === "Escape"){
    if(viewOpen || menuOpen){
      closeCurrentLayer();
      return;
    }
  }

  if(e.key === "Enter"){
    if(document.activeElement.id === "remember-input"){
      e.preventDefault();
      addViewItem("komIhag", "remember-input");
    }

    if(document.activeElement.id === "actions-input"){
      e.preventDefault();
      addViewItem("attGora", "actions-input");
    }

    if(document.activeElement.id === "link-url-input"){
      e.preventDefault();
      addLink();
    }
  }
});

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