(function () {
  'use strict';

  var currentUser = null, stagedAvatar = '', savedState = { name: '', position: '', department: '', phone: '', avatar: '' };

  // DOM refs
  var navRoleBadge = document.getElementById('navRoleBadge'), navRoleText = document.getElementById('navRoleText');
  var navAvatarImg = document.getElementById('navAvatarImg'), navUserName = document.getElementById('navUserName');
  var navDropdownName = document.getElementById('navDropdownName'), navDropdownEmail = document.getElementById('navDropdownEmail');
  var navLogoutBtn = document.getElementById('navLogoutBtn');
  var cardFullName = document.getElementById('cardFullName'), cardPosition = document.getElementById('cardPosition');
  var cardRoleBadge = document.getElementById('cardRoleBadge'), cardProfileImg = document.getElementById('cardProfileImg');
  var cardEmail = document.getElementById('cardEmail'), cardDepartment = document.getElementById('cardDepartment');
  var cardPhone = document.getElementById('cardPhone'), cardJoiningDate = document.getElementById('cardJoiningDate');
  var profileEditForm = document.getElementById('profileEditForm');
  var editNameInput = document.getElementById('editNameInput'), editPositionInput = document.getElementById('editPositionInput');
  var editEmailInput = document.getElementById('editEmailInput'), editPhoneInput = document.getElementById('editPhoneInput');
  var editDepartmentInput = document.getElementById('editDepartmentInput');
  var phoneError = document.getElementById('phoneError'), imageError = document.getElementById('imageError');
  var photoPreviewImg = document.getElementById('photoPreviewImg'), imageFileInput = document.getElementById('imageFileInput');
  var saveChangesBtn = document.getElementById('saveChangesBtn');
  var unsavedBadge = document.getElementById('unsavedBadge'), savedBadge = document.getElementById('savedBadge');
  var statusAlert = document.getElementById('statusAlert'), statusAlertText = document.getElementById('statusAlertText');
  var statusAlertIcon = document.getElementById('statusAlertIcon'), closeStatusAlertBtn = document.getElementById('closeStatusAlertBtn');
  var passwordResetForm = document.getElementById('passwordResetForm');
  var newPasswordInput = document.getElementById('newPasswordInput'), confirmPasswordInput = document.getElementById('confirmPasswordInput');
  var newPasswordError = document.getElementById('newPasswordError'), confirmPasswordError = document.getElementById('confirmPasswordError');
  var passwordStatusAlert = document.getElementById('passwordStatusAlert'), passwordStatusText = document.getElementById('passwordStatusText');
  var toggleNewPasswordBtn = document.getElementById('toggleNewPasswordBtn'), toggleNewPasswordIcon = document.getElementById('toggleNewPasswordIcon');
  var toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPasswordBtn'), toggleConfirmPasswordIcon = document.getElementById('toggleConfirmPasswordIcon');

  // SVG initials avatar fallback
  function makeAvatar(name) {
    var parts = (name || 'Employee').trim().split(/\s+/);
    var ini = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (parts[0] || 'EP').slice(0, 2).toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><defs><linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#005BB5"/><stop offset="100%" stop-color="#0079F1"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(#avatarGrad)"/><text x="50%" y="54%" font-family="\'Plus Jakarta Sans\',sans-serif" font-size="46" font-weight="700" fill="#FFF" text-anchor="middle" dominant-baseline="middle">' + ini + '</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function resolvePath(path, name) {
    if (!path || typeof path !== 'string' || !path.trim()) return makeAvatar(name);
    var c = path.trim();
    if (c.startsWith('data:') || c.startsWith('http') || c.startsWith('blob:')) return c;
    var m = c.match(/([a-zA-Z0-9_\-]+\.(jpg|jpeg|png|gif|webp))$/i);
    return m ? '../../jsonFiles/images/' + m[1] : c;
  }

  // تنسيق التاريخ
  function fmtDate(s) {
    if (!s) return 'N/A';
    var p = s.split('/'), d;
    if (p.length === 3) d = new Date(+p[2], +p[0] - 1, +p[1]);
    else d = new Date(s);
    return isNaN(d) ? s : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }

  // عرض الرسائل
  function showAlert(msg, type) {
    if (!statusAlert || !statusAlertText) return;
    statusAlertText.textContent = msg;
    statusAlert.className = 'profile-alert-banner alert-' + type;
    if (statusAlertIcon) statusAlertIcon.className = type === 'success' ? 'bi bi-check-lg text-success' : 'bi bi-exclamation-triangle-fill text-danger';
    statusAlert.classList.remove('d-none');
    statusAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(function () { if (statusAlert) statusAlert.classList.add('d-none'); }, 5000);
  }
  if (closeStatusAlertBtn) closeStatusAlertBtn.onclick = function () { statusAlert.classList.add('d-none'); };

  // تتبع التغييرات
  function isDirty() {
    var ph = editPhoneInput ? editPhoneInput.value.trim() : '';
    if (ph !== savedState.phone || stagedAvatar !== savedState.avatar) return true;
    if (currentUser && currentUser.role === 'hr') {
      if ((editNameInput ? editNameInput.value.trim() : '') !== savedState.name) return true;
      if ((editPositionInput ? editPositionInput.value.trim() : '') !== savedState.position) return true;
      if ((editDepartmentInput ? editDepartmentInput.value.trim() : '') !== savedState.department) return true;
    }
    return false;
  }
  function updateDirty() {
    var d = isDirty();
    if (saveChangesBtn) saveChangesBtn.disabled = !d;
    if (unsavedBadge && savedBadge) {
      unsavedBadge.classList.toggle('d-none', !d);
      savedBadge.classList.toggle('d-none', d);
    }
  }
  window.addEventListener('beforeunload', function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

  // التحقق من رقم الهاتف
  function checkPhone(showErr) {
    var val = editPhoneInput ? editPhoneInput.value.trim() : '';
    var ok = val && /^[\d\s+\-().]{7,20}$/.test(val);
    if (editPhoneInput && phoneError) {
      if (!ok && showErr) { editPhoneInput.classList.add('is-invalid'); phoneError.classList.add('active'); }
      else if (ok) { editPhoneInput.classList.remove('is-invalid'); phoneError.classList.remove('active'); }
    }
    return ok;
  }

  // ربط الحقول - live mirroring
  if (editPhoneInput) {
    editPhoneInput.oninput = function () { checkPhone(false); if (cardPhone) cardPhone.textContent = editPhoneInput.value.trim() || 'N/A'; updateDirty(); };
    editPhoneInput.onblur = function () { checkPhone(true); };
  }
  if (editNameInput) editNameInput.oninput = function () {
    var v = editNameInput.value.trim() || 'Employee';
    if (cardFullName) cardFullName.textContent = v;
    if (navUserName) navUserName.textContent = v;
    if (navDropdownName) navDropdownName.textContent = v;
    var sh = document.getElementById('userName'); if (sh) sh.textContent = v;
    updateDirty();
  };
  if (editPositionInput) editPositionInput.oninput = function () { if (cardPosition) cardPosition.textContent = editPositionInput.value.trim() || 'Specialist'; updateDirty(); };
  if (editDepartmentInput) editDepartmentInput.oninput = function () { if (cardDepartment) cardDepartment.textContent = editDepartmentInput.value.trim() || 'General'; updateDirty(); };

  // عرض البيانات بالصفحة
  function render(user) {
    if (!user) return;
    var name = user.name || 'Employee', isHR = user.role === 'hr';
    var pos = user.position || (isHR ? 'HR Manager' : 'Specialist');
    var email = user.email || '', phone = user.phone || 'N/A';
    var dept = user.department || (isHR ? 'Human Resources' : 'General');
    var avatar = resolvePath(user.profilePicture, name);

    if (cardFullName) cardFullName.textContent = name;
    if (cardPosition) cardPosition.textContent = pos;
    if (cardEmail) { cardEmail.textContent = email; cardEmail.title = email; }
    if (cardDepartment) cardDepartment.textContent = dept;
    if (cardPhone) cardPhone.textContent = phone;
    if (cardJoiningDate) cardJoiningDate.textContent = fmtDate(user.joiningDate);
    if (cardRoleBadge) { cardRoleBadge.textContent = isHR ? 'HR ADMIN' : 'EMPLOYEE'; cardRoleBadge.classList.toggle('hr', isHR); }
    if (navRoleText) navRoleText.textContent = isHR ? 'HR Admin' : 'Employee';
    if (navRoleBadge) navRoleBadge.classList.toggle('hr', isHR);
    if (cardProfileImg) { cardProfileImg.src = avatar; cardProfileImg.alt = 'Profile photo of ' + name; }
    if (photoPreviewImg) { photoPreviewImg.src = avatar; photoPreviewImg.alt = 'Photo preview of ' + name; }
    if (navAvatarImg) { navAvatarImg.src = avatar; navAvatarImg.alt = 'Avatar of ' + name; }
    if (navUserName) navUserName.textContent = name;
    if (navDropdownName) navDropdownName.textContent = name;
    if (navDropdownEmail) navDropdownEmail.textContent = email;
    var sh = document.getElementById('userName'); if (sh) sh.textContent = name;
    var navAuth = document.getElementById('navAuth'), navUser = document.getElementById('navUser');
    if (navAuth) navAuth.classList.add('hidden');
    if (navUser) navUser.classList.remove('hidden');
  }

  function fillForm(user) {
    if (!user) return;
    if (editNameInput) editNameInput.value = user.name || '';
    if (editPositionInput) editPositionInput.value = user.position || '';
    if (editEmailInput) editEmailInput.value = user.email || '';
    if (editPhoneInput) editPhoneInput.value = user.phone || '';
    if (editDepartmentInput) editDepartmentInput.value = user.department || (user.role === 'hr' ? 'Human Resources' : 'Finance');
  }

  // اعداد صلاحيات الحقول حسب الرول
  function setupField(input, badgeId, lockId, helpId, isHR, hrBadge, empBadge, hrHelp, empHelp) {
    if (input) { input.readOnly = !isHR; input.classList.toggle('is-editable-field', isHR); }
    var b = document.getElementById(badgeId); if (b) { b.textContent = isHR ? hrBadge : empBadge; b.classList.toggle('badge-editable', isHR); }
    var l = document.getElementById(lockId); if (l) l.style.display = isHR ? 'none' : 'flex';
    var h = document.getElementById(helpId); if (h) h.textContent = isHR ? hrHelp : empHelp;
  }

  function setPermissions(role) {
    var isHR = role === 'hr';
    var hrDash = '../../NADA/hrdashboard/hrdashboard.html', home = '../../NADA/home/home.html';
    document.documentElement.classList.toggle('role-hr', isHR);
    document.documentElement.classList.toggle('role-employee', !isHR);
    document.body.classList.toggle('is-hr-profile', isHR);
    document.body.classList.toggle('is-employee-profile', !isHR);
    document.body.classList.toggle('hr-sidebar-page', isHR);
    document.title = isHR ? 'HR Administrator Profile — Masar HR' : 'Employee Profile — Masar HR';

    var cw = document.getElementById('profileContentWrapper'); if (cw) cw.classList.toggle('hr-with-sidebar-content', isHR);
    var sb = document.getElementById('hrSidebar');
    if (sb) { sb.style.display = isHR ? 'flex' : 'none'; if (isHR && (!sb.children || !sb.children.length) && typeof window.loadHRSidebar === 'function') window.loadHRSidebar(); }

    var np = document.getElementById('navbar-placeholder'); if (np) np.style.display = isHR ? 'none' : 'block';
    var fp = document.getElementById('footer-placeholder'); if (fp) fp.style.display = isHR ? 'none' : 'block';
    var eh = document.querySelector('.journey-header'); if (eh) eh.style.display = isHR ? 'none' : 'flex';
    var ef = document.querySelector('.journey-footer-container'); if (ef) ef.style.display = isHR ? 'none' : 'block';

    var pl = document.getElementById('profilePortalLink') || document.querySelector('.breadcrumb-parent-link');
    if (pl) { pl.href = isHR ? hrDash : home; pl.title = isHR ? 'Back to HR Dashboard' : 'Back to Home'; }
    var bl = document.getElementById('navBrandLogoLink') || document.querySelector('.profile-navbar a');
    if (bl) { bl.href = isHR ? hrDash : home; bl.title = isHR ? 'Masar HR Dashboard' : 'Masar Home'; }

    var pt = document.getElementById('profilePageTitle'); if (pt) pt.textContent = isHR ? 'HR Administrator Profile' : 'Employee Profile';
    var ps = document.getElementById('profilePageSubtitle');
    if (ps) ps.textContent = isHR ? 'Manage your official HR administrative credentials, department records, and account security.' : 'Manage your personal information, contact credentials, and account security.';
    var bc = document.getElementById('profileBreadcrumbText'); if (bc) bc.textContent = isHR ? 'HR Profile' : 'Employee Profile';

    if (navRoleText) navRoleText.textContent = isHR ? 'HR Admin' : 'Employee';
    if (navRoleBadge) navRoleBadge.classList.toggle('hr', isHR);
    if (cardRoleBadge) { cardRoleBadge.textContent = isHR ? 'HR ADMIN' : 'EMPLOYEE'; cardRoleBadge.classList.toggle('hr', isHR); }

    setupField(editNameInput, 'badgeNameStatus', 'lockBadgeName', 'nameHelp', isHR, 'Editable by HR', 'Official Record', 'Edit your legal full name for official records.', 'Official legal name from employee records (read-only).');
    setupField(editPositionInput, 'badgePositionStatus', 'lockBadgePosition', 'positionHelp', isHR, 'Editable by HR', 'HR Governed', 'Edit your official job title or administrative designation.', 'Position assignment is managed by HR administration (read-only).');
    setupField(editDepartmentInput, 'badgeDeptStatus', 'lockBadgeDept', 'deptHelp', isHR, 'Editable by HR', 'Managed by HR', 'Specify your primary organizational department.', 'Department placement is governed by HR policy (read-only).');
  }

  // تحميل الصورة وتصغيرها
  function downscale(file) {
    return new Promise(function (resolve, reject) {
      if (['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].indexOf(file.type.toLowerCase()) === -1) return reject(new Error('Invalid image format.'));
      if (file.size > 2 * 1024 * 1024) return reject(new Error('Image exceeds 2 MB.'));
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Failed to read file.')); };
      reader.onload = function (ev) {
        var img = new Image();
        img.onerror = function () { reject(new Error('Failed to parse image.')); };
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = c.height = 256;
          var ctx = c.getContext('2d'), min = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, 256, 256);
          resolve(c.toDataURL('image/jpeg', 0.88));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (imageFileInput) imageFileInput.onchange = async function (e) {
    var file = e.target.files[0]; if (!file) return;
    try {
      stagedAvatar = await downscale(file);
      if (cardProfileImg) cardProfileImg.src = stagedAvatar;
      if (photoPreviewImg) photoPreviewImg.src = stagedAvatar;
      if (imageError) { imageError.textContent = ''; imageError.classList.remove('active'); }
    } catch (err) { if (imageError) { imageError.textContent = err.message; imageError.classList.add('active'); } }
    imageFileInput.value = ''; updateDirty();
  };

  // حفظ بـ localStorage
  function syncStorage(key, rec) {
    var raw = localStorage.getItem(key); if (!raw) return;
    try {
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === rec.id || (list[i].email && list[i].email.toLowerCase() === rec.email.toLowerCase())) {
          list[i] = Object.assign({}, list[i], rec); localStorage.setItem(key, JSON.stringify(list)); break;
        }
      }
    } catch (e) {}
  }

  // فورم الحفظ
  if (profileEditForm) profileEditForm.onsubmit = async function (e) {
    e.preventDefault();
    // validation
    var isHR = currentUser && currentUser.role === 'hr';
    if (isHR) {
      if (editNameInput && !editNameInput.value.trim()) { editNameInput.focus(); showAlert('Full Name cannot be empty.', 'danger'); return; }
      if (editPositionInput && !editPositionInput.value.trim()) { editPositionInput.focus(); showAlert('Job Title cannot be empty.', 'danger'); return; }
      if (editDepartmentInput && !editDepartmentInput.value.trim()) { editDepartmentInput.focus(); showAlert('Department cannot be empty.', 'danger'); return; }
    }
    if (!checkPhone(true)) { if (editPhoneInput) editPhoneInput.focus(); return; }
    if (!isDirty()) return;

    var origHtml = saveChangesBtn.innerHTML;
    saveChangesBtn.disabled = true;
    saveChangesBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1.5" role="status"></span><span>Saving...</span>';
    await new Promise(function (r) { setTimeout(r, 350); });

    var updated = Object.assign({}, currentUser, {
      name: isHR && editNameInput ? editNameInput.value.trim() : currentUser.name,
      position: isHR && editPositionInput ? editPositionInput.value.trim() : currentUser.position,
      department: isHR && editDepartmentInput ? editDepartmentInput.value.trim() : (currentUser.department || 'Finance'),
      phone: editPhoneInput ? editPhoneInput.value.trim() : (currentUser.phone || ''),
      profilePicture: stagedAvatar, email: currentUser.email
    });

    try {
      localStorage.setItem('currentUser', JSON.stringify(updated));
      syncStorage('users', updated); syncStorage('employees', updated);
      currentUser = updated;
      savedState = { name: updated.name, position: updated.position, department: updated.department, phone: updated.phone, avatar: stagedAvatar };
      render(updated); updateDirty();
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updated }));
      showAlert('Profile changes saved successfully.', 'success');
    } catch (err) {
      console.error('Save error:', err);
      var q = err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014;
      showAlert(q ? 'Storage quota exceeded. Choose a smaller photo.' : 'Failed to save. Please try again.', 'danger');
    }
    saveChangesBtn.innerHTML = origHtml; updateDirty();
  };

  // تبديل اظهار الباسوورد
  function togglePass(btn, input, icon) {
    if (!btn || !input || !icon) return;
    btn.onclick = function () { var t = input.type === 'text'; input.type = t ? 'password' : 'text'; icon.className = t ? 'bi bi-eye' : 'bi bi-eye-slash'; };
  }
  togglePass(toggleNewPasswordBtn, newPasswordInput, toggleNewPasswordIcon);
  togglePass(toggleConfirmPasswordBtn, confirmPasswordInput, toggleConfirmPasswordIcon);

  // فورم تغيير الباسوورد
  if (passwordResetForm) passwordResetForm.onsubmit = function (e) {
    e.preventDefault();
    var np = newPasswordInput ? newPasswordInput.value : '', cp = confirmPasswordInput ? confirmPasswordInput.value : '';
    var rx = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    var err1 = !np || !rx.test(np), err2 = !cp || cp !== np;

    if (err1) { newPasswordInput.classList.add('is-invalid'); newPasswordError.textContent = 'Min 8 chars with a special character.'; newPasswordError.classList.add('active'); }
    else { newPasswordInput.classList.remove('is-invalid'); newPasswordError.textContent = ''; newPasswordError.classList.remove('active'); }
    if (err2) { confirmPasswordInput.classList.add('is-invalid'); confirmPasswordError.textContent = 'Passwords do not match.'; confirmPasswordError.classList.add('active'); }
    else { confirmPasswordInput.classList.remove('is-invalid'); confirmPasswordError.textContent = ''; confirmPasswordError.classList.remove('active'); }
    if (err1 || err2) { (err1 ? newPasswordInput : confirmPasswordInput).focus(); return; }

    try {
      var key = currentUser ? currentUser.email.toLowerCase() : '';
      var pw = JSON.parse(localStorage.getItem('user_passwords') || '{}');
      pw[key] = np; localStorage.setItem('user_passwords', JSON.stringify(pw));
      if (currentUser) { currentUser.password = np; localStorage.setItem('currentUser', JSON.stringify(currentUser)); }
      if (passwordStatusAlert && passwordStatusText) {
        passwordStatusText.textContent = 'Password reset successfully.';
        passwordStatusAlert.classList.remove('d-none');
        setTimeout(function () { passwordStatusAlert.classList.add('d-none'); }, 4500);
      }
      if (newPasswordInput) newPasswordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
    } catch (err) { console.error('Password reset error:', err); }
  };

  // تسجيل الخروج
  function doLogout() {
    try {
      ['currentUser', 'isLoggedIn', 'loggedIn', 'userRole', 'username', 'bridgeway_current_role', 'masar_current_role'].forEach(function (k) { localStorage.removeItem(k); });
      sessionStorage.removeItem('isLoggedIn'); sessionStorage.setItem('logged_out', 'true');
    } catch (e) {}
    if (typeof window.doLogout === 'function' && window.doLogout !== doLogout) window.doLogout();
  }
  window.doLogout = doLogout;
  if (navLogoutBtn) navLogoutBtn.onclick = function () { doLogout(); window.location.href = '../login.html'; };

  // التهيئة
  async function init() {
    var stored = localStorage.getItem('currentUser');
    var reqRole = new URLSearchParams(window.location.search).get('role');
    if (!stored && !reqRole) { window.location.href = '../login.html'; return; }
    sessionStorage.removeItem('logged_out');
    try { if (stored) currentUser = JSON.parse(stored); } catch (e) {}
    if (reqRole && (!currentUser || currentUser.role !== reqRole)) currentUser = null;

    if (!currentUser) {
      var pref = reqRole || localStorage.getItem('userRole') || 'employee';
      var paths = ['images/../Users.json', '../Users.json', '../../Users.json', '../jsonFiles/Users.json', '../../jsonFiles/Users.json', '/jsonFiles/Users.json'];
      var defEmp = { id: 1, name: 'Abdullah Saleh', email: 'abdullah.saleh@company.com', phone: '0771234567', role: 'employee', position: 'Financial Analyst', department: 'Finance', joiningDate: '6/8/2024', status: 'Active', profilePicture: '../../jsonFiles/images/employee1.jpg' };
      var defHR = { id: 12, name: 'Maya Nasser', email: 'maya.nasser@company.com', phone: '0782345679', role: 'hr', position: 'HR Manager', department: 'Human Resources', joiningDate: '2/12/2025', status: 'Active', profilePicture: '../../jsonFiles/images/hr1.jpg' };
      var fallback = pref === 'hr' ? defHR : defEmp;
      for (var i = 0; i < paths.length; i++) {
        try {
          var res = await fetch(paths[i]);
          if (res.ok) { var data = await res.json(); if (Array.isArray(data) && data.length) { currentUser = Object.assign({}, fallback, data.find(function (u) { return u.role === pref; }) || data[0]); break; } }
        } catch (e) {}
      }
      if (!currentUser) currentUser = Object.assign({}, fallback);
      try { localStorage.setItem('currentUser', JSON.stringify(currentUser)); localStorage.setItem('userRole', currentUser.role || 'employee'); } catch (e) {}
    }

    stagedAvatar = resolvePath(currentUser.profilePicture, currentUser.name);
    savedState = { name: currentUser.name || '', position: currentUser.position || '', department: currentUser.department || '', phone: currentUser.phone || '', avatar: stagedAvatar };
    setPermissions(currentUser.role); render(currentUser); fillForm(currentUser); updateDirty();
    // image fallbacks
    [cardProfileImg, photoPreviewImg, navAvatarImg].forEach(function (el) {
      if (el) el.onerror = function () { this.onerror = null; this.src = makeAvatar(currentUser ? currentUser.name : null); };
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
