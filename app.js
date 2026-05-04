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

// 🔑 KLISTRA IN DIN CONFIG HÄR
const firebaseConfig = {
  apiKey: "DIN_API_KEY",
  authDomain: "DIN_AUTH_DOMAIN",
  projectId: "DIN_PROJECT_ID",
  storageBucket: "DIN_BUCKET",
  messagingSenderId: "DIN_SENDER_ID",
  appId: "DIN_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const colRef = collection(db, "komIhag");

const q = query(colRef, orderBy("createdAt", "desc"), limit(8));

onSnapshot(q, (snapshot) => {
  const list = document.getElementById("komihag-list");
  list.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");
    li.textContent = data.text;

    li.onclick = () => deleteDoc(doc(db, "komIhag", docSnap.id));

    list.appendChild(li);
  });
});

window.addKomIhag = async () => {
  const input = document.getElementById("komihag-input");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(colRef, {
    text,
    createdAt: Date.now()
  });

  input.value = "";
};
