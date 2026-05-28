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
getDoc,
serverTimestamp
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
let viewReturnTarget = "home";

let unsubscribeRemember = null;
let unsubscribeActions = null;
let unsubscribeLinks = null;
let unsubscribeJobs = null;
let unsubscribeTodayRemember = null;
let unsubscribeTodayActions = null;
let unsubscribeTodayViewRemember = null;
let unsubscribeTodayViewActions = null;

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

/* STATIC HERO IMAGE */

const bg = document.getElementById("image-bg");
if(bg){
  bg.style.backgroundImage = `url(assets/foton/Back360.jpeg)`;
}

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

/* HELPERS */

function getSubtaskMeta(data){
  const subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];
  const doneCount = subtasks.filter(s => s.done).length;

  if(subtasks.length === 0) return "";

  return `${doneCount} av ${subtasks.length} slutförda`;
}

function createTodayBadge(type){
  return type === "komIhag" ? "Kom-ihåg" : "Action";
}

function itemOrder(data){
  return typeof data.order === "number" ? data.order : data.createdAt || 0;
}

/* HOME PREVIEWS */

function bindRememberPreview(){
  const q = query(collection(db, "komIhag"), orderBy("createdAt", "asc"));

  onSnapshot(q, snap => {
    const el = document.getElementById("komihag-list");
    if(!el) return;

    el.innerHTML = "";

    const docs = [];
    snap.forEach(d => docs.push(d));

    docs
      .sort((a, b) => itemOrder(a.data()) - itemOrder(b.data()))
      .forEach(d => {
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
    if(!el) return;

    el.innerHTML = "";

    const docs = [];
    snap.forEach(d => docs.push(d));

    docs
      .sort((a, b) => itemOrder(a.data()) - itemOrder(b.data()))
      .forEach(d => {
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

function bindTodayPreview(){
  const el = document.getElementById("today-list");
  if(!el) return;

  const state = {
    komIhag: [],
    attGora: []
  };

  function render(){
    el.innerHTML = "";

    const combined = [
      ...state.komIhag.map(item => ({ ...item, type: "komIhag" })),
      ...state.attGora.map(item => ({ ...item, type: "attGora" }))
    ];

    combined
      .sort((a, b) => itemOrder(a) - itemOrder(b))
      .forEach(item => {
        const li = document.createElement("li");

        if(item.done){
          li.classList.add("today-done");
        }

        const title = document.createElement("span");
        title.textContent = item.text;

        const source = document.createElement("div");
        source.className = "today-source";
        source.textContent = createTodayBadge(item.type);

        li.appendChild(title);
        li.appendChild(source);

        el.appendChild(li);
      });
  }

  if(unsubscribeTodayRemember) unsubscribeTodayRemember();
  if(unsubscribeTodayActions) unsubscribeTodayActions();

  unsubscribeTodayRemember = onSnapshot(
    query(collection(db, "komIhag"), orderBy("createdAt", "asc")),
    snap => {
      state.komIhag = [];
      snap.forEach(d => {
        const data = d.data();
        if(data.today){
          state.komIhag.push({
            id: d.id,
            ...data
          });
        }
      });
      render();
    }
  );

  unsubscribeTodayActions = onSnapshot(
    query(collection(db, "attGora"), orderBy("createdAt", "asc")),
    snap => {
      state.attGora = [];
      snap.forEach(d => {
        const data = d.data();
        if(data.today){
          state.attGora.push({
            id: d.id,
            ...data
          });
        }
      });
      render();
    }
  );
}

bindRememberPreview();
bindActionsPreview();
bindTodayPreview();

/* TASK ITEMS */

function renderTaskItem(type, d){
  const data = d.data();
  const metaText = getSubtaskMeta(data);

  const li = document.createElement("li");
  li.className = "task-item";

  if(data.done){
    li.classList.add("done-item");
  }

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

  textWrap.appendChild(title);

  if(metaText){
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = metaText;
    textWrap.appendChild(meta);
  }

  left.appendChild(check);
  left.appendChild(textWrap);

  const controls = document.createElement("div");
  controls.className = "task-controls";

  const todayBtn = document.createElement("button");
  todayBtn.className = data.today ? "today-btn active" : "today-btn";
  todayBtn.textContent = "!";

  todayBtn.onclick = async (e) => {
    e.stopPropagation();

    await updateDoc(doc(db, type, d.id), {
      today: !data.today
    });
  };

  controls.appendChild(todayBtn);

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

  if(view === "today"){
    document.getElementById("todayView").classList.remove("hidden");
    bindTodayView();
  }

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
};

/* TODAY VIEW */

function createTodayViewItem(type, d){
  const data = d.data();

  const li = document.createElement("li");
  if(data.done){
    li.classList.add("done-item");
  }

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

  const source = document.createElement("div");
  source.className = "task-meta";
  source.textContent = createTodayBadge(type);

  textWrap.appendChild(title);
  textWrap.appendChild(source);

  left.appendChild(check);
  left.appendChild(textWrap);

  const controls = document.createElement("div");
  controls.className = "task-controls";

  const rocket = document.createElement("button");
  rocket.className = "rocket-btn";
  rocket.textContent = "🚀";

  rocket.onclick = async (e) => {
    e.stopPropagation();

    await updateDoc(doc(db, type, d.id), {
      today: false
    });
  };

  controls.appendChild(rocket);

  row.appendChild(left);
  row.appendChild(controls);
  li.appendChild(row);

  li.onclick = () => openTaskDetail(type, d.id, data);

  return li;
}

function bindTodayView(){
  const active = document.getElementById("today-active");
  const done = document.getElementById("today-done");

  if(!active || !done) return;

  const state = {
    komIhag: [],
    attGora: []
  };

  function render(){
    active.innerHTML = "";
    done.innerHTML = "";

    const combined = [
      ...state.komIhag.map(item => ({ ...item, type: "komIhag" })),
      ...state.attGora.map(item => ({ ...item, type: "attGora" }))
    ];

    combined
      .sort((a, b) => itemOrder(a) - itemOrder(b))
      .forEach(item => {
        const fakeDoc = {
          id: item.id,
          data: () => item
        };

        const el = createTodayViewItem(item.type, fakeDoc);

        if(item.done){
          done.appendChild(el);
        } else {
          active.appendChild(el);
        }
      });
  }

  if(unsubscribeTodayViewRemember) unsubscribeTodayViewRemember();
  if(unsubscribeTodayViewActions) unsubscribeTodayViewActions();

  unsubscribeTodayViewRemember = onSnapshot(
    query(collection(db, "komIhag"), orderBy("createdAt", "asc")),
    snap => {
      state.komIhag = [];

      snap.forEach(d => {
        const data = d.data();
        if(data.today){
          state.komIhag.push({
            id: d.id,
            ...data
          });
        }
      });

      render();
    }
  );

  unsubscribeTodayViewActions = onSnapshot(
    query(collection(db, "attGora"), orderBy("createdAt", "asc")),
    snap => {
      state.attGora = [];

      snap.forEach(d => {
        const data = d.data();
        if(data.today){
          state.attGora.push({
            id: d.id,
            ...data
          });
        }
      });

      render();
    }
  );
}

/* REMEMBER / ACTIONS */

function bindRememberView(){
  const activeList = document.getElementById("remember-active");
  const doneList = document.getElementById("remember-done");

  if(!activeList || !doneList) return;

  if(unsubscribeRemember) unsubscribeRemember();

  const q = query(collection(db, "komIhag"), orderBy("createdAt", "asc"));

  unsubscribeRemember = onSnapshot(q, snap => {
    activeList.innerHTML = "";
    doneList.innerHTML = "";

    const docs = [];
    snap.forEach(d => docs.push(d));

    docs
      .sort((a, b) => itemOrder(a.data()) - itemOrder(b.data()))
      .forEach(d => {
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

  if(!activeList || !doneList) return;

  if(unsubscribeActions) unsubscribeActions();

  const q = query(collection(db, "attGora"), orderBy("createdAt", "asc"));

  unsubscribeActions = onSnapshot(q, snap => {
    activeList.innerHTML = "";
    doneList.innerHTML = "";

    const docs = [];
    snap.forEach(d => docs.push(d));

    docs
      .sort((a, b) => itemOrder(a.data()) - itemOrder(b.data()))
      .forEach(d => {
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

  if(!input || !input.value.trim()) return;

  await addDoc(collection(db, collectionName), {
    text: input.value.trim(),
    createdAt: Date.now(),
    order: Date.now(),
    done: false,
    important: false,
    today: false,
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

  document.getElementById("detail-title-input").value =
    detailTask.data.text || "";

  const importantBtn = document.getElementById("detail-important");

  if(type === "komIhag"){
    importantBtn.classList.remove("hidden");
    importantBtn.textContent =
      detailTask.data.important ? "Viktig markerad" : "Gör viktig";

    importantBtn.classList.toggle("active", !!detailTask.data.important);
  } else {
    importantBtn.classList.add("hidden");
  }

  const todayBtn = document.getElementById("detail-today");

  if(todayBtn){
    todayBtn.classList.toggle("active", !!detailTask.data.today);

    todayBtn.textContent =
      detailTask.data.today ? "I IDAG" : "Lägg till IDAG";
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

  btn.textContent =
    detailTask.data.important ? "Viktig markerad" : "Gör viktig";

  btn.classList.toggle("active", !!detailTask.data.important);
};

window.toggleDetailToday = () => {
  if(!detailTask) return;

  detailTask.data.today = !detailTask.data.today;

  const btn = document.getElementById("detail-today");

  if(btn){
    btn.classList.toggle("active", !!detailTask.data.today);

    btn.textContent =
      detailTask.data.today ? "I IDAG" : "Lägg till IDAG";
  }
};

function renderDetailSubtasks(){
  const list = document.getElementById("detail-subtasks");
  list.innerHTML = "";

  if(!detailTask) return;

  detailTask.data.subtasks.forEach((sub, index) => {
    const li = document.createElement("li");
    li.className =
      sub.done ? "subtask detail-subtask done-subtask" : "subtask detail-subtask";

    const check = document.createElement("button");
    check.className = sub.done ? "sub-check checked" : "sub-check";
    check.textContent = sub.done ? "✓" : "";

    check.onclick = () => {
      detailTask.data.subtasks[index].done =
        !detailTask.data.subtasks[index].done;

      renderDetailSubtasks();
    };

    const text = document.createElement("span");
    text.textContent = sub.text;

    const del = document.createElement("button");
    del.className = "sub-delete";
    del.textContent = "×";

    del.onclick = () => {
      detailTask.data.subtasks =
        detailTask.data.subtasks.filter((_, i) => i !== index);

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

  const payload = {
    text: title,
    today: !!detailTask.data.today,
    subtasks: detailTask.data.subtasks
  };

  if(detailTask.type === "komIhag"){
    payload.important = !!detailTask.data.important;
  }

  await updateDoc(doc(db, detailTask.type, detailTask.id), payload);

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

  const percent =
    total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0;

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

    const preview = document.getElementById("notes-preview");

    if(preview){
      preview.textContent = text.trim() ? text : "Tryck för att skriva.";
    }
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

  const preview = document.getElementById("notes-preview");

  if(preview){
    preview.textContent = text.trim() ? text : "Tryck för att skriva.";
  }
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

  if(!list) return;

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

  if(!list) return;

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

  validSwipeStart = menuOpen || viewOpen || pageIsAtTop;

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
  document.getElementById("forecast").textContent =
    "Max " + max + "° / Min " + min + "°";
}

loadWeather();


/* 360 LOOP FIREBASE V1 */

const loopSheetsRef = collection(db, "loopSheets");

let loopSheets = [];
let loopActiveSheetId = null;
let loopActiveTag = "all";
let loopSaveTimer = null;
let loopUnsubscribe = null;

function normalizeLoopTag(tag){
  return tag.replace("#","").trim().toLowerCase();
}

function formatLoopTag(tag){
  if(tag === "all") return "Allt";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

function extractLoopTags(title,text){
  const source = `${title || ""} ${text || ""}`;
  const matches = source.match(/#[a-zA-ZåäöÅÄÖ0-9_-]+/g) || [];

  return [...new Set(
    matches
      .map(t => normalizeLoopTag(t))
      .filter(Boolean)
      .filter(t => t !== "action")
  )].sort((a,b) => a.localeCompare(b,"sv"));
}

function getLoopPreview(text){
  const clean = (text || "")
    .replace(/#[a-zA-ZåäöÅÄÖ0-9_-]+/g,"")
    .trim();

  return clean ? clean.slice(0,90) : "Tomt blad";
}

function getAllLoopTags(){
  const tags = [];

  loopSheets.forEach(sheet => {
    (sheet.tags || []).forEach(tag => {
      if(!tags.includes(tag)){
        tags.push(tag);
      }
    });
  });

  return tags.sort((a,b) => a.localeCompare(b,"sv"));
}

function getActiveLoopSheet(){
  return loopSheets.find(s => s.id === loopActiveSheetId);
}

function renderLoopTags(){

  const wrap =
    document.getElementById("loopTags");

  if(!wrap) return;

  wrap.innerHTML = "";

  const allBtn = document.createElement("button");

  allBtn.className =
    loopActiveTag === "all"
      ? "loop-tag active"
      : "loop-tag";

  allBtn.textContent = "Allt";

  allBtn.onclick = () => {
    selectLoopTag("all");
  };

  wrap.appendChild(allBtn);

  getAllLoopTags().forEach(tag => {

    const btn = document.createElement("button");

    btn.className =
      loopActiveTag === tag
        ? "loop-tag active"
        : "loop-tag";

    btn.textContent =
      formatLoopTag(tag);

    btn.onclick = () => {
      selectLoopTag(tag);
    };

    wrap.appendChild(btn);
  });
}

function renderLoopActiveTags(){

  const wrap =
    document.getElementById("loopActiveTags");

  if(!wrap) return;

  const sheet =
    getActiveLoopSheet();

  wrap.innerHTML = "";

  if(!sheet) return;

  (sheet.tags || []).forEach(tag => {

    const pill =
      document.createElement("button");

    pill.className = "loop-pill";
    pill.textContent = "#" + formatLoopTag(tag);

    pill.onclick = () => {
      selectLoopTag(tag);
    };

    wrap.appendChild(pill);
  });
}

function renderLoopSheetList(){

  const list =
    document.getElementById("loopSheetList");

  if(!list) return;

  list.innerHTML = "";

  let filtered = loopSheets;

  if(loopActiveTag !== "all"){

    filtered = loopSheets.filter(sheet =>
      (sheet.tags || []).includes(loopActiveTag)
    );
  }

  filtered
    .sort((a,b) =>
      (b.updatedAt || 0) - (a.updatedAt || 0)
    )
    .forEach(sheet => {

      const row =
        document.createElement("div");

      row.className =
        sheet.id === loopActiveSheetId
          ? "loop-sheet-row active"
          : "loop-sheet-row";

      const title =
        document.createElement("div");

      title.className =
        "loop-sheet-row-title";

      title.textContent =
        sheet.title?.trim() || "Namnlöst blad";

      const preview =
        document.createElement("div");

      preview.className =
        "loop-sheet-row-preview";

      preview.textContent =
        getLoopPreview(sheet.text);

      row.appendChild(title);
      row.appendChild(preview);

      row.onclick = () => {

        loopActiveSheetId = sheet.id;

        renderLoopEditor();
        renderLoopSheetList();
      };

      list.appendChild(row);
    });
}

function renderLoopEditor(){

  const sheet =
    getActiveLoopSheet();

  if(!sheet) return;

  const title =
    document.getElementById("loopTitle");

  const text =
    document.getElementById("loopText");

  if(title){
    title.value = sheet.title || "";
  }

  if(text){
    text.value = sheet.text || "";
  }

  renderLoopActiveTags();
}

function renderLoop(){

  renderLoopTags();
  renderLoopSheetList();
  renderLoopEditor();
}

async function saveLoopSheetRealtime(){

  const sheet =
    getActiveLoopSheet();

  if(!sheet) return;

  const title =
    document.getElementById("loopTitle")?.value || "";

  const text =
    document.getElementById("loopText")?.value || "";

  const tags =
    extractLoopTags(title,text);

  const status =
    document.getElementById("loopSaveStatus");

  if(status){
    status.textContent = "Sparar...";
  }

  clearTimeout(loopSaveTimer);

  loopSaveTimer = setTimeout(async () => {

    await updateDoc(
      doc(db, "loopSheets", sheet.id),
      {
        title,
        text,
        tags,
        updatedAt: Date.now()
      }
    );

    if(status){
      status.textContent = "Sparat";
    }

  }, 250);
}

window.newLoopSheet = async () => {

  const newDoc = await addDoc(
    loopSheetsRef,
    {
      title:"",
      text:"",
      tags:[],
      createdAt:Date.now(),
      updatedAt:Date.now()
    }
  );

  loopActiveSheetId = newDoc.id;
};

window.selectLoopTag = (tag) => {

  loopActiveTag = tag;

  if(window.innerWidth <= 900){

    document
      .getElementById("loop360")
      ?.classList
      .remove("tags-open");
  }

  const filtered =
    tag === "all"
      ? loopSheets
      : loopSheets.filter(sheet =>
          (sheet.tags || []).includes(tag)
        );

  if(filtered.length){

    filtered.sort((a,b) =>
      (b.updatedAt || 0) - (a.updatedAt || 0)
    );

    loopActiveSheetId = filtered[0].id;
  }

  renderLoop();
};

window.toggleLoopTags = () => {

  document
    .getElementById("loop360")
    ?.classList
    .toggle("tags-open");
};

window.open360Loop = () => {

  document
    .getElementById("loop360")
    ?.classList
    .remove("hidden");

  lockPage();

  if(!loopUnsubscribe){

    const q = query(
      loopSheetsRef,
      orderBy("updatedAt","desc")
    );

    loopUnsubscribe =
      onSnapshot(q, snap => {

        loopSheets = [];

        snap.forEach(d => {

          loopSheets.push({
            id:d.id,
            ...d.data()
          });
        });

        if(!loopActiveSheetId && loopSheets.length){
          loopActiveSheetId = loopSheets[0].id;
        }

        renderLoop();
      });
  }

  setTimeout(() => {
    document
      .getElementById("loopTitle")
      ?.focus();
  },120);
};

window.close360Loop = () => {

  document
    .getElementById("loop360")
    ?.classList
    .add("hidden");

  document
    .getElementById("loop360")
    ?.classList
    .remove("tags-open");

  unlockPage();
};

document.addEventListener("input", e => {

  if(
    e.target?.id === "loopTitle" ||
    e.target?.id === "loopText"
  ){

    saveLoopSheetRealtime();

    const sheet =
      getActiveLoopSheet();

    if(sheet){

      sheet.title =
        document.getElementById("loopTitle").value;

      sheet.text =
        document.getElementById("loopText").value;

      sheet.tags =
        extractLoopTags(
          sheet.title,
          sheet.text
        );

      renderLoopActiveTags();
      renderLoopSheetList();
      renderLoopTags();
    }
  }
});

document.addEventListener("keydown", e => {

  const loop =
    document.getElementById("loop360");

  if(
    e.key === "Escape" &&
    loop &&
    !loop.classList.contains("hidden")
  ){

    if(loop.classList.contains("tags-open")){

      loop.classList.remove("tags-open");

    } else {

      close360Loop();
    }
  }
});
