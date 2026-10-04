// EMP_TASK.js
// MASAR Employee Task Management (simple version)

/*  1) VARIABLES */
let tasks = [];   // بخزن كل التاسكات الي بجيبها من local storage
let currentUser = null; //يخزن بيانات الموظف الحالي من local storage
let currentEmployeeId = null; // يخزن رقم الموظف الحالي من بيانات المستخدم
let selectedTaskId = null; // يخزن رقم التاسك التي تم فتحها عند نفس الموضف   
let draggedTaskId = null; // يخزن رقم التاسك الي غير حالتها سحبها عند  الموظف
let lastTasksSnapshot = ""; // يخزن اخر نسخة من التاسكات الي تم حفظها في local storage    
const EMPLOYEE_LOGIN_PAGE = "/GAITH/login.html";//استخدمناه عشان لو الموظف مش عامل login، نرجعه على login page.

// The 4 columns of the board 
const boardColumns = [ // برسم ال 4 اعمدة بدل ما اكتب بال html
    {   title: "New / Pending",  dropStatus: "Pending",  className: "column-new", statuses: ["New", "Pending", "Not Complete", "Time Out"] },
    { title: "In Progress",  dropStatus: "In Progress", className: "column-progress",  statuses: ["In Progress"] },
    {   title: "Submitted", dropStatus: "Submitted",  className: "column-submitted",  statuses: ["Submitted"] },
    {  title: "Completed",  dropStatus: "Completed",   className: "column-completed",  statuses: ["Completed"]   }
];


/*  2) FUNCTIONS */

/* ---------- Login user ---------- */
function getCurrentUser() { //هاي الفنكشن بتجيب بيانات المستخدم الحالي من localStorage
    try {   return JSON.parse(localStorage.getItem("currentUser"));}  
     catch (error) {   return null; }} //لأنه ممكن البيانات الموجودة في localStorage تكون خربانة أو مش JSON صحيح


// Only employees can open this page
function validateEmployeeAccess() {
    if (!currentUser || !currentUser.id) {
        alert("Please login first.");
        window.location.href = EMPLOYEE_LOGIN_PAGE;
        return false;
    }

    const role = String(currentUser.role || "").trim().toLowerCase();

    if (role && role !== "employee" && role !== "emp") {
        alert("Access denied. Employee access only.");
        window.location.href = EMPLOYEE_LOGIN_PAGE;
        return false;
    }

    return true;
}

// هاي الفنكشن بترجع اسم المستخدم اللي رح نعرضه بالصفحة
function getUserDisplayName() {
    return currentUser.name ||   currentUser.fullName || 
     `${currentUser.firstName || ""} ${currentUser.lastName || ""}`//هذا ببني اسم كامل من first name و last name.
    .trim() ||  currentUser.username ||    currentUser.email ||    "User";}

// هاي الفنكشن بتفحص هل الـ id اللي وصلها هو نفس ID الموظف الحالي
function isMe(id) {
    return Number(id) === Number(currentEmployeeId);
}


/*  Local Storage  */

// بتقرأ المهام من localStorage
function getTasksFromStorage() {
    try {   return JSON.parse(localStorage.getItem("tasks")) || [];  }    catch (error) {   return []; }}

// Save tasks and tell other pages
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks)); //نحولها إلى String
    lastTasksSnapshot = localStorage.getItem("tasks") || "[]"; //بحدّث آخر نسخة محفوظة من المهام
    window.dispatchEvent(new Event("tasksUpdated"));
}

// بتحمل المهام من localStorage، وبعدها بتحدث كل الصفحة
function loadTasks() {
    tasks = getTasksFromStorage();
    applyTimeoutStatus(); // بتشيك إذا في مهام انتهت مواعيدها وبتغير حالتها إلى "Time Out"
    lastTasksSnapshot = localStorage.getItem("tasks") || "[]"; // بتحدّث آخر نسخة محفوظة من المهام
    loadEmployeeFilters(); //بتحدث dropdown الخاص بفلترة المهام
    displayTasks(); //بتعرض المهام على الصفحة
    updateEmployeeDashboard();//بتحدّث لوحة المعلومات الخاصة بالموظف
}

