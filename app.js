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

let savedScrollY = 0;
let editingJobId = null;
let detailTask = null;

let unsubscribeRemember = null;
let unsubscribeActions = null;
let unsubscribeLinks = null;
let unsubscribeJobs = null;

/* THEME */

function applyTheme(theme){
  document.body.classList.toggle("light-mode", theme === "light");
  localStorage.setItem("dashboardTheme", theme);
}

window.toggleTheme = () => {
  const isLight = document.body.classList.contains("light-mode");
  applyTheme(isLight ? "dark" : "light");
};

applyTheme(localStorage.getItem("dashboardTheme") || "dark");

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
  "assets/foton/Back360.jpeg"
];

let imgIndex = 0;
const bg = document.getElementById("image-bg");

function rotate(){
  bg.style.backgroundImage = `url(${imgs[imgIndex]})`;
  imgIndex = (imgIndex + 1) % imgs.length;
}

rotate();
setInterval(rotate, 60000);

/* PAGE LOCK */

function lockPage(){
  savedScrollY = window.scrollY || 0;
  document.body.classList.add("layer-open");
  document.body.style.top = `-${savedScrollY}px`;
}

function unlockPage(){
  document.body.classList.remove("layer-open");
  document.body.style.top = "";
  window.scrollTo(0, savedScrollY);
}

function showCloseButton(){
  document.getElementById("layerClose").classList.remove("hidden");
}

function hideCloseButton(){
  document.getElementById("layerClose").classList.add("hidden");
}

/* HOME PREVIEWS */

function getSubtaskMeta(data){
  const subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];
  const doneCount = subtasks.filter(s => s.done).length;

  if(subtasks.length === 0) return "";

  return `${doneCount} av ${subtasks.length} slutförda`;
}

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

      const title = document.createElement("span");
      title.textContent = data.text;
      li.appendChild(title);

      const metaText = getSubtaskMeta(data);
      if(metaText){
        const meta = document.createElement("div");
        meta.className = "subtask-count-preview";
        meta.textContent = metaText;
        li.appendChild(meta);
      }

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

      const li = document.createElement("li");

      const title = document.createElement("span");
      title.textContent = data.text;
      li.appendChild(title);

      const metaText = getSubtaskMeta(data);
      if(metaText){
        const meta = document.createElement("div");
        meta.className = "subtask-count-preview";
        meta.textContent = metaText;
        li.appendChild(meta);
      }

      el.appendChild(li);
    });
  });
}

bindRememberPreview();
bindActionsPreview();

/* TASK ITEMS */

