const $ = (s) => document.querySelector(s);

const seedTasks = [
  {id:1,title:"Finalize homepage hero section",category:"Design",priority:"high",done:false},
  {id:2,title:"Review analytics dashboard",category:"Development",priority:"medium",done:false},
  {id:3,title:"Plan next week's sprint",category:"Planning",priority:"medium",done:true},
  {id:4,title:"Read 20 pages",category:"Personal",priority:"low",done:false}
];

let tasks = JSON.parse(localStorage.getItem("nexus_tasks") || "null") || seedTasks;
let focusMinutes = Number(localStorage.getItem("nexus_focus") || 0);
let session = Number(localStorage.getItem("nexus_session") || 1);
let notes = localStorage.getItem("nexus_notes") || "";
let seconds = 25 * 60;
let timer = null;
let isRunning = false;

function save(){
  localStorage.setItem("nexus_tasks", JSON.stringify(tasks));
  localStorage.setItem("nexus_focus", focusMinutes);
  localStorage.setItem("nexus_session", session);
  localStorage.setItem("nexus_notes", notes);
}

function renderTasks(){
  const list = $("#taskList");
  list.innerHTML = tasks.slice(0,5).map(t => `
    <div class="task ${t.done ? "done":""}" data-id="${t.id}">
      <button class="check" aria-label="Complete task">${t.done ? "✓":""}</button>
      <div class="task-body">
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-meta"><span class="tag">${escapeHtml(t.category)}</span><span class="priority ${t.priority}">${t.priority}</span></div>
      </div>
      <button class="delete-task" aria-label="Delete task">×</button>
    </div>`).join("") || `<div class="empty">No tasks yet. Add one to get started.</div>`;

  const open = tasks.filter(t=>!t.done).length;
  const done = tasks.filter(t=>t.done).length;
  $("#navTaskCount").textContent = open;
  $("#heroTaskCount").textContent = `${open} ${open===1?"task":"tasks"}`;
  $("#completedStat").textContent = done;
  $("#scoreStat").textContent = `${Math.min(99,72 + done*3)}%`;
  $("#scoreRing").textContent = Math.min(99,72 + done*3);
  save();
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function renderChart(){
  const values = [42,58,48,72,63,82,92];
  const previous = [34,46,39,54,50,62,70];
  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  $("#chartBars").innerHTML = values.map((v,i)=>`
    <div class="bar-group">
      <span class="bar alt" style="height:${previous[i]}%"></span>
      <span class="bar" style="height:${v}%"></span>
      <span class="bar-label">${labels[i]}</span>
    </div>`).join("");
}

function updateTimer(){
  const m = Math.floor(seconds/60).toString().padStart(2,"0");
  const s = (seconds%60).toString().padStart(2,"0");
  $("#timerDisplay").textContent = `${m}:${s}`;
  $("#miniRingValue").textContent = m;
  $("#miniTimerLabel").textContent = isRunning ? "Deep work in progress" : "Ready when you are";
  const progress = 1 - seconds/(25*60);
  document.querySelector(".timer-ring").style.background =
    `conic-gradient(var(--accent) ${progress*360}deg, var(--border) 0)`;
  $("#focusStat").textContent = `${focusMinutes}m`;
}

function toggleTimer(){
  if(isRunning){
    clearInterval(timer);
    timer = null;
    isRunning = false;
    $("#timerBtn").textContent = "Resume focus";
  }else{
    isRunning = true;
    $("#timerBtn").textContent = "Pause";
    timer = setInterval(()=>{
      seconds--;
      if(seconds <= 0){
        clearInterval(timer);
        timer = null;
        isRunning = false;
        focusMinutes += 25;
        session = session >= 4 ? 1 : session + 1;
        seconds = 25*60;
        $("#timerBtn").textContent = "Start focus";
        $("#sessionCount").textContent = session;
        save();
        alert("Focus session complete. Nice work.");
      }
      updateTimer();
    },1000);
  }
  updateTimer();
}

function openModal(){ $("#taskModal").classList.add("open"); $("#taskTitle").focus(); }
function closeModal(){ $("#taskModal").classList.remove("open"); $("#taskForm").reset(); }

function aiReply(text){
  const t = text.toLowerCase();
  let reply;
  if(t.includes("first") || t.includes("priorit")){
    const next = tasks.find(x=>!x.done);
    reply = next ? `Start with “${next.title}”. It’s your ${next.priority}-priority open task — give it one focused 25-minute block.` : "You’re clear. Use the time to plan tomorrow or take a real break.";
  }else if(t.includes("focus")){
    reply = "Put your phone away, pick one outcome, and start a 25-minute block. Momentum beats perfect preparation.";
  }else if(t.includes("motivat")){
    reply = "You don’t need a perfect day. You only need the next useful action. Let’s make it happen.";
  }else{
    reply = "I’m your lightweight local copilot. Try asking me to prioritize your day, give you a focus tip, or motivate you.";
  }
  $("#aiMessage").textContent = reply;
}

$("#newTaskBtn").onclick = openModal;
$("#quickAdd").onclick = openModal;
$("#closeModal").onclick = closeModal;
$("#taskModal").onclick = e => { if(e.target.id==="taskModal") closeModal(); };

$("#taskForm").onsubmit = e => {
  e.preventDefault();
  tasks.unshift({
    id: Date.now(),
    title: $("#taskTitle").value.trim(),
    category: $("#taskCategory").value,
    priority: $("#taskPriority").value,
    done:false
  });
  renderTasks();
  closeModal();
};

$("#taskList").onclick = e => {
  const row = e.target.closest(".task");
  if(!row) return;
  const id = Number(row.dataset.id);
  if(e.target.closest(".delete-task")){
    tasks = tasks.filter(t=>t.id!==id);
  }else if(e.target.closest(".check")){
    const task = tasks.find(t=>t.id===id);
    task.done = !task.done;
  }
  renderTasks();
};

$("#timerBtn").onclick = toggleTimer;
$("#resetTimer").onclick = ()=>{
  clearInterval(timer); timer=null; isRunning=false; seconds=25*60;
  $("#timerBtn").textContent="Start focus"; updateTimer();
};

$("#themeBtn").onclick = ()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("nexus_theme", document.body.classList.contains("dark") ? "dark":"light");
  $("#themeBtn").textContent = document.body.classList.contains("dark") ? "☀":"☾";
};