// بتشيك إذا في مهام انتهت مواعيدها وبتغير حالتها إلى "Time Out"
function applyTimeoutStatus() {
    let changed = false;

    for (const task of tasks) {//بتمر على كل task داخل Array المهام
        if (!["Submitted", "Completed"].includes(task.status) && isDeadlinePassed(task))  { 
            task.status = "Time Out";
            task.updatedAt = getNow(); // بتحدّث وقت آخر تعديل
            task.notification = "Task reached deadline and became Time Out";
            pushTaskHistory(task, "System changed task status to Time Out because the deadline passed."); //بتسجل في history إن النظام غير الحالة بسبب انتهاء الموعد
changed = true;   }}     if (changed) {   saveTasks(); }}

// Reload tasks when they change in HR page or in another tab
function setupStorageSync() { //هاي الفنكشن مسؤولة عن مزامنة البيانات. يعني لو HR عدّل task من صفحة HR، صفحة الموظف تحدث حالها
    window.addEventListener("storage", function (event) {
        if (event.key === "tasks") {
            loadTasks();
        }
    });

    //بفحص كل 1.5 ثانية إذا tasks تغيرت
    setInterval(function () {
        const currentSnapshot = localStorage.getItem("tasks") || "[]";  //بجيب النسخة الحالية
        const modal = document.getElementById("taskModal"); //بشيك إذا modal مفتوح
        const modalIsOpen = modal ? modal.classList.contains("show") : false; //لو مفتوح، ما بدنا نعمل reload للمهام

        if (currentSnapshot !== lastTasksSnapshot && !modalIsOpen && !draggedTaskId) {
            loadTasks();
        }
    }, 1500);
}


/*  Task helpers  */

function getNow() {
    return new Date().toISOString();
}

function normalizeStatus(status) { //الفنكشن بتنظف حالة التاسك لو ما في الو حالة التاسك
    if (!status) {  return "Pending"; }  return String(status).trim();}

function normalizePriority(priority) {
    if (!priority) {   return "Medium"; }    return String(priority).trim();}

// Protect the page from HTML code inside text
function escapeHTML(value) {
    if (value === null || value === undefined) {  return "";  }

    return String(value) // اي كود HTML داخل النص رح يتحول إلى رموز آمنة، عشان ما يفسد الصفحة أو يعمل مشاكل أمان
.replaceAll("&", "&amp;") .replaceAll("<", "&lt;") .replaceAll(">", "&gt;") .replaceAll('"', "&quot;") .replaceAll("'", "&#039;");}

// "Time Out" -> "status-time-out" (used as css class)
function getStatusClass(status) {  return "status-" + normalizeStatus(status).toLowerCase().replaceAll(" ", "-"); //ما يفضل يكون فيه spaces، فبحول Time Out إلى time-out
    }
function getPriorityClass(priority) { return normalizePriority(priority).toLowerCase().replaceAll(" ", "-");}

// The deadline can be saved in different names, take the first one that exists
function getTaskDeadlineValue(task) {
    if (task.deadline) {  return task.deadline;  }
    if (task.deadlineDate && task.deadlineTime) {   return `${task.deadlineDate}T${task.deadlineTime}`;   }
    if (task.deadlineDate) {  return task.deadlineDate; }
    if (task.dueDate) {  return task.dueDate;  }   return "";}

function formatDeadline(task) {//بتجهز deadline عشان ينعرض للمستخدم بشكل مفهوم
    const deadlineValue = getTaskDeadlineValue(task);

    if (!deadlineValue) {    return "No deadline";   }
    const date = new Date(deadlineValue);
    if (isNaN(date.getTime())) {  return escapeHTML(deadlineValue);  }
   return date.toLocaleString();}

// Is the deadline passed? (finished tasks are ignored)
function isDeadlinePassed(task) {//بتفحص هل deadline انتهى
    const status = normalizeStatus(task.status);
    const ignoredStatuses = ["Submitted", "Completed", "Time Out"];//بتتجاهل الحالات

    if (ignoredStatuses.includes(status)) {   return false;   }

    const deadlineValue = getTaskDeadlineValue(task);

    if (!deadlineValue) {  return false;  }

    // (an invalid date gives false here)
    return new Date() > new Date(deadlineValue);
}

