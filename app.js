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

const firebaseConfig = {
  apiKey: "AIzaSyBDf7wFAybRoUoofVXr-4vJMFXwfmATn8k",
  authDomain: "familydash-9d0dd.firebaseapp.com",
  projectId: "familydash-9d0dd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* CLOCK */
setInterval(()=>{
  const n=new Date();
  time.textContent=n.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"});
  date.textContent=n.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});
},1000);

/* IMAGE */
const imgs=[
"assets/foton/1.jpg",
"assets/foton/2.jpg",
"assets/foton/3.jpg"
];

let i=0;
const bg=document.getElementById("image-bg");

function rotate(){
  bg.style.backgroundImage=`url(${imgs[i]})`;
  i=(i+1)%imgs.length;
}
rotate();
setInterval(rotate,8000);

/* LISTS */
function bind(col,id){
  const q=query(collection(db,col),orderBy("createdAt","asc"));
  onSnapshot(q,snap=>{
    const el=document.getElementById(id);
    el.innerHTML="";
    snap.forEach(d=>{
      const li=document.createElement("li");
      li.textContent=d.data().text;
      el.appendChild(li);
    });
  });
}

bind("komIhag","komihag-list");
bind("rutiner","rutiner-list");
bind("attGora","attgora-list");

/* POPUP */
let current="";

window.openPopup=(type)=>{
  current=type;
  popup.classList.remove("hidden");
  popup-title.textContent=type;

  const list=popup-list;

  const q=query(collection(db,type),orderBy("createdAt","asc"));

  onSnapshot(q,snap=>{
    list.innerHTML="";
    snap.forEach(d=>{
      const li=document.createElement("li");

      const span=document.createElement("span");
      span.textContent=d.data().text;

      span.onclick=async ()=>{
        const val=prompt("Ändra",d.data().text);
        if(val) updateDoc(doc(db,type,d.id),{text:val});
      };

      const del=document.createElement("button");
      del.textContent="✕";
      del.onclick=()=>deleteDoc(doc(db,type,d.id));

      li.appendChild(span);
      li.appendChild(del);
      list.appendChild(li);
    });
  });
};

window.closePopup=()=>popup.classList.add("hidden");

window.addItem=async ()=>{
  if(!popup-input.value) return;

  await addDoc(collection(db,current),{
    text:popup-input.value,
    createdAt:Date.now()
  });

  popup-input.value="";
};

/* QR */
QRCode.toCanvas(document.getElementById("qr"),location.href);
