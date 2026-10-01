// Dashboard Interactive Enhancement Script 
    
    document.addEventListener('DOMContentLoaded', () => {
        
        const dateElem = document.getElementById('currentDateDisplay');
        if (dateElem) {
            const now = new Date();
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            dateElem.textContent = now.toLocaleDateString('en-US', options);
        }

        
        const searchInput = document.getElementById('dashboardSearch');
        const filterChips = document.querySelectorAll('.filter-chip');
        
        const summaryCardsRow = document.getElementById('summaryCardsRow');
        const summaryCards = document.querySelectorAll('.summary-item');
        const cardsNotice = document.getElementById('cardsEmptyNotice');
        
        const tableRows = document.querySelectorAll('#leavesTableBody .table-data-row');
        const tableNotice = document.getElementById('tableEmptyNotice');
        
        const meetingItems = document.querySelectorAll('#meetingsList .meeting-item');
        const meetingsNotice = document.getElementById('meetingsEmptyNotice');
        
        const leavesSection = document.getElementById('leavesSection');
        const meetingsSection = document.getElementById('meetingsSection');

        let currentFilter = 'all';
        let currentSearchQuery = '';

        
        function applyFilters() {

            
            if (currentFilter === 'meetings') {
                
                if (summaryCardsRow) summaryCardsRow.style.display = 'none';
                if (cardsNotice) cardsNotice.classList.add('d-none');
            } else {
                if (summaryCardsRow) summaryCardsRow.style.display = '';
                
                let visibleCardsCount = 0;
                summaryCards.forEach(card => {
                    const module = card.getAttribute('data-module');
                    const cardText = card.textContent.toLowerCase();
                    
                    const matchesFilter = (currentFilter === 'all' || currentFilter === module);
                    const matchesSearch = (!currentSearchQuery || cardText.includes(currentSearchQuery));

                    if (matchesFilter && matchesSearch) {
                        card.style.display = '';
                        visibleCardsCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                
                if (cardsNotice) {
                    cardsNotice.classList.toggle('d-none', visibleCardsCount > 0);
                }
            }

           
            if (currentFilter === 'all') {
                if (leavesSection) {
                    leavesSection.style.display = '';
                    leavesSection.className = 'col-lg-7';
                }
                if (meetingsSection) {
                    meetingsSection.style.display = '';
                    meetingsSection.className = 'col-lg-5';
                }
            } else if (currentFilter === 'leaves') {
                if (leavesSection) {
                    leavesSection.style.display = '';
                    leavesSection.className = 'col-12'; 
                }
                if (meetingsSection) meetingsSection.style.display = 'none';
            } else if (currentFilter === 'meetings') {
                if (leavesSection) leavesSection.style.display = 'none';
                if (meetingsSection) {
                    meetingsSection.style.display = '';
                    meetingsSection.className = 'col-12'; 
                }
            } else {
                
                if (leavesSection) leavesSection.style.display = 'none';
                if (meetingsSection) meetingsSection.style.display = 'none';
            }

           
            if (leavesSection && leavesSection.style.display !== 'none') {
                let visibleTableCount = 0;
                tableRows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (!currentSearchQuery || text.includes(currentSearchQuery)) {
                        row.style.display = '';
                        visibleTableCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });
                if (tableNotice) {
                    tableNotice.classList.toggle('d-none', visibleTableCount > 0);
                }
            }

            
            if (meetingsSection && meetingsSection.style.display !== 'none') {
                let visibleMeetingsCount = 0;
                meetingItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (!currentSearchQuery || text.includes(currentSearchQuery)) {
                        item.style.display = '';
                        visibleMeetingsCount++;
                    } else {
                        item.style.display = 'none';
                    }
                });
                if (meetingsNotice) {
                    meetingsNotice.classList.toggle('d-none', visibleMeetingsCount > 0);
                }
            }
        }

        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearchQuery = e.target.value.trim().toLowerCase();
                applyFilters();
            });
        }

        
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                currentFilter = chip.getAttribute('data-filter');
                applyFilters();
            });
        });
    });