// Is this task for the current employee?
function isTaskAssignedToCurrentEmployee(task) {
    if (!task) {  return false;  }

    if (Array.isArray(task.assignedEmployees)) {
        for (const id of task.assignedEmployees) {
            if (isMe(id)) {   return true;  } }  }

    if (task.employeeId && isMe(task.employeeId)) {   return true;  }

    if (task.assignedEmployeeId && isMe(task.assignedEmployeeId)) {    return true;  }  return false;}

// My tasks ( hidden)
function getMyTasks() {  return tasks.filter(function (task) {   return isTaskAssignedToCurrentEmployee(task); });}

function getTaskById(taskId) {   return tasks.find(function (task) {      return Number(task.id) === Number(taskId);  });}
// Does the task have a solution, a file or an image?
function hasValidSubmission(task) { if (!task || !task.submission) {     return false; }

    const solution = String(task.submission.solution || "").trim();
    const file = String(task.submission.file || "").trim();
    const image = String(task.submission.image || "").trim();

    return solution !== "" || file !== "" || image !== "";
}

// Add a line to the task history
function pushTaskHistory(task, message) {
    if (!Array.isArray(task.history)) {   task.history = [];  }

    task.history.push({   message: message,   employeeId: currentEmployeeId,   employeeName: getUserDisplayName()
        ,   date: getNow() });}

// Set the status + common fields, used by all employee actions بتضيف سجل جديد داخل history الخاص بالمهمة
function setEmployeeUpdate(task, newStatus, notification) {
    task.status = newStatus;
    task.updatedAt = getNow();
    task.updatedByEmployeeId = currentEmployeeId;
    task.updatedByEmployeeName = getUserDisplayName();
    task.notification = notification;
}


/*  Small utilities  */

function setText(id, value) {  const element = document.getElementById(id);  if (element) { element.textContent = value;  }}
//بتحط قيمة داخل input أو textarea أو select.
function setValue(id, value) {   const element = document.getElementById(id);  if (element) {     element.value = value || "";  }}

function getValue(id) {  const element = document.getElementById(id);   return element ? element.value : "";}


function getFileName(id) {//بتجيب اسم أول ملف اختاره المستخدم من input نوعه
    const input = document.getElementById(id);   return input && input.files.length > 0 ? input.files[0].name : "";}

function showModal(modalId) {
    const modalElement = document.getElementById(modalId);

    if (modalElement && window.bootstrap) {   bootstrap.Modal.getOrCreateInstance(modalElement).show();  }}

function hideModal(modalId) {
    const modalElement = document.getElementById(modalId);

    if (modalElement && window.bootstrap) {   const modal = bootstrap.Modal.getInstance(modalElement); if (modal) {     modal.hide();  } }}
/*  Filters  */

// Fill the status filter and add events
function setupFilters() {
    const statusFilter = document.getElementById("statusFilter");
    const employeeTaskFilter = document.getElementById("employeeTaskFilter");

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

        statusFilter.addEventListener("change", function () {
            displayTasks();
        });
    }

    if (employeeTaskFilter) {
        employeeTaskFilter.addEventListener("change", function () {
            displayTasks();
        });
    }
}
// Fill the "task" filter with my tasks
function loadEmployeeFilters() {
    const taskFilter = document.getElementById("employeeTaskFilter");

    if (!taskFilter) {
        return;
    }

    // Remember what the user selected before
    const currentValue = taskFilter.value;

    taskFilter.innerHTML = `<option value="">All Tasks</option>`;

    for (const task of getMyTasks()) {
        taskFilter.innerHTML += `<option value="${task.id}">${escapeHTML(task.title || "Untitled Task")}</option>`;
    }

    // Select the old option only if it still exists
    for (const option of taskFilter.options) {
        if (option.value === currentValue) {
            taskFilter.value = currentValue;
        }
    }
}
// My tasks after applying the two filters
function getFilteredTasks() {
    let myTasks = getMyTasks();
    const statusFilter = getValue("statusFilter");
    const taskFilter = getValue("employeeTaskFilter");

    if (statusFilter) {
        myTasks = myTasks.filter(function (task) {
            const status = normalizeStatus(task.status);

            if (statusFilter === "New") {
                return status === "New" || status === "Pending";
            }

            return status === statusFilter;
        });
    }

    if (taskFilter) {
        myTasks = myTasks.filter(function (task) {
            return String(task.id) === String(taskFilter);
        });
    }

    return myTasks;
}




