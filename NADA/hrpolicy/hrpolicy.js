let output = document.getElementById("policyGrid");
let search = document.getElementById("searchInput");
let countEl = document.getElementById("policyCount");
let emptyState = document.getElementById("emptyState");

let modal = document.getElementById("policyModal");
let form = document.getElementById("policyForm");
let titleInput = document.getElementById("titleInput");
let descInput = document.getElementById("descInput");
let modalTitle = document.getElementById("modalTitle");

let arr = JSON.parse(localStorage.getItem("companyPolicies")) || [];
let editIndex = -1; // -1 يعني إضافة، وأي رقم ثاني يعني تعديل

// 1. جلب البيانات إذا كانت الـ LocalStorage فاضية (تماماً مثل كودك)
if (arr.length == 0) {
  fetch("/jsonFiles/companyPolicies.json")
    .then(response => response.json())
    .then(policies => {
      for (let i = 0; i < policies.length; i++) {
        arr.push(policies[i]);
      }
      localStorage.setItem("companyPolicies", JSON.stringify(arr));
      displayPolicies(arr);
    });
}

// 2. دالة عرض الكروت
function displayPolicies(list) {
  output.innerHTML = "";
  for (let i = 0; i < list.length; i++) {
    output.innerHTML += `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="policy-card">
          <div class="policy-icon">
            <i class="bi bi-file-earmark-text"></i>
          </div>
          <h2 class="policy-title">${list[i].title}</h2>
          <p class="policy-desc">${list[i].description}</p>
          <div class="policy-actions">
            <button type="button" class="btn-masar-soft" onclick="downloadPolicy(${i})">
              <i class="bi bi-download"></i> Read full
            </button>
            <button type="button" class="btn-card-action btn-card-edit" onclick="openEdit(${i})">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn-card-action btn-card-delete" onclick="deletePolicy(${i})">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // تحديث العداد وحالة الفراغ
  if (countEl) countEl.textContent = list.length + " Policies";
  if (emptyState) emptyState.classList.toggle("d-none", list.length > 0);
}
displayPolicies(arr);

// 3. فتح بوب-اب الإضافة
function openAdd() {
  editIndex = -1;
  modalTitle.textContent = "Add New Policy";
  form.reset();
  modal.style.display = "flex";
}

// 4. فتح بوب-اب التعديل وتعبئة البيانات
function openEdit(i) {
  editIndex = i;
  modalTitle.textContent = "Edit Policy";
  titleInput.value = arr[i].title;
  descInput.value = arr[i].description;
  modal.style.display = "flex";
}

// 5. إغلاق البوب-اب
function closeModal() {
  modal.style.display = "none";
  form.reset();
}

// 6. حفظ الفورم (إضافة أو تعديل)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  let title = titleInput.value.trim();
  let desc = descInput.value.trim();

  if (editIndex == -1) {
    // إضافة جديد
    arr.push({ title: title, description: desc });
  } else {
    // تعديل الموجود
    arr[editIndex].title = title;
    arr[editIndex].description = desc;
  }

  localStorage.setItem("companyPolicies", JSON.stringify(arr));
  displayPolicies(arr);
  closeModal();
});

// 7. حذف بوليسي
function deletePolicy(i) {
  if (confirm("Are you sure you want to delete this policy?")) {
    arr.splice(i, 1);
    localStorage.setItem("companyPolicies", JSON.stringify(arr));
    displayPolicies(arr);
  }
}

// 8. تنزيل البوليسي كملف نصي
function downloadPolicy(i) {
  let policy = arr[i];
  let blob = new Blob([policy.title + "\n\n" + policy.description], { type: "text/plain" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = policy.title + ".txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 9. البحث اللحظي (نفس كودك بالتمام)
search.addEventListener("input", () => {
  let text = search.value.toLowerCase();
  let policies = JSON.parse(localStorage.getItem("companyPolicies")) || [];
  let filtered = policies.filter((item) => {
    return (
      item.title.toLowerCase().includes(text) ||
      item.description.toLowerCase().includes(text)
    );
  });
  displayPolicies(filtered);
});