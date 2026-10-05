// 1. Get current logged-in user (if not logged in -> redirect to login)
let user = JSON.parse(localStorage.getItem("currentUser"));
if (!user) {
  window.location.href = "../login.html";
}

// 2. Render all user data and permissions onto the page
function renderUser() {
  const isHR = user.role === "hr";
  const avatar = user.profilePicture || "../../jsonFiles/images/employee1.jpg";

  // Summary Card Info
  document.getElementById("cardFullName").textContent = user.name || "User";
  document.getElementById("cardPosition").textContent = user.position || (isHR ? "HR Manager" : "Specialist");
  document.getElementById("cardDepartment").textContent = user.department || "General";
  document.getElementById("cardEmail").textContent = user.email || "";
  document.getElementById("cardPhone").textContent = user.phone || "N/A";
  document.getElementById("cardRoleBadge").textContent = isHR ? "HR ADMIN" : "EMPLOYEE";
  document.getElementById("cardProfileImg").src = avatar;
  document.getElementById("photoPreviewImg").src = avatar;

  // Header & Navbar texts
  if (document.getElementById("userName")) document.getElementById("userName").textContent = user.name || "User";
  if (document.getElementById("profilePageTitle")) document.getElementById("profilePageTitle").textContent = isHR ? "HR Administrator Profile" : "Employee Profile";
  if (document.getElementById("profilePortalLink")) document.getElementById("profilePortalLink").href = isHR ? "../../NADA/hrdashboard/hrdashboard.html" : "../../NADA/home/home.html";

  // Form Inputs
  document.getElementById("editNameInput").value = user.name || "";
  document.getElementById("editPositionInput").value = user.position || "";
  document.getElementById("editDepartmentInput").value = user.department || "";
  document.getElementById("editPhoneInput").value = user.phone || "";
  document.getElementById("editEmailInput").value = user.email || "";

  // Role Permissions: HR can edit all info; Employees can only edit phone & photo
  document.getElementById("editNameInput").readOnly = !isHR;
  document.getElementById("editPositionInput").readOnly = !isHR;
  document.getElementById("editDepartmentInput").readOnly = !isHR;

  // Hide lock icons for HR
  ["lockBadgeName", "lockBadgePosition", "lockBadgeDept"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = isHR ? "none" : "inline";
  });

  // Role layout (HR sidebar vs Employee header)
  document.body.classList.toggle("is-hr-profile", isHR);
  const sidebar = document.getElementById("hrSidebar");
  if (sidebar) {
    sidebar.style.display = isHR ? "flex" : "none";
    if (isHR && typeof window.loadHRSidebar === "function") window.loadHRSidebar();
  }
  const wrapper = document.getElementById("profileContentWrapper");
  if (wrapper) wrapper.classList.toggle("hr-with-sidebar-content", isHR);
  const empHeader = document.querySelector(".journey-header");
  if (empHeader) empHeader.style.display = isHR ? "none" : "flex";
  const empFooter = document.querySelector(".journey-footer-container");
  if (empFooter) empFooter.style.display = isHR ? "none" : "block";
}

// 3. Live text mirroring when typing
document.getElementById("editPhoneInput").oninput = (e) => {
  document.getElementById("cardPhone").textContent = e.target.value.trim() || "N/A";
};
document.getElementById("editNameInput").oninput = (e) => {
  document.getElementById("cardFullName").textContent = e.target.value.trim() || "User";
};

// 4. Change Profile Picture
document.getElementById("imageFileInput").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    user.profilePicture = reader.result;
    document.getElementById("cardProfileImg").src = reader.result;
    document.getElementById("photoPreviewImg").src = reader.result;
  };
  reader.readAsDataURL(file);
};

// 5. Save Changes Form Submit
document.getElementById("profileEditForm").onsubmit = (e) => {
  e.preventDefault();

  if (user.role === "hr") {
    user.name = document.getElementById("editNameInput").value.trim() || user.name;
    user.position = document.getElementById("editPositionInput").value.trim() || user.position;
    user.department = document.getElementById("editDepartmentInput").value.trim() || user.department;
  }
  user.phone = document.getElementById("editPhoneInput").value.trim() || user.phone;

  // Save to localStorage
  localStorage.setItem("currentUser", JSON.stringify(user));
  const emps = JSON.parse(localStorage.getItem("Employees")) || [];
  localStorage.setItem("Employees", JSON.stringify(emps.map((emp) => (emp.id === user.id ? { ...emp, ...user } : emp))));

  // Show success alert
  const alertBox = document.getElementById("statusAlert");
  if (alertBox) {
    document.getElementById("statusAlertText").textContent = "Profile updated successfully!";
    alertBox.className = "profile-alert-banner alert-success";
    alertBox.classList.remove("d-none");
    setTimeout(() => alertBox.classList.add("d-none"), 3000);
  }
};

// 6. Password Reset Form Submit
document.getElementById("passwordResetForm").onsubmit = (e) => {
  e.preventDefault();
  const p1 = document.getElementById("newPasswordInput").value;
  const p2 = document.getElementById("confirmPasswordInput").value;

  if (!p1 || p1 !== p2) {
    alert("Passwords do not match or cannot be empty.");
    return;
  }

  user.password = p1;
  localStorage.setItem("currentUser", JSON.stringify(user));

  const pwMap = JSON.parse(localStorage.getItem("user_passwords")) || {};
  pwMap[user.email.toLowerCase()] = p1;
  localStorage.setItem("user_passwords", JSON.stringify(pwMap));

  alert("Password changed successfully!");
  document.getElementById("newPasswordInput").value = "";
  document.getElementById("confirmPasswordInput").value = "";
};

// 7. Toggle Password Visibility (Eye Icon)
function setupToggle(btnId, inputId, iconId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.onclick = () => {
    const input = document.getElementById(inputId);
    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
    document.getElementById(iconId).className = isPass ? "bi bi-eye" : "bi bi-eye-slash";
  };
}
setupToggle("toggleNewPasswordBtn", "newPasswordInput", "toggleNewPasswordIcon");
setupToggle("toggleConfirmPasswordBtn", "confirmPasswordInput", "toggleConfirmPasswordIcon");

// 8. Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../login.html";
}
window.logout = logout;
window.doLogout = logout;
const logoutBtn = document.getElementById("navLogoutBtn");
if (logoutBtn) logoutBtn.onclick = logout;

// Run on page load
renderUser();