// Smaller number = shown first
function getPriorityWeight(priority) {//بتحوّل priority إلى رقم
    const value = normalizePriority(priority).toLowerCase();

    if (value === "high") { return 1; }
    if (value === "medium") { return 2; }
    if (value === "low") { return 3; }

    return 4;
}

function getDeadlineTime(task) {//هاي بتحوّل deadline إلى رقم timestamp.
    // (empty text gives an invalid date)
    const deadlineDate = new Date(getTaskDeadlineValue(task));

    if (isNaN(deadlineDate.getTime())) {
        return Number.MAX_SAFE_INTEGER;
    }

    return deadlineDate.getTime();
}

function getCreatedTime(task) {
    const createdValue = task.createdAt || task.createdDate || task.date || task.updatedAt || "";
    const createdDate = new Date(createdValue);

    if (isNaN(createdDate.getTime())) {
        return 0;
    }

    return createdDate.getTime();
}

function sortTasksByPriorityAndDeadline(firstTask, secondTask) {
    const firstPriority = getPriorityWeight(firstTask.priority);
    const secondPriority = getPriorityWeight(secondTask.priority);

    if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority;
    }

    const firstDeadline = getDeadlineTime(firstTask);
    const secondDeadline = getDeadlineTime(secondTask);

    if (firstDeadline !== secondDeadline) {
        return firstDeadline - secondDeadline;
    }

    return getCreatedTime(secondTask) - getCreatedTime(firstTask);
}


/* ---------- Display the board ---------- */

function displayTasks() {
    const board = document.getElementById("taskBoard");

    if (!board) {  return;}

    const myTasks = getFilteredTasks();
    let boardHTML = "";

    for (const column of boardColumns) {
        // Tasks of this column, sorted
        const columnTasks = myTasks.filter(function (task) {
            return column.statuses.includes(normalizeStatus(task.status));
        }).sort(sortTasksByPriorityAndDeadline);

        let cardsHTML = "";
        for (const task of columnTasks) {
            cardsHTML += createTaskCard(task);
        }

        if (columnTasks.length === 0) {
            cardsHTML = `<div class="empty-column">No tasks here yet.</div>`;
        }

        boardHTML += `
            <section class="trello-column ${column.className}" data-drop-status="${column.dropStatus}">
                <div class="trello-column-header">
                    <div class="trello-title-wrap">
                        <span class="trello-dot"></span>
                        <h4 class="trello-column-title">${column.title}</h4>
                    </div>
                    <span class="trello-count">${columnTasks.length}</span>
                </div>
                <div class="trello-cards">${cardsHTML}</div>
            </section>`;
    }

    board.innerHTML = boardHTML;
    setupDragAndDrop();
}

// One task card
function createTaskCard(task) {
    const status = normalizeStatus(task.status);
    const priority = normalizePriority(task.priority);
    const isLocked = isTaskLocked(task);

    return `
        <article
            class="trello-task-card ${getStatusClass(status)} ${isLocked ? "task-locked" : ""}"
            draggable="${!isLocked}" data-task-id="${task.id}">

            <div class="task-card-top">
                <h5>${escapeHTML(task.title || "Untitled Task")}</h5>
                <span class="task-priority ${getPriorityClass(priority)}">${escapeHTML(priority)}</span>
            </div>
            <p>${escapeHTML(task.description || "No description").slice(0, 130)}</p>

            <div class="task-card-meta">
                <span class="task-deadline">📅 ${formatDeadline(task)}</span>
                <span class="task-status-pill">${escapeHTML(status)}</span>
            </div>
            <div class="task-card-actions">${buildCardButtons(task)}</div>
        </article>`;
}