function renderTaskItem(type, d){
  const data = d.data();
  const metaText = getSubtaskMeta(data);

  const li = document.createElement("li");
  li.className = "task-item";
  if(data.done) li.classList.add("done-item");

  const row = document.createElement("div");
  row.className = "task-top-row";

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

  const textWrap = document.createElement("div");
  textWrap.className = "task-text-wrap";

  const title = document.createElement("span");
  title.textContent = data.text;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.textContent = metaText;

  textWrap.appendChild(title);
  if(metaText) textWrap.appendChild(meta);

  left.appendChild(check);
  left.appendChild(textWrap);

  const controls = document.createElement("div");
  controls.className = "task-controls";

  if(type === "komIhag"){
    const important = document.createElement("button");
    important.className = data.important ? "important-btn active" : "important-btn";
    important.textContent = "Viktig";

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

  del.onclick = (e) => {
    e.stopPropagation();
    deleteDoc(doc(db, type, d.id));
  };

  controls.appendChild(del);

  row.appendChild(left);
  row.appendChild(controls);
  li.appendChild(row);

  li.onclick = () => openTaskDetail(type, d.id, data);

  return li;
}

/* VIEW SYSTEM */

let viewReturnTarget = "home";

window.openMenu = () => {
  document.getElementById("menuLayer").classList.remove("hidden");
  lockPage();
  showCloseButton();
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
  document.getElementById("viewLayer").classList.remove("hidden");
  lockPage();
  showCloseButton();

  document.querySelectorAll(".menu-view").forEach(el => {
    el.classList.add("hidden");
  });

  closeTaskDetail(false);

  if(view === "calendar"){
    document.getElementById("calendarView").classList.remove("hidden");
  }

  if(view === "remember"){
    document.getElementById("rememberView").classList.remove("hidden");
    bindRememberView();
  }

  if(view === "actions"){
    document.getElementById("actionsView").classList.remove("hidden");
    bindActionsView();
  }

  if(view === "notes"){
    document.getElementById("notesView").classList.remove("hidden");
    openNotesView();
  }

  if(view === "timer"){
    document.getElementById("timerView").classList.remove("hidden");
    openTimerView();
  }

  if(view === "links"){
    document.getElementById("linksView").classList.remove("hidden");
    bindLinksView();
  }

  if(view === "jobs"){
    document.getElementById("jobsView").classList.remove("hidden");
    bindJobsView();
  }
}

window.closeMenuView = (manageClose = true) => {
  closeTaskDetail(false);

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
  const detailOpen =
    !document.getElementById("taskDetail").classList.contains("hidden");

  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  if(detailOpen){
    closeTaskDetail(true);
    return;
  }

  if(viewOpen){
    closeMenuView(true);
    return;
  }

  if(menuOpen){
    closeMenu();
    return;
  }
};

/* REMEMBER / ACTIONS */

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

/* TASK DETAIL */

function openTaskDetail(type, id, data){
  detailTask = {
    type,
    id,
    data: {
      ...data,
      subtasks: Array.isArray(data.subtasks) ? data.subtasks : []
    }
  };

  document.getElementById("detail-title-input").value = detailTask.data.text || "";

  const importantBtn = document.getElementById("detail-important");

  if(type === "komIhag"){
    importantBtn.classList.remove("hidden");
    importantBtn.textContent = detailTask.data.important ? "Viktig markerad" : "Gör viktig";
    importantBtn.classList.toggle("active", !!detailTask.data.important);
  } else {
    importantBtn.classList.add("hidden");
  }

  renderDetailSubtasks();

  document.getElementById("taskDetail").classList.remove("hidden");

  setTimeout(() => {
    document.getElementById("detail-title-input").focus();
  }, 80);
}

function closeTaskDetail(){
  document.getElementById("taskDetail").classList.add("hidden");
  detailTask = null;
}

window.toggleDetailImportant = () => {
  if(!detailTask) return;

  detailTask.data.important = !detailTask.data.important;

  const btn = document.getElementById("detail-important");
  btn.textContent = detailTask.data.important ? "Viktig markerad" : "Gör viktig";
  btn.classList.toggle("active", !!detailTask.data.important);
};

function renderDetailSubtasks(){
  const list = document.getElementById("detail-subtasks");
  list.innerHTML = "";

  if(!detailTask) return;

  detailTask.data.subtasks.forEach((sub, index) => {
    const li = document.createElement("li");
    li.className = sub.done ? "subtask detail-subtask done-subtask" : "subtask detail-subtask";

    const check = document.createElement("button");
    check.className = sub.done ? "sub-check checked" : "sub-check";
    check.textContent = sub.done ? "✓" : "";

    check.onclick = () => {
      detailTask.data.subtasks[index].done = !detailTask.data.subtasks[index].done;
      renderDetailSubtasks();
    };

    const text = document.createElement("span");
    text.textContent = sub.text;

    const del = document.createElement("button");
    del.className = "sub-delete";
    del.textContent = "×";

    del.onclick = () => {
      detailTask.data.subtasks = detailTask.data.subtasks.filter((_, i) => i !== index);
      renderDetailSubtasks();
    };

    li.appendChild(check);
    li.appendChild(text);
    li.appendChild(del);

    list.appendChild(li);
  });
}

window.addDetailSubtask = () => {
  if(!detailTask) return;

  const input = document.getElementById("detail-subtask-input");
  const value = input.value.trim();

  if(!value) return;

  detailTask.data.subtasks.push({
    text: value,
    done: false
  });

  input.value = "";
  renderDetailSubtasks();
  input.focus();
};

window.saveTaskDetail = async () => {
  if(!detailTask) return;

  const title = document.getElementById("detail-title-input").value.trim();

  if(!title) return;

  await updateDoc(doc(db, detailTask.type, detailTask.id), {
    text: title,
    important: !!detailTask.data.important,
    subtasks: detailTask.data.subtasks
  });

  closeTaskDetail();
};

/* TIMER */

const timerRef = doc(db, "dashboardTimer", "main");
let activeTimer = null;

async function loadTimer(){
  const snap = await getDoc(timerRef);

  if(snap.exists()){
    activeTimer = snap.data();
  }

  updateTimerBar();
}

function getTodayTargetTime(timeString){
  if(!timeString) return null;

  const [hours, minutes] = timeString.split(":").map(Number);
  const target = new Date();

  target.setHours(hours, minutes, 0, 0);

  return target;
}

function updateTimerBar(){
  const timeEl = document.getElementById("timer-time");
  const labelEl = document.getElementById("timer-label");
  const progressEl = document.getElementById("timer-progress");

  if(!timeEl || !labelEl || !progressEl) return;

  if(!activeTimer || !activeTimer.time){
    timeEl.textContent = "--:--";
    labelEl.textContent = "Sätt timer";
    progressEl.style.width = "0%";
    progressEl.className = "timer-progress";
    return;
  }

  const now = new Date();
  const target = getTodayTargetTime(activeTimer.time);

  const createdAt = activeTimer.createdAt
    ? new Date(activeTimer.createdAt)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const total = target - createdAt;
  const left = target - now;

  const percent = total > 0
    ? Math.max(0, Math.min(100, (left / total) * 100))
    : 0;

  timeEl.textContent = activeTimer.time;
  labelEl.textContent = activeTimer.label || "Timer";
  progressEl.style.width = percent + "%";

  progressEl.className = "timer-progress";

  if(left <= 0){
    labelEl.textContent = (activeTimer.label || "Timer") + " · NU";
    progressEl.classList.add("danger");
  }
}

async function openTimerView(){
  const snap = await getDoc(timerRef);
  const data = snap.exists() ? snap.data() : {};

  document.getElementById("timer-label-input").value = data.label || "";
  document.getElementById("timer-time-input").value = data.time || "";
}

window.saveTimer = async () => {
  const label = document.getElementById("timer-label-input").value.trim();
  const time = document.getElementById("timer-time-input").value;

  if(!time) return;

  activeTimer = {
    label,
    time,
    createdAt: new Date().toISOString(),
    updatedAt: Date.now()
  };

  await setDoc(timerRef, activeTimer);
  updateTimerBar();
};

window.clearTimer = async () => {
  activeTimer = null;

  await setDoc(timerRef, {
    label: "",
    time: "",
    updatedAt: Date.now()
  });

  updateTimerBar();
};

loadTimer();
setInterval(updateTimerBar, 1000);

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

      const left = document.createElement("div");

      const a = document.createElement("a");
      a.href = normalizeUrl(data.url);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = data.title || data.url;

      const urlText = document.createElement("div");
      urlText.className = "link-url";
      urlText.textContent = data.url;

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

/* SWIPE DOWN */

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

  if(isTypingTarget(e.target)){
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

  const detailOpen =
    !document.getElementById("taskDetail").classList.contains("hidden");

  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  if(detailOpen){
    closeTaskDetail();
    return;
  }

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

/* TRACKPAD / MOUSE WHEEL DOWN */

let lastWheelTrigger = 0;

document.addEventListener("wheel", e => {
  const now = Date.now();

  if(now - lastWheelTrigger < 700) return;
  if(e.deltaY < 35) return;

  const isAtTop = window.scrollY <= 5;

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const detailOpen =
    !document.getElementById("taskDetail").classList.contains("hidden");

  if(detailOpen){
    closeTaskDetail();
    lastWheelTrigger = now;
    return;
  }

  if(viewOpen){
    closeMenuView(true);
    lastWheelTrigger = now;
    return;
  }

  if(menuOpen){
    closeMenu();
    lastWheelTrigger = now;
    return;
  }

  if(isAtTop){
    openMenu();
    lastWheelTrigger = now;
  }
}, { passive: true });

/* KEYBOARD */

document.addEventListener("keydown", e => {
  const viewOpen =
    !document.getElementById("viewLayer").classList.contains("hidden");

  const menuOpen =
    !document.getElementById("menuLayer").classList.contains("hidden");

  const detailOpen =
    !document.getElementById("taskDetail").classList.contains("hidden");

  if(e.key === "Escape"){
    if(detailOpen || viewOpen || menuOpen){
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

    if(document.activeElement.id === "detail-subtask-input"){
      e.preventDefault();
      addDetailSubtask();
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
/* LINKS */

function normalizeUrl(url){

  if(!url) return "";

  const trimmed =
    url.trim();

  if(
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ){
    return trimmed;
  }

  return "https://" + trimmed;
}

function bindLinksView(){

  const list =
    document.getElementById("links-list");

  if(unsubscribeLinks){
    unsubscribeLinks();
  }

  const q = query(
    collection(db,"lankar"),
    orderBy("createdAt","asc")
  );

  unsubscribeLinks = onSnapshot(q, snap => {

    list.innerHTML = "";

    snap.forEach(d => {

      const data = d.data();

      const li = document.createElement("li");
      li.className = "link-item";

      const left = document.createElement("div");

      const a = document.createElement("a");
      a.href = normalizeUrl(data.url);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = data.title || data.url;

      const urlText = document.createElement("div");
      urlText.className = "link-url";
      urlText.textContent = data.url;

      left.appendChild(a);
      left.appendChild(urlText);

      const controls = document.createElement("div");
      controls.className = "task-controls";

      const edit = document.createElement("button");
      edit.className = "delete-btn";
      edit.textContent = "Ändra";

      edit.onclick = async () => {

        const newTitle =
          prompt("Namn", data.title || "");

        if(newTitle === null) return;

        const newUrl =
          prompt("URL", data.url || "");

        if(newUrl === null) return;

        await updateDoc(
          doc(db,"lankar",d.id),
          {
            title:newTitle.trim(),
            url:newUrl.trim()
          }
        );
      };

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "Ta bort";

      del.onclick = () =>
        deleteDoc(doc(db,"lankar",d.id));

      controls.appendChild(edit);
      controls.appendChild(del);

      li.appendChild(left);
      li.appendChild(controls);

      list.appendChild(li);
    });
  });
}

window.addLink = async () => {

  const titleInput =
    document.getElementById("link-title-input");

  const urlInput =
    document.getElementById("link-url-input");

  const title =
    titleInput.value.trim();

  const url =
    urlInput.value.trim();

  if(!title || !url) return;

  await addDoc(
    collection(db,"lankar"),
    {
      title,
      url,
      createdAt:Date.now()
    }
  );

  titleInput.value = "";
  urlInput.value = "";
  titleInput.focus();
};

/* JOBS */

function clearJobForm(){

  editingJobId = null;

  document
    .getElementById("job-company-input")
    .value = "";

  document
    .getElementById("job-status-input")
    .value = "";

  document
    .getElementById("job-notes-input")
    .value = "";
}

function bindJobsView(){

  const list =
    document.getElementById("jobs-list");

  if(unsubscribeJobs){
    unsubscribeJobs();
  }

  const q = query(
    collection(db,"jobbsokaren"),
    orderBy("createdAt","desc")
  );

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
      company.textContent =
        data.company || "Utan företag";

      const status = document.createElement("div");
      status.className = "job-status";
      status.textContent =
        data.status || "Ingen status";

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

        document
          .getElementById("job-company-input")
          .value = data.company || "";

        document
          .getElementById("job-status-input")
          .value = data.status || "";

        document
          .getElementById("job-notes-input")
          .value = data.notes || "";

        document
          .getElementById("job-company-input")
          .focus();
      };

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "Ta bort";

      del.onclick = () =>
        deleteDoc(doc(db,"jobbsokaren",d.id));

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

  const company =
    document
      .getElementById("job-company-input")
      .value
      .trim();

  const status =
    document
      .getElementById("job-status-input")
      .value
      .trim();

  const notes =
    document
      .getElementById("job-notes-input")
      .value
      .trim();

  if(!company && !status && !notes) return;

  if(editingJobId){

    await updateDoc(
      doc(db,"jobbsokaren",editingJobId),
      {
        company,
        status,
        notes,
        updatedAt:Date.now()
      }
    );

  } else {

    await addDoc(
      collection(db,"jobbsokaren"),
      {
        company,
        status,
        notes,
        createdAt:Date.now(),
        updatedAt:Date.now()
      }
    );
  }

  clearJobForm();
};
