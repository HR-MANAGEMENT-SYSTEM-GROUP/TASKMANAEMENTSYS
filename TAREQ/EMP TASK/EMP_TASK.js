// EMP_TASK.js
// MASAR Employee Task Management

let tasks = [];
let currentUser = null;
let currentEmployeeId = null;
let selectedTaskId = null;
let draggedTaskId = null;
let lastTasksSnapshot = "";

const EMPLOYEE_LOGIN_PAGE = "/GAITH/login.html";


/* 
   INIT
 */

document.addEventListener("DOMContentLoaded", function () {

    currentUser = getCurrentUser();
    if (!validateEmployeeAccess()) { return; }

    currentEmployeeId = Number(currentUser.id);
    setupNavbarAndFooter();
    setupDarkMode();
    setupFilters();
    loadTasks();
    setupStorageSync();

});


/* LOGIN USER*/
function getCurrentUser() {

    try { return JSON.parse(localStorage.getItem("currentUser"));}
     catch (error) {return null; }}


function validateEmployeeAccess() {

    if (!currentUser || !currentUser.id) {   alert("Please login first.");

        window.location.href = EMPLOYEE_LOGIN_PAGE;
        return false; }

    const role = String(currentUser.role || "")
            .trim()
            .toLowerCase();

    if (role && role !== "employee" && role !== "emp") { alert("Access denied. Employee access only.");

     window.location.href = EMPLOYEE_LOGIN_PAGE;
        return false; }

    return true;}