// Start button (only for some statuses) + View button
function buildCardButtons(task) {
    const status = normalizeStatus(task.status);
    let buttons = "";

    if (status === "New" || status === "Pending" || status === "Not Complete") {
        buttons += `<button type="button" class="btn-start-task" onclick="event.stopPropagation(); startTask(${task.id})">Start</button>`;}
    buttons += `<button type="button" class="btn-view-task" onclick="event.stopPropagation(); openTask(${task.id})">View</button>`;

    return buttons;}

// Locked tasks cannot be moved or started ما بقدر احركها التاسك بالحالات هاي
function isTaskLocked(task) {
    const status = normalizeStatus(task.status);
    return   status === "Time Out" || status === "Completed";
}


/* ---------- Drag and drop ---------- */

// Add drag events to the cards and the columns
function setupDragAndDrop() {
    for (const card of document.querySelectorAll(".trello-task-card")) {
        card.addEventListener("dragstart", handleDragStart);
        card.addEventListener("dragend", handleDragEnd);
    }

    for (const column of document.querySelectorAll(".trello-column")) {
        column.addEventListener("dragover", handleDragOver);
        column.addEventListener("dragleave", handleDragLeave);
        column.addEventListener("drop", handleDrop);
    }
}

function handleDragStart(event) {
    const card = event.currentTarget;
    draggedTaskId = Number(card.dataset.taskId);

    const task = getTaskById(draggedTaskId);

    // Locked tasks cannot be dragged
    if (!task || isTaskLocked(task)) {
        event.preventDefault();
        draggedTaskId = null;
        return;
    }

    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggedTaskId));
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
    draggedTaskId = null;

    for (const column of document.querySelectorAll(".trello-column")) {
        column.classList.remove("drag-over");
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
}

function handleDrop(event) {
    event.preventDefault();

    const column = event.currentTarget;
    column.classList.remove("drag-over");

    const taskId = Number(event.dataTransfer.getData("text/plain") || draggedTaskId);
    moveTaskByDrag(taskId, column.dataset.dropStatus);
}

// Change the task status after a drop
function moveTaskByDrag(taskId, newStatus) {
    const task = getTaskById(taskId);

    if (!task) {
        return;
    }

    newStatus = normalizeStatus(newStatus);

    if (newStatus === "Completed") {
        alert("Only HR can approve tasks as Completed.");
        return;
    }

    if (isTaskLocked(task)) {
        alert("This task cannot be moved.");
        return;
    }

    if (newStatus === "Submitted") {
        // Cannot submit without a solution, file or image: open the task instead
        if (!hasValidSubmission(task)) {
            alert("Please write a solution or upload a file/image before submitting.");
            openTask(taskId);
            return;
        }

        updateTaskStatus(task, "Submitted", "Employee moved task to Submitted.");
    } else if (newStatus === "In Progress") {
        updateTaskStatus(task, "In Progress", "Employee moved task to In Progress.");
    } else if (newStatus === "Pending") {
        updateTaskStatus(task, "Pending", "Employee moved task to New / Pending.");
    }
}

function updateTaskStatus(task, newStatus, historyMessage) {
    setEmployeeUpdate(task, newStatus, "Task status changed by Employee");
    pushTaskHistory(task, historyMessage);
    saveTasks();
    loadTasks();
}


/* ---------- Task actions (start / open / submit) ---------- */

function startTask(taskId) {
    const task = getTaskById(taskId);

    if (!task) {
        return;
    }

    const status = normalizeStatus(task.status);

    if (isTaskLocked(task)) {  alert("This task cannot be started.");    return;}

    if (status !== "New" && status !== "Pending" && status !== "Not Complete") {   alert("This task cannot be started now.");   return; }

    setEmployeeUpdate(task, "In Progress", "Task started by Employee");
    task.startedAt = getNow();
    pushTaskHistory(task, "Employee started the task and moved it to In Progress.");
    saveTasks();
    loadTasks();
}

