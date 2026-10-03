// بجيب اليوزرز من اللوكال او من الجيسون
let users = JSON.parse(localStorage.getItem("users")) || [];
if (!users.length) {
  fetch("../jsonFiles/Users.json")
    .then(res => res.json())
    .then(data => { users = data; localStorage.setItem("users", JSON.stringify(data)); });
}

// التبديل بين دور الموظف و HR
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

// عناصر الفورم
let emailInput = document.getElementById("loginEmail");
let passInput = document.getElementById("loginPassword");
let emailErr = document.getElementById("emailError");
let passErr = document.getElementById("passwordError");

// زر اظهار/اخفاء الباسوورد
document.getElementById("togglePasswordBtn").onclick = () => {
  passInput.type = passInput.type === "password" ? "text" : "password";
  document.getElementById("toggleIcon").className = passInput.type === "text" ? "bi bi-eye" : "bi bi-eye-slash";
  if (typeof window.syncPadlockState === "function") window.syncPadlockState();
};

// اخفاء رسائل الخطأ لما اليوزر يكتب
emailInput.oninput = () => emailErr.style.display = "none";
passInput.oninput = () => passErr.style.display = "none";

// دالة تدور على اليوزر - اول بـ Employees (عمر) بعدين users الاصلي
function findUser(email) {
  let employees = JSON.parse(localStorage.getItem("Employees")) || [];
  for (let i = 0; i < employees.length; i++) {
    if ((employees[i].email || "").trim().toLowerCase() === email) return employees[i];
  }
  for (let i = 0; i < users.length; i++) {
    if ((users[i].email || "").trim().toLowerCase() === email) return users[i];
  }
  return null;
}

// لما اليوزر يعمل سبمت - بتحقق من الايميل والباسوورد والرول والستاتس
document.getElementById("hrLoginForm").onsubmit = (e) => {
  e.preventDefault();
  let email = emailInput.value.trim().toLowerCase();

  if (!email.includes("@")) {
    emailErr.textContent = "Enter a valid email.";
    emailErr.style.display = "block";
    return;
  }

  let user = findUser(email);
  // بشوف اذا غير الباسوورد من forgot password
  let savedPass = (JSON.parse(localStorage.getItem("user_passwords")) || {})[email];
  let correctPass = savedPass || (user ? user.password : "");

  if (!user || user.role !== role) {
    passErr.textContent = "Invalid credentials or role.";
    passErr.style.display = "block";
    return;
  }
  if (user.status === "Blocked") {
    passErr.textContent = "Account is blocked.";
    passErr.style.display = "block";
    return;
  }
  if (passInput.value !== correctPass) {
    passErr.textContent = "Invalid credentials or role.";
    passErr.style.display = "block";
    return;
  }

  // كل اشي تمام - بخزن اليوزر وبوديه على صفحته
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");
  window.location.href = role === "hr" ? "../NADA/hrdashboard/hrdashboard.html" : "../NADA/home/home.html";
};

// مودال نسيت الباسوورد
let modal = document.getElementById("forgotPasswordModal");
let resetEmail = document.getElementById("resetEmail");
let newPassSec = document.getElementById("newPasswordSection");
let emailGroup = document.getElementById("resetEmailGroup");
let verifiedBadge = document.getElementById("resetAccountVerifiedBadge");
let submitText = document.getElementById("resetSubmitBtnText");

// فتح المودال
document.getElementById("forgotPasswordLink").onclick = (e) => {
  e.preventDefault();
  modal.style.display = "block";
  modal.classList.add("show");
  resetEmail.value = emailInput.value;
};

// اغلاق المودال
document.getElementById("closeForgotModalBtn").onclick = () => {
  modal.style.display = "none";
  modal.classList.remove("show");
  newPassSec.classList.add("d-none");
  emailGroup.classList.remove("d-none");
  verifiedBadge.classList.add("d-none");
  submitText.textContent = "Verify Email";
};

// فورم نسيت الباسوورد - خطوتين: تحقق من الايميل، بعدين غير الباسوورد
document.getElementById("forgotPasswordForm").onsubmit = (e) => {
  e.preventDefault();
  let found = findUser(resetEmail.value.trim().toLowerCase());

  // الخطوة الاولى: التحقق من الايميل
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
    // الخطوة الثانية: حفظ الباسوورد الجديد
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
