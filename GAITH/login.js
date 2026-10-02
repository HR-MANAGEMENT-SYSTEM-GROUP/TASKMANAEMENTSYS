let users = JSON.parse(localStorage.getItem("users")) || [];
if (!users.length) {
  fetch("../jsonFiles/Users.json")
    .then(res => res.json())
    .then(data => {
      users = data;
      localStorage.setItem("users", JSON.stringify(data));
    });
}

let role = "employee";
function switchToEmployee() {
  role = "employee";
  document.getElementById("navEmployee").classList.add("active");
  document.getElementById("navHR").classList.remove("active");
}
function switchToHR() {
  role = "hr";
  document.getElementById("navHR").classList.add("active");
  document.getElementById("navEmployee").classList.remove("active");
}

let emailInput = document.getElementById("loginEmail");
let passInput = document.getElementById("loginPassword");
let emailErr = document.getElementById("emailError");
let passErr = document.getElementById("passwordError");

document.getElementById("togglePasswordBtn").onclick = () => {
  passInput.type = passInput.type === "password" ? "text" : "password";
  document.getElementById("toggleIcon").className = passInput.type === "text" ? "bi bi-eye" : "bi bi-eye-slash";
};

emailInput.oninput = () => emailErr.style.display = "none";
passInput.oninput = () => passErr.style.display = "none";

document.getElementById("hrLoginForm").onsubmit = (e) => {
  e.preventDefault();
  let email = emailInput.value.trim().toLowerCase();
  let user = (JSON.parse(localStorage.getItem("Employees")) || []).find(u => u.email.toLowerCase() === email) || users.find(u => u.email.toLowerCase() === email);
  let savedPass = (JSON.parse(localStorage.getItem("user_passwords")) || {})[email];

  if (!email.includes("@")) {
    emailErr.textContent = "Enter a valid email.";
    emailErr.style.display = "block";
    return;
  }

  if (!user || user.role !== role || user.status === "Blocked" || passInput.value !== (savedPass || user.password)) {
    passErr.textContent = user?.status === "Blocked" ? "Account is blocked." : "Invalid credentials or role.";
    passErr.style.display = "block";
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");
  window.location.href = role === "hr" ? "../NADA/hrdashboard/hrdashboard.html" : "../NADA/home/home.html";
};

// Forgot Password Modal
let modal = document.getElementById("forgotPasswordModal");
let resetEmail = document.getElementById("resetEmail");
let newPassSec = document.getElementById("newPasswordSection");
let emailGroup = document.getElementById("resetEmailGroup");
let verifiedBadge = document.getElementById("resetAccountVerifiedBadge");
let submitText = document.getElementById("resetSubmitBtnText");

document.getElementById("forgotPasswordLink").onclick = (e) => {
  e.preventDefault();
  modal.style.display = "block";
  modal.classList.add("show");
  resetEmail.value = emailInput.value;
};

document.getElementById("closeForgotModalBtn").onclick = () => {
  modal.style.display = "none";
  modal.classList.remove("show");
  newPassSec.classList.add("d-none");
  emailGroup.classList.remove("d-none");
  verifiedBadge.classList.add("d-none");
  submitText.textContent = "Verify Email";
};

document.getElementById("forgotPasswordForm").onsubmit = (e) => {
  e.preventDefault();
  let found = users.find(u => u.email.toLowerCase() === resetEmail.value.trim().toLowerCase());

  if (newPassSec.classList.contains("d-none")) {
    if (!found) {
      document.getElementById("resetEmailError").textContent = "User not found";
      document.getElementById("resetEmailError").style.display = "block";
      return;
    }
    emailGroup.classList.add("d-none");
    verifiedBadge.classList.remove("d-none");
    document.getElementById("verifiedUserName").textContent = found.name;
    newPassSec.classList.remove("d-none");
    submitText.textContent = "Save Password";
  } else {
    let p1 = document.getElementById("newPasswordInput").value;
    let p2 = document.getElementById("confirmPasswordInput").value;
    if (!p1 || p1 !== p2) {
      document.getElementById("confirmPasswordError").textContent = "Passwords do not match";
      document.getElementById("confirmPasswordError").style.display = "block";
      return;
    }
    let passMap = JSON.parse(localStorage.getItem("user_passwords")) || {};
    passMap[found.email.toLowerCase()] = p1;
    localStorage.setItem("user_passwords", JSON.stringify(passMap));
    emailInput.value = found.email;
    passInput.value = p1;
    emailInput.dispatchEvent(new Event("input"));
    document.getElementById("closeForgotModalBtn").click();
  }
};