// Open the task window
function openTask(taskId) {
    selectedTaskId = Number(taskId);

    const task = getTaskById(selectedTaskId);
    if (!task) {  return;  }

    const status = normalizeStatus(task.status);
    setText("taskTitle", task.title || "");
    setText("taskDescription", task.description || "");
    setText("taskPriority", normalizePriority(task.priority));
    setText("taskDeadline", formatDeadline(task));
    setText("taskStatus", status);

    const feedbackBox = document.getElementById("hrFeedback");
    if (feedbackBox) {  feedbackBox.innerHTML = buildFeedbackHTML(task); }
    // Fill the solution fields
    setValue("solutionText", task.submission ? task.submission.solution : ""); setValue("solutionFile", "");  setValue("solutionImage", "");

    // The employee can submit only in these two statuses
    const canSubmit = status === "In Progress" || status === "Not Complete";

    for (const id of ["solutionText", "solutionFile", "solutionImage"]) {
        const field = document.getElementById(id);

        if (field) {
            field.disabled = !canSubmit;
        }
    }

    const submitButton = document.getElementById("submitButton");
    if (submitButton) {
        submitButton.style.display = canSubmit ? "inline-flex" : "none";
    }

    showModal("taskModal");
}

// The message shown above the solution (depends on the status)
function buildFeedbackHTML(task) {
    const status = normalizeStatus(task.status);

    if (status === "Completed") {
        return `<div class="alert alert-success">✅ Task completed by HR. Editing is disabled.</div>`; }

    if (status === "Time Out") {
        return `<div class="alert alert-danger">⏰ Task deadline passed. Please contact HR to extend the deadline.</div>`;  }

    if (status === "Submitted") {
        return `<div class="alert alert-info">📩 Task submitted and waiting for HR review.</div>`; }

    if (task.hrFeedback) {
        return `<div class="alert alert-warning"><b>HR Feedback:</b><br>${escapeHTML(task.hrFeedback)}</div>`; }

    if (status === "New" || status === "Pending") {
        return `<div class="alert alert-primary">Start the task first, then you can submit your solution.</div>`; }  return "";}

// Send the solution to HR
function submitTask() {
    const task = getTaskById(selectedTaskId);   if (!task) {  return; }

    const status = normalizeStatus(task.status);

    if (status === "Completed" || status === "Time Out") {
        alert("You cannot submit this task.");   return;   }

    if (status !== "In Progress" && status !== "Not Complete") {    alert("Please start the task first.");   return; }

    // New file/image, or the old one if no new file was selected
    const oldSubmission = task.submission || {};
    const solution = getValue("solutionText").trim();
    const finalFile = getFileName("solutionFile") || oldSubmission.file || "";
    const finalImage = getFileName("solutionImage") || oldSubmission.image || "";

    if (solution === "" && finalFile === "" && finalImage === "") {
        alert("Add solution text, file, or image before submitting.");
        return;
    }
//بعمل اوبجيكت خاص بالتسليم وبيحط فيه بيانات الموظف الحالي + الحل + الملف + الصورة + التاريخ
    task.submission = {   employeeId: Number(currentEmployeeId),   employeeName: getUserDisplayName()
        ,   employeeEmail: currentUser.email || "",   solution: solution,
        file: finalFile,  image: finalImage,  date: getNow(),  displayDate: new Date().toLocaleString()
    };

    setEmployeeUpdate(task, "Submitted", "Task submitted by Employee");
    task.submittedAt = getNow();

    pushTaskHistory(task, "Employee submitted the task for HR review.");

    saveTasks();
    loadTasks();
    hideModal("taskModal");

    alert("Task submitted successfully.");
}


/* ---------- Dashboard ---------- */

function updateEmployeeDashboard() {
    const myTasks = getMyTasks();

    let newTasks = 0;
    let submittedTasks = 0;
    let completedTasks = 0;

    for (const task of myTasks) {
        const status = normalizeStatus(task.status);

        if (status === "New" || status === "Pending" || status === "Not Complete") { newTasks++; }
        if (status === "Submitted") { submittedTasks++; }
        if (status === "Completed") { completedTasks++; }
    }

    setCounter("empTotalTasks", myTasks.length);
    setCounter("empNewTasks", newTasks);
    setCounter("empSubmittedTasks", submittedTasks);
    setCounter("empCompletedTasks", completedTasks);
}

// Show a number (with animation if it changed)
function setCounter(id, value) {
    const element = document.getElementById(id);

    if (!element) {    return;  }

    const oldValue = Number(element.dataset.value || element.textContent || 0);

    if (oldValue === value) {   element.textContent = value;    element.dataset.value = value;    return; }

    animateCounter(element, oldValue, value);
}

