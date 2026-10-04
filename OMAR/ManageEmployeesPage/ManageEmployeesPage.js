let Employees = [];
let editId = null;
let defaultPassword = "Abc@12";
let fields = ["name", "email", "phone", "department", "position", "status", "joiningDate"];
let form = document.getElementById("form");
let modal = document.getElementById("employeeForm");
let search = document.getElementById("search");
let dept = document.getElementById("departmentFilter");

// قراءة الموظفين من local أو من ملف JSON إذا ما فيه بيانات محفوظة.
async function loadData() {
    let users = null;
    try {
        users = JSON.parse(localStorage.getItem("Employees"));
    } catch (error) {
        console.error("Unable to read saved employees:", error);
    }
    try {
        if (!Array.isArray(users)) {
            let response = await fetch("../../jsonFiles/Users.json");
            if (!response.ok) throw new Error("Users.json could not be loaded");
            users = await response.json();
        }
        Employees = users.filter(function (user) {
            return user.role === "employee";
        });
        displayEmp();
        countEmp();
    } catch (error) {
        console.error("Unable to load employees:", error);
    }
}
function getEmp(id) {
    for (let emp of Employees) {
        if (emp.id === id) return emp;
    }
    return null;
}
function saveData() {
    localStorage.setItem("Employees", JSON.stringify(Employees));
    countEmp();
    displayEmp();
}

// البحث والفلترة، ثم عرض الموظفين في الجدول.
function displayEmp() {
    let text = search.value.toLowerCase().trim();
    let list = Employees.filter(function (emp) {
        let matchName = emp.name.toLowerCase().includes(text) || emp.email.toLowerCase().includes(text);
        let matchDept = dept.value === "" || emp.department === dept.value;
        return matchName && matchDept;
    });
    let box = document.getElementById("container");
    box.innerHTML = "";
    for (let emp of list) {
        let color = "status-inactive";
        if (emp.status === "Active") color = "status-active";
        if (emp.status === "Blocked") color = "status-blocked";
        let text = "Block";
        if (emp.status === "Blocked") text = "Unblock";
        let row = document.createElement("tr");
        row.innerHTML = `
            <td class="employee-name">${emp.name}</td>
            <td>${emp.email}</td><td>${emp.department}</td><td>${emp.position}</td>
            <td><span class="status ${color}">${emp.status}</span></td>
            <td><div class="actions">
                <button class="view-button" onclick="viewEmp(${emp.id})">View</button>
                <button class="edit-button" onclick="editEmp(${emp.id})">Edit</button>
                <button class="block-button" onclick="blockEmp(${emp.id})">${text}</button>
            </div></td>`;
        box.appendChild(row);
    }
}
//بعرض الاحصائيات 
function countEmp() {
    let depts = [];
    let active = 0;
    let blocked = 0;
    for (let emp of Employees) {
        if (emp.department && !depts.includes(emp.department)) depts.push(emp.department);
        if (emp.status === "Active") active++;
        if (emp.status === "Blocked") blocked++;
    }
    document.getElementById("totalEmployees").textContent = Employees.length;
    document.getElementById("activeEmployees").textContent = active;
    document.getElementById("blockedEmployees").textContent = blocked;
    document.getElementById("totalDepartments").textContent = depts.length;
}

// فتح  نموذج الموظف.
function openForm() {
    editId = null;
    form.reset();
    document.getElementById("newEmployeePasswordGroup").hidden = false;
    document.getElementById("newEmployeePassword").value = defaultPassword;
    document.getElementById("formTitle").textContent = "New Employee";
    document.getElementById("saveButton").textContent = "Save Employee";
    modal.hidden = false;
}
function closeForm() {
    modal.hidden = true;
    form.reset();
    editId = null;
}
function saveEmp(event) {
    event.preventDefault();
    let isNew = editId === null;
    let emp = getEmp(editId);
    if (isNew) {
        emp = { id: Date.now(), role: "employee", password: defaultPassword, profilePicture: "" };
        Employees.push(emp);
    }
    if (!emp) return;
    for (let field of fields) emp[field] = document.getElementById(field).value;
    saveData();
    closeForm();
    if (isNew) alert("Employee added successfully.");
}
//بجهز البيانات للتعديل
function editEmp(id) {
    let emp = getEmp(id);
    if (!emp) return;
    editId = id;
    for (let field of fields) document.getElementById(field).value = emp[field] || "";
    document.getElementById("joiningDate").value = showDate(emp.joiningDate);
    document.getElementById("newEmployeePasswordGroup").hidden = true;
    document.getElementById("formTitle").textContent = "Edit Employee";
    document.getElementById("saveButton").textContent = "Update Employee";
    modal.hidden = false;
}

// عرض بيانات الموظف وحظر حسابه أو فك الحظر.
function viewEmp(id) {
    let emp = getEmp(id);
    if (!emp) return;
    document.getElementById("viewEmployeeName").textContent = emp.name;
    document.getElementById("viewEmail").textContent = emp.email || "-";
    document.getElementById("viewPhone").textContent = emp.phone || "-";
    document.getElementById("viewDepartment").textContent = emp.department || "-";
    document.getElementById("viewPosition").textContent = emp.position || "-";
    document.getElementById("viewJoiningDate").textContent = emp.joiningDate || "-";
    document.getElementById("viewStatus").textContent = emp.status || "-";
    document.getElementById("viewDepartmentCard").textContent = emp.department || "-";
    document.getElementById("viewPositionCard").textContent = emp.position || "-";
    document.getElementById("viewEmployeeModal").hidden = false;
}
function closeView() {
    document.getElementById("viewEmployeeModal").hidden = true;
}
function blockEmp(id) {
    let emp = getEmp(id);
    if (!emp) return;
    if (emp.status === "Blocked") {
        emp.status = "Active";
    } else {
        if (!confirm("Are you sure you want to block this employee?")) return;
        emp.status = "Blocked";
    }
    saveData();
}

// تحويل التاريخ القديم لصيغة حقل التاريخ.
function showDate(date) {
    if (!date) return "";
    if (date.includes("-")) return date;
    let parts = date.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
}
form.addEventListener("submit", saveEmp);
search.addEventListener("input", displayEmp);
dept.addEventListener("change", displayEmp);
document.addEventListener("DOMContentLoaded", loadData);