function getUserDisplayName() {

    return ( currentUser.name ||  currentUser.fullName ||  `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
    ||  currentUser.username ||  currentUser.email ||   "User"  );}

/* LOCAL STORAGE*/

function getTasksFromStorage() {

    try { return JSON.parse(localStorage.getItem("tasks")) || [];}

     catch (error) {  return []; }}


function saveTasks() {

localStorage.setItem("tasks", JSON.stringify(tasks));
 lastTasksSnapshot =  localStorage.getItem("tasks") || "[]";
window.dispatchEvent(new Event("tasksUpdated"));}


function loadTasks() {

    tasks = getTasksFromStorage();
    applyTimeoutStatus();
    lastTasksSnapshot =  localStorage.getItem("tasks") || "[]";
    loadEmployeeFilters();
    displayTasks();
    updateEmployeeDashboard();}


/* TASK HELPERS */

function normalizeStatus(status) {

    if (!status) { return "Pending"; } return String(status).trim();

}
function normalizePriority(priority) {

    if (!priority) {   return "Medium"; }

 return String(priority).trim();}

function escapeHTML(value) {

    if (value === null || value === undefined) {    return ""; }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function getStatusClass(status) {

    return "status-" +
        normalizeStatus(status)
            .toLowerCase()
            .replaceAll(" ", "-");

}
function getPriorityClass(priority) {

    return normalizePriority(priority)
        .toLowerCase()
        .replaceAll(" ", "-");
}
function getTaskDeadlineValue(task) {

    if (task.deadline) {   return task.deadline; }

    if (task.deadlineDate && task.deadlineTime) {     return `${task.deadlineDate}T${task.deadlineTime}`; }

    if (task.deadlineDate) {   return task.deadlineDate;  }

    if (task.dueDate) {   return task.dueDate; }

    return "";

}


function formatDeadline(task) {

    const deadlineValue = getTaskDeadlineValue(task);
    if (!deadlineValue) {    return "No deadline"; }

    const date = new Date(deadlineValue);
    if (Number.isNaN(date.getTime())) {   return escapeHTML(deadlineValue); }

    return date.toLocaleString();

}


function isDeadlinePassed(task) {

    const status = normalizeStatus(task.status);
    const ignoredStatuses = [   "Submitted",   "Completed",   "Blocked", "Time Out"];
    if (ignoredStatuses.includes(status)) {    return false; }

    const deadlineValue = getTaskDeadlineValue(task);
    if (!deadlineValue) {  return false; }

    const deadlineDate = new Date(deadlineValue);
    if (Number.isNaN(deadlineDate.getTime())) { return false;}
    return new Date() > deadlineDate;}


function applyTimeoutStatus() {
    let changed = false;
    tasks.forEach(function (task) {
        if (isDeadlinePassed(task)) {
            task.status = "Time Out";
            task.updatedAt = new Date().toISOString();
            task.notification = "Task reached deadline and became Time Out";
            pushTaskHistory(   task,  "System changed task status to Time Out because the deadline passed." );
            changed = true;  } });
    if (changed) {  saveTasks(); }}


function isTaskAssignedToCurrentEmployee(task) {

    if (!task) {    return false; }

    if (Array.isArray(task.assignedEmployees) && task.assignedEmployees.some(function (id) 
        {  return Number(id) === Number(currentEmployeeId); }) ) {    return true;  }

    if ( task.employeeId && Number(task.employeeId) === Number(currentEmployeeId))  {  return true; }

    if (  task.assignedEmployeeId &&  Number(task.assignedEmployeeId) === Number(currentEmployeeId)) {return true; }

    return false;

}
function getMyTasks() {

    return tasks.filter(function (task) {
        const status =   normalizeStatus(task.status);

        return (   isTaskAssignedToCurrentEmployee(task) && status !== "Blocked"   );});}


function getTaskById(taskId) {  return tasks.find(function (task) {    return Number(task.id) === Number(taskId); });}

function hasValidSubmission(task) {

    if (!task || !task.submission) {   return false; }
    const solution = String(task.submission.solution || "").trim();
    const file = String(task.submission.file || "").trim();
    const image = String(task.submission.image || "").trim();

    return solution !== "" || file !== "" || image !== "";

}


function pushTaskHistory(task, message) {

    if (!Array.isArray(task.history)) {  task.history = []; }
    task.history.push({ message: message,  employeeId: currentEmployeeId,  employeeName: getUserDisplayName(),  date: new Date().toISOString() });

}


/* FILTERS*/
function setupFilters() {

    const statusFilter =  document.getElementById("statusFilter");
    const employeeTaskFilter =  document.getElementById("employeeTaskFilter");

    if (statusFilter) {
        statusFilter.innerHTML = `
            <option value="">All Status</option>
            <option value="New">New / Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Completed">Completed</option>
            <option value="Not Complete">Not Complete</option>
            <option value="Blocked">Blocked</option>
            <option value="Time Out">Time Out</option>`;

        statusFilter.addEventListener("change", displayTasks); }

    if (employeeTaskFilter) {  employeeTaskFilter.addEventListener("change", displayTasks); }}


function loadEmployeeFilters() {

    const taskFilter = document.getElementById("employeeTaskFilter");

    if (!taskFilter) {  return;}

    const currentValue = taskFilter.value;
    const myTasks = getMyTasks();

    taskFilter.innerHTML = `  <option value="">All Tasks</option> `;

    myTasks.forEach(function (task) {

        taskFilter.innerHTML += ` <option value="${task.id}">   ${escapeHTML(task.title || "Untitled Task")}  </option> `;});

    const optionExists =  Array.from(taskFilter.options) .some(function (option) {
     return option.value === currentValue; });

    if (optionExists) { taskFilter.value = currentValue; }}

function getFilteredTasks() {

    let myTasks = getMyTasks();
    const statusFilter = document.getElementById("statusFilter")?.value || "";
    const taskFilter = document.getElementById("employeeTaskFilter")?.value || "";

    if (statusFilter) { myTasks = myTasks.filter(function (task) {

 const status = normalizeStatus(task.status);
 if (statusFilter === "New") {
  return ( status === "New" ||status === "Pending"); }

 return status === statusFilter;  }); }

    if (taskFilter) { myTasks = myTasks.filter(function (task) { return String(task.id) === String(taskFilter); }); }

    return myTasks;}

/*  TRELLO BOARD*/
const boardColumns = [
    {
title: "New / Pending", dropStatus: "Pending",  className: "column-new",  statuses: [  "New",   "Pending",  "Not Complete",  "Blocked","Time Out"  ]
    },
    {
 title: "In Progress", dropStatus: "In Progress", className: "column-progress", statuses: [   "In Progress" ]
    },
    {
 title: "Submitted", dropStatus: "Submitted", className: "column-submitted", statuses: [     "Submitted" ]
    },
    {
        title: "Completed", dropStatus: "Completed", className: "column-completed", statuses: [    "Completed" ]}];

/*  SORT TASKS BY PRIORITY + DEADLINE*/

function getPriorityWeight(priority) {

    const value = String(priority || "Medium")  .trim()  .toLowerCase();
    if (value === "high") {  return 1; }
    if (value === "medium") {   return 2; }
    if (value === "low") {   return 3; }

    return 4;}


function getDeadlineTime(task) {

 const deadlineValue =   getTaskDeadlineValue(task);
if (!deadlineValue) {   return Number.MAX_SAFE_INTEGER; }

    const deadlineDate =    new Date(deadlineValue);
    if (Number.isNaN(deadlineDate.getTime())) { return Number.MAX_SAFE_INTEGER; }

    return deadlineDate.getTime();
}


function getCreatedTime(task) {

    const createdValue = task.createdAt ||  task.createdDate || task.date || task.updatedAt ||  "";
    if (!createdValue) { return 0;}
    const createdDate =  new Date(createdValue);
    if (Number.isNaN(createdDate.getTime())) {   return 0;  } return createdDate.getTime();}


function sortTasksByPriorityAndDeadline(firstTask, secondTask) {

    const firstPriority = getPriorityWeight(firstTask.priority);
    const secondPriority = getPriorityWeight(secondTask.priority);

    if (firstPriority !== secondPriority) { return firstPriority - secondPriority; }

    const firstDeadline =  getDeadlineTime(firstTask);
    const secondDeadline = getDeadlineTime(secondTask);


    if (firstDeadline !== secondDeadline) { return firstDeadline - secondDeadline;}

 return getCreatedTime(secondTask) - getCreatedTime(firstTask);

}
function displayTasks() {

    const board =  document.getElementById("taskBoard");
    if (!board) {    return; }

    const myTasks =  getFilteredTasks();
    board.innerHTML = boardColumns.map(function (column) {
const columnTasks =  myTasks .filter(function (task) {
            const status =  normalizeStatus(task.status);

            return column.statuses.includes(status); })

        .sort(sortTasksByPriorityAndDeadline);

            const cardsHTML =     columnTasks.length > 0   ? columnTasks.map(createTaskCard).join("")  : `
                      <div class="empty-column">     No tasks here yet.  </div> `;

            return `
                <section  class="trello-column ${column.className}"  data-drop-status="${column.dropStatus}">
                    <div class="trello-column-header">
                        <div class="trello-title-wrap"> <span class="trello-dot"></span>
                            <h4 class="trello-column-title">      ${column.title} </h4>  </div>
                        <span class="trello-count">  ${columnTasks.length} </span>
                    </div> <div class="trello-cards">   ${cardsHTML}   </div>
            </section> `;
    }).join("");  
            setupDragAndDrop();

}


function createTaskCard(task) {

    const status =  normalizeStatus(task.status);
    const priority =  normalizePriority(task.priority);
    const statusClass =    getStatusClass(status);
    const priorityClass =  getPriorityClass(priority);
    const isLocked = isTaskLocked(task);
    const canDrag = !isLocked;

    return `
        <article
            class="trello-task-card ${statusClass} ${isLocked ? "task-locked" : ""}"
            draggable="${canDrag}"  data-task-id="${task.id}">

            <div class="task-card-top">
                <h5>    ${escapeHTML(task.title || "Untitled Task")}  </h5>
                <span class="task-priority ${priorityClass}">    ${escapeHTML(priority)}  </span> </div>
            <p> ${escapeHTML(task.description || "No description").slice(0, 130)} </p>

            <div class="task-card-meta">
                <span class="task-deadline">     📅 ${formatDeadline(task)} </span>
                <span class="task-status-pill">   ${escapeHTML(status)} </span> </div>
            <div class="task-card-actions">   ${buildCardButtons(task)}  </div> 
      </article> `;

}


function buildCardButtons(task) {

 const status =normalizeStatus(task.status);
 let buttons = "";

    if (  status === "New" ||   status === "Pending" || status === "Not Complete")
    {  buttons += ` <button   type="button"  class="btn-start-task"   onclick="event.stopPropagation(); startTask(${task.id})">    Start </button>  `; }

    buttons += `   <button  type="button" class="btn-view-task"   onclick="event.stopPropagation(); openTask(${task.id})">    View   </button> `;
 return buttons;}

function isTaskLocked(task) {
    const status = normalizeStatus(task.status);
    return (  status === "Blocked" ||  status === "Time Out" ||  status === "Completed");}


/* DRAG AND DROP*/
function setupDragAndDrop() {

    const cards = document.querySelectorAll(".trello-task-card");
    const columns = document.querySelectorAll(".trello-column");

    cards.forEach(function (card) {card.addEventListener("dragstart", handleDragStart);  card.addEventListener("dragend", handleDragEnd);  });

    columns.forEach(function (column) {
        column.addEventListener("dragover", handleDragOver);
        column.addEventListener("dragleave", handleDragLeave);
        column.addEventListener("drop", handleDrop); });}


function handleDragStart(event) {

    const card = event.currentTarget;
    draggedTaskId = Number(card.dataset.taskId);
    const task =  getTaskById(draggedTaskId);

    if (!task || isTaskLocked(task)) { event.preventDefault(); draggedTaskId = null;  return;  }

    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggedTaskId));}


function handleDragEnd(event) {

event.currentTarget.classList.remove("dragging");  draggedTaskId = null;

document .querySelectorAll(".trello-column").forEach(function (column) {  column.classList.remove("drag-over"); });}

function handleDragOver(event) { event.preventDefault(); event.currentTarget.classList.add("drag-over");}

function handleDragLeave(event) { event.currentTarget.classList.remove("drag-over");}


function handleDrop(event) {

 event.preventDefault();
 const column =   event.currentTarget;
 column.classList.remove("drag-over");

 const taskId =  Number(    event.dataTransfer.getData("text/plain") ||     draggedTaskId  );

 const newStatus =   column.dataset.dropStatus;   moveTaskByDrag(taskId, newStatus);}

function moveTaskByDrag(taskId, newStatus) {

    const task = getTaskById(taskId);

    if (!task) {    return; }

    const oldStatus = normalizeStatus(task.status);
    newStatus = normalizeStatus(newStatus);

    if (newStatus === "Completed") { alert("Only HR can approve tasks as Completed."); return;   }

    if (isTaskLocked(task)) {  alert("This task cannot be moved.");  return;   }

    if (newStatus === "Submitted") {

        if (!hasValidSubmission(task)) {  alert("Please write a solution or upload a file/image before submitting.")
            selectedTaskId = Number(taskId);  openTask(taskId);    return;  }

        updateTaskStatus(   task,   "Submitted",  "Employee moved task to Submitted." );  return; }

    if (newStatus === "In Progress") { updateTaskStatus( task, "In Progress","Employee moved task to In Progress.");    return; }

    if (newStatus === "Pending") {  updateTaskStatus( task, "Pending","Employee moved task to New / Pending.");  return;  }
}
function updateTaskStatus(task, newStatus, historyMessage) {

    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    task.updatedByEmployeeId = currentEmployeeId;
    task.updatedByEmployeeName = getUserDisplayName();
    task.notification = "Task status changed by Employee";

    pushTaskHistory(task, historyMessage);
    saveTasks();
    loadTasks();

}

/* TASK ACTIONS*/
function startTask(taskId) {

    const task =   getTaskById(taskId);
    if (!task) { return;}

    const status =  normalizeStatus(task.status);
    if (isTaskLocked(task)) { alert("This task cannot be started."); return; }

    if ( status !== "New" &&status !== "Pending" && status !== "Not Complete" ) 
   { alert("This task cannot be started now."); return;}

    task.status = "In Progress";
    task.startedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    task.updatedByEmployeeId = currentEmployeeId;
    task.updatedByEmployeeName = getUserDisplayName();
    task.notification = "Task started by Employee";

    pushTaskHistory(  task, "Employee started the task and moved it to In Progress." );

    saveTasks();
    loadTasks();}


function openTask(taskId) {selectedTaskId = Number(taskId);

    const task =  getTaskById(selectedTaskId);

    if (!task) {   return; }
    const status = normalizeStatus(task.status);

    setText("taskTitle", task.title || "");
    setText("taskDescription", task.description || "");
    setText("taskPriority", normalizePriority(task.priority));
    setText("taskDeadline", formatDeadline(task));
    setText("taskStatus", status);
    const feedbackBox = document.getElementById("hrFeedback");
    if (feedbackBox) {   feedbackBox.innerHTML = buildFeedbackHTML(task);}

    const solutionText =  document.getElementById("solutionText");
    const solutionFile =  document.getElementById("solutionFile");
    const solutionImage =  document.getElementById("solutionImage");
    const submitButton =document.getElementById("submitButton");

    if (solutionText) {  solutionText.value = task.submission?.solution || ""; }

    if (solutionFile) {  solutionFile.value = ""; }

    if (solutionImage) {  solutionImage.value = ""; }
    const canSubmit = status === "In Progress" ||  status === "Not Complete";

    if (solutionText) {   solutionText.disabled = !canSubmit; }

    if (solutionFile) {  solutionFile.disabled = !canSubmit;}

    if (solutionImage) {  solutionImage.disabled = !canSubmit;}

    if (submitButton) {  submitButton.style.display = canSubmit ? "inline-flex" : "none"; }
    
    const modalElement = document.getElementById("taskModal");
    if (modalElement && window.bootstrap) { const modal =  bootstrap.Modal.getOrCreateInstance(modalElement); modal.show(); }}


function buildFeedbackHTML(task) {

    const status = normalizeStatus(task.status);
    if (status === "Completed") { return `<div class="alert alert-success">  ✅ Task completed by HR. Editing is disabled.  </div> `;}
 if (status === "Blocked") { return ` <div class="alert alert-dark">  🚫 Task blocked by HR. Editing is disabled.     </div>   `;}
    if (status === "Time Out") { return ` <div class="alert alert-danger"> ⏰ Task deadline passed. Please contact HR to extend the deadline.  </div>  `;}
 if (status === "Submitted") { return ` <div class="alert alert-info">   📩 Task submitted and waiting for HR review.   </div> `; }
    if (task.hrFeedback) { return ` <div class="alert alert-warning"> <b>HR Feedback:</b>  <br>    ${escapeHTML(task.hrFeedback)}   </div> `; }
 if (status === "New" || status === "Pending") {
 return ` <div class="alert alert-primary">  Start the task first, then you can submit your solution.   </div> `; }  return "";}

function submitTask() {
    const task =   getTaskById(selectedTaskId);
    if (!task) {  return;}
    const status = normalizeStatus(task.status);

    if ( status === "Completed" || status === "Blocked" || status === "Time Out")
     {  alert("You cannot submit this task.");   return; }

    if ( status !== "In Progress" &&status !== "Not Complete")
        { alert("Please start the task first."); return; }

    const solutionText =  document.getElementById("solutionText");
    const solutionFile =  document.getElementById("solutionFile");
    const solutionImage =  document.getElementById("solutionImage");
    const solution =  solutionText ? solutionText.value.trim() : "";
    const file =  solutionFile && solutionFile.files.length > 0    ? solutionFile.files[0]    : null;
    const image = solutionImage && solutionImage.files.length > 0   ? solutionImage.files[0]    : null;
    const oldSubmission =  task.submission || {};
    const finalFile =file ? file.name : oldSubmission.file || "";
    const finalImage =  image ? image.name : oldSubmission.image || "";

    if (  solution === "" &&   finalFile === "" &&  finalImage === "" )

     {alert("Add solution text, file, or image before submitting.");return;}

    task.submission = {
        employeeId: Number(currentEmployeeId),
        employeeName: getUserDisplayName(),
        employeeEmail: currentUser.email || "",
        solution: solution,
        file: finalFile,
        image: finalImage,
        date: new Date().toISOString(),
        displayDate: new Date().toLocaleString() };

    task.status = "Submitted";
    task.submittedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    task.updatedByEmployeeId = currentEmployeeId;
    task.updatedByEmployeeName = getUserDisplayName();
    task.notification = "Task submitted by Employee";

    pushTaskHistory(  task,  "Employee submitted the task for HR review." );

    saveTasks();
    loadTasks();

    const modalElement =  document.getElementById("taskModal");
    if (modalElement && window.bootstrap) {

        const modal =   bootstrap.Modal.getInstance(modalElement);
        if (modal) {   modal.hide(); }
    }  alert("Task submitted successfully.");}


/*  DASHBOARD */

function updateEmployeeDashboard() {

    const myTasks =  getMyTasks();
    const newTasks =  myTasks.filter(function (task) {
            const status =   normalizeStatus(task.status);

            return (   status === "New" ||   status === "Pending" ||      status === "Not Complete"    ); }).length;

    const submittedTasks =  myTasks.filter(function (task) {    return normalizeStatus(task.status) === "Submitted"; }).length;
    const completedTasks =  myTasks.filter(function (task) {   return normalizeStatus(task.status) === "Completed";  }).length;

    setCounter("empTotalTasks", myTasks.length);
    setCounter("empNewTasks", newTasks);
    setCounter("empSubmittedTasks", submittedTasks);
    setCounter("empCompletedTasks", completedTasks);

}


function setCounter(id, value) {

    const element =    document.getElementById(id);
    if (!element) {   return; }
    const oldValue =  Number(element.dataset.value || element.textContent || 0);

    if (oldValue === value) { element.textContent = value; element.dataset.value = value;  return;} 
     animateCounter(element, oldValue, value);}

function animateCounter(element, startValue, endValue) {
    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue =  Math.floor(    startValue + (endValue - startValue) * progress   ); element.textContent = currentValue;

        if (progress < 1) { requestAnimationFrame(update); }
         else { element.textContent = endValue;  element.dataset.value = endValue;  } } requestAnimationFrame(update);}


/*
   NAVBAR + FOOTER + DARK MODE
 */

function setupNavbarAndFooter() {

    const profileName = document.getElementById("navbarProfileName");
    const profileImage =  document.getElementById("navbarProfileImage");
    if (profileName) {   profileName.textContent = getUserDisplayName(); }
    if (profileImage) {const imagePath = currentUser.profilePicture ||  currentUser.image || currentUser.avatar || "";

 if (imagePath) {
  if (  imagePath.startsWith("/") ||   imagePath.startsWith("http") ) {  profileImage.src = imagePath; } 
 else {   profileImage.src = "/GAITH/" + imagePath;   }  }}

    const logoutBtn =
        document.getElementById("logoutBtn");
    if (logoutBtn) {logoutBtn.addEventListener("click",function () {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("userRole");
            localStorage.removeItem("bridgeway_current_role");
            window.location.href = EMPLOYEE_LOGIN_PAGE;   }); }

    const footerYear = document.getElementById("footerYear");
    if (footerYear) {  footerYear.textContent = new Date().getFullYear(); }

    setupActiveNavLink();}
function setupDarkMode() {

    const darkModeBtn =  document.getElementById("darkModeBtn");
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {  document.body.classList.add("dark-mode");}

    updateDarkModeButton();

if (darkModeBtn) {darkModeBtn.addEventListener("click", function () { document.body.classList.toggle("dark-mode");

 const isDark =  document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateDarkModeButton();   }); }}

function updateDarkModeButton() {

    const darkModeBtn =  document.getElementById("darkModeBtn");
    if (!darkModeBtn) {    return; }
    const isDark =  document.body.classList.contains("dark-mode");
    const textSpan =   darkModeBtn.querySelector("span");
    if (textSpan) {    textSpan.textContent = isDark ? "LIGHT" : "DARK"; }

}


function setupActiveNavLink() {

    const currentPath =   window.location.pathname;
    const navLinks = document.querySelectorAll(".masar-nav-link");

 navLinks.forEach(function (link) { link.classList.remove("active");

 const linkPath = new URL(  link.href,  window.location.origin ).pathname;

        if (currentPath === linkPath) {   link.classList.add("active");  }});}
/*SYNC WITH HR PAGE / OTHER TABS*/

function setupStorageSync() { window.addEventListener("storage", function (event) { if (event.key === "tasks") { loadTasks(); }});

    setInterval(function () {
        const currentSnapshot =  localStorage.getItem("tasks") || "[]";
        const modalIsOpen = document  .getElementById("taskModal")   ?.classList   .contains("show");

        if (  currentSnapshot !== lastTasksSnapshot && !modalIsOpen && !draggedTaskId) { loadTasks();  } }, 1500);}


/* SMALL UTILITIES*/

function setText(id, value) {

    const element = document.getElementById(id);
    if (element) {   element.textContent = value; }}
/*  GLOBAL FUNCTIONS FOR HTML ONCLIC*/

window.openTask = openTask;
window.viewTask = openTask;
window.submitTask = submitTask;
window.startTask = startTask;
window.displayTasks = displayTasks;
window.loadTasks = loadTasks;