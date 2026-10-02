document.addEventListener('DOMContentLoaded', () => {

  // 1.عرض تاريخ اليوم  (مثال: Oct 2, 2026)
  const dateElem = document.getElementById('currentDateDisplay');
  if (dateElem) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    dateElem.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // 2. جلب جميع عناصر الصفحة والمتغيرات الأساسية للتحكم بالفلترة والبحث
  const searchInput = document.getElementById('dashboardSearch');
  const filterChips = document.querySelectorAll('.filter-chip');

  const summaryCardsRow = document.getElementById('summaryCardsRow');
  const summaryCards = document.querySelectorAll('.summary-item');
  const cardsNotice = document.getElementById('cardsEmptyNotice');

  const leavesSection = document.getElementById('leavesSection');
  const tableRows = document.querySelectorAll('#leavesTableBody .table-data-row');
  const tableNotice = document.getElementById('tableEmptyNotice');

  const meetingsSection = document.getElementById('meetingsSection');
  const meetingItems = document.querySelectorAll('#meetingsList .meeting-item');
  const meetingsNotice = document.getElementById('meetingsEmptyNotice');

  let currentFilter = 'all';
  let currentSearchQuery = '';

  // 3. دالة الفلترة والبحث الرئيسية: تتحكم في ظهور الكروت، الأقسام، والجداول
  function applyFilters() {

    // أ) فلترة كروت الملخص (Summary Cards)
    if (currentFilter === 'meetings') {
      if (summaryCardsRow) summaryCardsRow.style.display = 'none';
      if (cardsNotice) cardsNotice.classList.add('d-none');
    } else {
      if (summaryCardsRow) summaryCardsRow.style.display = '';

      let visibleCards = 0;
      summaryCards.forEach(card => {
        const module = card.getAttribute('data-module');
        const text = card.textContent.toLowerCase();

        const matchesFilter = (currentFilter === 'all' || currentFilter === module);
        const matchesSearch = (!currentSearchQuery || text.includes(currentSearchQuery));

        if (matchesFilter && matchesSearch) {
          card.style.display = '';
          visibleCards++;
        } else {
          card.style.display = 'none';
        }
      });

      // إظهار تنبيه "لا توجد نتائج" إذا لم يتبقَ أي كرت
      if (cardsNotice) cardsNotice.classList.toggle('d-none', visibleCards > 0);
    }

    // ب) التحكم في عرض وتوزيع الأقسام (Leaves & Meetings) حسب الفلتر المختار
    if (currentFilter === 'all') {
      if (leavesSection) { leavesSection.style.display = ''; leavesSection.className = 'col-lg-7'; }
      if (meetingsSection) { meetingsSection.style.display = ''; meetingsSection.className = 'col-lg-5'; }
    } else if (currentFilter === 'leaves') {
      if (leavesSection) { leavesSection.style.display = ''; leavesSection.className = 'col-12'; }
      if (meetingsSection) { meetingsSection.style.display = 'none'; }
    } else if (currentFilter === 'meetings') {
      if (leavesSection) { leavesSection.style.display = 'none'; }
      if (meetingsSection) { meetingsSection.style.display = ''; meetingsSection.className = 'col-12'; }
    } else {
      if (leavesSection) leavesSection.style.display = 'none';
      if (meetingsSection) meetingsSection.style.display = 'none';
    }

    // ج) البحث داخل جدول الإجازات (Leaves Table) إذا كان القسم معروضاً
    if (leavesSection && leavesSection.style.display !== 'none') {
      let visibleRows = 0;
      tableRows.forEach(row => {
        const matches = !currentSearchQuery || row.textContent.toLowerCase().includes(currentSearchQuery);
        row.style.display = matches ? '' : 'none';
        if (matches) visibleRows++;
      });
      if (tableNotice) tableNotice.classList.toggle('d-none', visibleRows > 0);
    }

    // د) البحث داخل قائمة الاجتماعات (Meetings List) إذا كان القسم معروضاً
    if (meetingsSection && meetingsSection.style.display !== 'none') {
      let visibleMeetings = 0;
      meetingItems.forEach(item => {
        const matches = !currentSearchQuery || item.textContent.toLowerCase().includes(currentSearchQuery);
        item.style.display = matches ? '' : 'none';
        if (matches) visibleMeetings++;
      });
      if (meetingsNotice) meetingsNotice.classList.toggle('d-none', visibleMeetings > 0);
    }
  }

  // 4. حدث البحث: يتحدث تلقائياً مع كل حرف يُكتب في صندوق البحث
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // 5. حدث أزرار الفلترة: تبديل التاب النشط وتطبيق الفلتر فوراً
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      currentFilter = chip.getAttribute('data-filter');
      applyFilters();
    });
  });

});