// Count from the old number to the new number in 600ms
function animateCounter(element, startValue, endValue) {
    const duration = 600;  const startTime = performance.now();

    function update(currentTime) {   const progress = Math.min((currentTime - startTime) / duration, 1);

        element.textContent = Math.floor(startValue + (endValue - startValue) * progress);

        if (progress < 1) {     requestAnimationFrame(update);} 
        else {     element.textContent = endValue;      element.dataset.value = endValue;    } }
    requestAnimationFrame(update);
}


/* ---------- Navbar + footer + dark mode ---------- */

function setupNavbarAndFooter() {
    const profileName = document.getElementById("navbarProfileName");
    const profileImage = document.getElementById("navbarProfileImage");
    const logoutBtn = document.getElementById("logoutBtn");
    const footerYear = document.getElementById("footerYear");

    if (profileName) {
        profileName.textContent = getUserDisplayName();
    }

    if (profileImage) {
        const imagePath = currentUser.profilePicture || currentUser.image || currentUser.avatar || "";

        if (imagePath) {
            if (imagePath.startsWith("/") || imagePath.startsWith("http")) {
                profileImage.src = imagePath;
            } else {
                profileImage.src = "/GAITH/" + imagePath;
            }
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("userRole");
            localStorage.removeItem("bridgeway_current_role");
            window.location.href = EMPLOYEE_LOGIN_PAGE;
        });
    }

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    setupActiveNavLink();
}

// Put the "active" class on the link of the current page
function setupActiveNavLink() {
    const currentPath = window.location.pathname;

    for (const link of document.querySelectorAll(".masar-nav-link")) {
        link.classList.remove("active");

        const linkPath = new URL(link.href, window.location.origin).pathname;

        if (currentPath === linkPath) {
            link.classList.add("active");
        }
    }
}

// Keep the body class and the button text the same as data-theme
function syncTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    updateDarkModeButton();
}

function setupDarkMode() {
    // Read the saved theme
    const savedTheme = localStorage.getItem("journey-theme") || localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        document.body.classList.add("dark-mode");
    } else {
        document.documentElement.removeAttribute("data-theme");
        document.body.classList.remove("dark-mode");
    }

    // When data-theme changes, update the page
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Dark mode button: switch the theme and save it
    const darkModeBtn = document.getElementById("darkModeBtn");

    if (darkModeBtn) {
        darkModeBtn.addEventListener("click", function () {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";

            if (isDark) {
                document.documentElement.removeAttribute("data-theme");
            } else {
                document.documentElement.setAttribute("data-theme", "dark");
            }

            const newTheme = isDark ? "light" : "dark";

            try {
                localStorage.setItem("theme", newTheme);
                localStorage.setItem("journey-theme", newTheme);
            } catch (error) {
                // saving is not important, ignore the error
            }

            syncTheme();
        });
    }
}

// The button text: "LIGHT" when dark mode is on, "DARK" when it is off
function updateDarkModeButton() {
    const darkModeBtn = document.getElementById("darkModeBtn");

    if (!darkModeBtn) {
        return;
    }

    const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
                   document.body.classList.contains("dark-mode");
    const textSpan = darkModeBtn.querySelector("span");

    if (textSpan) {
        textSpan.textContent = isDark ? "LIGHT" : "DARK";
    }
}


/* =========================================================
   3) EVENTS
========================================================= */

// Functions used inside HTML (onclick="...")
window.openTask = openTask;
window.viewTask = openTask;
window.submitTask = submitTask;
window.startTask = startTask;
window.displayTasks = displayTasks;
window.loadTasks = loadTasks;


/* =========================================================
   4) FIRST RUN
========================================================= */
document.addEventListener("DOMContentLoaded", function () {
    currentUser = getCurrentUser();

    if (!validateEmployeeAccess()) {
        return;
    }

    currentEmployeeId = Number(currentUser.id);
    setupNavbarAndFooter();
    setupDarkMode();
    setupFilters();
    loadTasks();
    setupStorageSync();
});