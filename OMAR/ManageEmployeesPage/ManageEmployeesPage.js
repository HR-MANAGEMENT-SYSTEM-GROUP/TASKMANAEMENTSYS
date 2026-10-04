let Employees = [];
let editingId = null;
const DEFAULT_EMPLOYEE_PASSWORD = "Abc@12";

let container = document.getElementById("container");
let form = document.getElementById("form");
let modal = document.getElementById("employeeForm");
let search = document.getElementById("search");
let departmentFilter = document.getElementById("departmentFilter");
let employeeFields = ["name", "email", "phone", "department", "position", "status", "joiningDate"];

//بجيب الموظفين من local اذا ما فيه بجيب من الجيسون
function loadEmployees() {
    try {
        let saved = JSON.parse(localStorage.getItem("Employees"));
        if (Array.isArray(saved)) {
            Employees = saved.filter(employee => employee.role === "employee");
            displayEmployees(Employees);
            updateSummary();
            return;
        }
    } catch (error) {
        console.error("Unable to read saved employees:", error);
    }

    fetch("../../jsonFiles/Users.json")
        .then(response => {
            if (!response.ok) throw new Error("Users.json could not be loaded");
            return response.json();
        })
        .then(data => {
            Employees = data.filter(employee => employee.role === "employee");
            displayEmployees(Employees);
            updateSummary();
        })
        .catch(error => console.error("Users.json Error:", error));
}

//حفظ التعديلات في localStorage 
function saveEmployees() {
    localStorage.setItem("Employees", JSON.stringify(Employees));
    updateSummary();
    applyFilters();
}

function displayEmployees(list) {
    container.innerHTML = "";
    for (let employee of list) {
        let statusClass = "status-inactive";
        if (employee.status === "Active") statusClass = "status-active";
        if (employee.status === "Blocked") statusClass = "status-blocked";
        let blockText = employee.status === "Blocked" ? "Unblock" : "Block";

        container.innerHTML += `
            <tr>
                <td class="employee-name">${employee.name}</td>
                <td>${employee.email}</td>
                <td>${employee.department}</td>
                <td>${employee.position}</td>
                <td><span class="status ${statusClass}">${employee.status}</span></td>
                <td><div class="actions">
                    <button class="view-button" onclick="viewEmployee(${employee.id})">View</button>
                    <button class="edit-button" onclick="editEmployee(${employee.id})">Edit</button>
                    <button class="block-button" onclick="toggleBlock(${employee.id})">${blockText}</button>
                </div></td>
            </tr>`;
    }
}
//بتحدث الاحصئيات
function updateSummary() {
    let departments = [];
    for (let employee of Employees) {
        if (employee.department && !departments.includes(employee.department)) {
            departments.push(employee.department);
        }
    }
    document.getElementById("totalEmployees").textContent = Employees.length;
    document.getElementById("activeEmployees").textContent = Employees.filter(employee => employee.status === "Active").length;
    document.getElementById("blockedEmployees").textContent = Employees.filter(employee => employee.status === "Blocked").length;
    document.getElementById("totalDepartments").textContent = departments.length;
}

//بس اكبس add emp بتفتح 
function showForm() {
    editingId = null;
    form.reset();
    document.getElementById("newEmployeePasswordGroup").hidden = false;
    document.getElementById("newEmployeePassword").value = DEFAULT_EMPLOYEE_PASSWORD;
    document.getElementById("formTitle").textContent = "New Employee";
    document.getElementById("saveButton").textContent = "Save Employee";
    modal.hidden = false;
}

function hideForm() {
    modal.hidden = true;
    form.reset();
    editingId = null;
}

//لما بدي اعمل ادد او ابديت
form.addEventListener("submit", event => {
    event.preventDefault();
    const isNewEmployee = editingId === null;
    let employee = Employees.find(employee => employee.id === editingId);
    if (isNewEmployee) {
        employee = { id: Date.now(), role: "employee", password: DEFAULT_EMPLOYEE_PASSWORD, profilePicture: "" };
        Employees.push(employee);
    }
    if (!employee) return;
    for (let field of employeeFields) {
        employee[field] = document.getElementById(field).value;
    }
    saveEmployees();
    hideForm();
    if (isNewEmployee) {
        alert("Employee added successfully.");
    }
});
//بجيب معلومات الموظف وبجهزها للابديت
function editEmployee(id) {
    let employee = Employees.find(employee => employee.id === id);
    if (!employee) return;
    editingId = id;
    for (let field of employeeFields) {
        document.getElementById(field).value = employee[field] || "";
    }
    document.getElementById("joiningDate").value = formatDateForInput(employee.joiningDate);
    document.getElementById("newEmployeePasswordGroup").hidden = true;
    document.getElementById("formTitle").textContent = "Edit Employee";
    document.getElementById("saveButton").textContent = "Update Employee";
    modal.hidden = false;
}

function viewEmployee(id) {
    let employee = Employees.find(employee => employee.id === id);
    if (!employee) return;
    document.getElementById("viewEmployeeName").textContent = employee.name;
    document.getElementById("viewEmail").textContent = employee.email || "-";
    document.getElementById("viewPhone").textContent = employee.phone || "-";
    document.getElementById("viewDepartment").textContent = employee.department || "-";
    document.getElementById("viewPosition").textContent = employee.position || "-";
    document.getElementById("viewJoiningDate").textContent = employee.joiningDate || "-";
    document.getElementById("viewStatus").textContent = employee.status || "-";
    document.getElementById("viewDepartmentCard").textContent = employee.department || "-";
    document.getElementById("viewPositionCard").textContent = employee.position || "-";
    document.getElementById("viewEmployeeModal").hidden = false;
}

function closeEmployeeView() {
    document.getElementById("viewEmployeeModal").hidden = true;
}

function toggleBlock(id) {
    let employee = Employees.find(employee => employee.id === id);
    if (!employee) return;
    if (employee.status !== "Blocked" && !confirm("Are you sure you want to block this employee?")) return;
    employee.status = employee.status === "Blocked" ? "Active" : "Blocked";
    saveEmployees();
}
//date
function formatDateForInput(date) {
    if (!date) return "";
    if (date.includes("-")) return date;
    let parts = date.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
}
//search and dep filter
function applyFilters() {
    let text = search.value.toLowerCase().trim();
    let department = departmentFilter.value;
    let filtered = Employees.filter(employee =>
        (employee.name.toLowerCase().includes(text) || employee.email.toLowerCase().includes(text)) &&
        (department === "" || employee.department === department)
    );
    displayEmployees(filtered);
}

search.addEventListener("input", applyFilters);
departmentFilter.addEventListener("change", applyFilters);
document.addEventListener("DOMContentLoaded", loadEmployees);
