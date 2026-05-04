let currentType = null;

function openPopup(type) {
  currentType = type;

  document.getElementById("popup").classList.remove("hidden");

  document.getElementById("popup-title").textContent =
    type === "komihag" ? "Kom ihåg" : "Att göra";

  loadPopupList();
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

function loadPopupList() {
  const list = document.getElementById("popup-list");
  list.innerHTML = "";

  const ref = currentType === "komihag"
    ? collection(db, "komIhag")
    : collection(db, "attGora");

  onSnapshot(ref, (snap) => {
    list.innerHTML = "";

    snap.forEach((docSnap) => {
      const li = document.createElement("li");
      li.textContent = docSnap.data().text;

      li.onclick = () => deleteDoc(doc(db, currentType === "komihag" ? "komIhag" : "attGora", docSnap.id));

      list.appendChild(li);
    });
  });
}

window.addItem = async () => {
  const input = document.getElementById("popup-input");

  if (!input.value) return;

  const ref = currentType === "komihag"
    ? collection(db, "komIhag")
    : collection(db, "attGora");

  await addDoc(ref, {
    text: input.value,
    createdAt: Date.now()
  });

  input.value = "";
};