document.querySelectorAll(".suggestions button").forEach(btn => btn.onclick=()=>aiReply(btn.dataset.prompt));
$("#aiSend").onclick = ()=>{ const v=$("#aiInput").value.trim(); if(v){aiReply(v);$("#aiInput").value="";}};
$("#aiInput").addEventListener("keydown", e=>{if(e.key==="Enter") $("#aiSend").click();});

$("#notesInput").value = notes;
$("#notesInput").oninput = e=>{
  notes=e.target.value.slice(0,500);
  $("#noteCount").textContent=`${notes.length} / 500`;
  save();
};
$("#noteCount").textContent=`${notes.length} / 500`;

$("#clearData").onclick = ()=>{
  if(confirm("Reset NEXUS to its demo state?")){
    localStorage.clear(); location.reload();
  }
};

$("#searchBtn").onclick = ()=>{
  const q = prompt("Search NEXUS");
  if(!q) return;
  const found = tasks.find(t=>t.title.toLowerCase().includes(q.toLowerCase()));
  alert(found ? `Found task: ${found.title}` : "No matching task found.");
};

document.addEventListener("keydown", e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){e.preventDefault();$("#searchBtn").click();}
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="n"){e.preventDefault();openModal();}
  if(e.code==="Space" && document.activeElement.tagName!=="INPUT" && document.activeElement.tagName!=="TEXTAREA"){e.preventDefault();toggleTimer();}
});

if(localStorage.getItem("nexus_theme")==="dark"){
  document.body.classList.add("dark");
  $("#themeBtn").textContent="☀";
}

renderTasks();
renderChart();
updateTimer();
