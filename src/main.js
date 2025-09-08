// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

const coverInput = document.getElementById('entry-cover');
const previewImg = document.getElementById('preview-img');

if (coverInput && previewImg) {
    coverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                previewImg.src = event.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
    });
}


function initializeApp() {
    // DOM Elements
    const homeBtn = document.getElementById('home-btn');
    const newEntryBtn = document.getElementById('new-entry-btn');
    const homePage = document.getElementById('home-page');
    const newEntryPage = document.getElementById('new-entry-page');
    const entryForm = document.getElementById('entry-form');
    const titleInput = document.getElementById('entry-title');
    const contentTextarea = document.getElementById('entry-content');
    const moodSelect = document.getElementById('entry-mood');
    const cancelBtn = document.getElementById('cancel-btn');
    const startWritingBtn = document.getElementById('start-writing');
    const fab = document.getElementById('fab');
    const modal = document.getElementById('entry-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const deleteEntryBtn = document.getElementById('delete-entry-btn');
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');
    const entriesList = document.getElementById('entries-list');
    const noEntriesEl = document.getElementById('no-entries');

    // Add clear entries button functionality
    const clearEntriesBtn = document.getElementById('clear-entries-btn');
    if (clearEntriesBtn) {
        clearEntriesBtn.addEventListener('click', clearAllEntries);
    }

    let currentEntryId = null;

    // --- Helper Functions ---
    function navigateToPage(page) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        if (page === 'home') {
            homeBtn?.classList.add('active');
            homePage?.classList.add('active');
        } else if (page === 'new-entry') {
            newEntryBtn?.classList.add('active');
            newEntryPage?.classList.add('active');
            titleInput?.focus();
        }
    }

    function updateWordCount() {
        const text = contentTextarea?.value || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        wordCountEl.textContent = `${words} words`;
        charCountEl.textContent = `${chars} characters`;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function saveEntries(entries) {
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    function loadEntries() {
        const data = localStorage.getItem('journalEntries');
        return data ? JSON.parse(data) : [];
    }

    function createEntryCard(entry) {
        const card = document.createElement('article');
        card.className = 'entry-card';
        card.dataset.entryId = entry.id;

        const mood = entry.mood || '😊';

        card.innerHTML = `
            <div class="entry-overlay">
                <div class="entry-meta">
                    <span class="entry-date">${formatDate(entry.date)}</span>
                    <span class="entry-mood">${mood}</span>
                </div>
                <h3 class="entry-title">${entry.title}</h3>
                <p class="entry-preview">${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}</p>
            </div>
        `;

        card.addEventListener('click', () => openModal(entry.id));
        return card;
    }

    // Add this function to clear all entries
    function clearAllEntries() {
        if (confirm('Are you sure you want to delete ALL journal entries? This action cannot be undone.')) {
            localStorage.removeItem('journalEntries');
            renderEntries();
            showNotification('All entries have been cleared.', 'success');
        }
    }

    function renderEntries() {
        const entries = loadEntries();
        entriesList.innerHTML = '';
        if (entries.length === 0) {
            noEntriesEl.style.display = 'block';
            entriesList.style.display = 'none';
            return;
        } else {
            noEntriesEl.style.display = 'none';
            entriesList.style.display = 'grid';
        }
        entries.forEach(entry => {
            entriesList.appendChild(createEntryCard(entry));
        });
    }


    // Add this function to populate the dropdown
    function populateEntriesDropdown() {
        const dropdown = document.getElementById('entries-dropdown');
        const entries = loadEntries();
        
        dropdown.innerHTML = '';
        
        if (entries.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-placeholder">No entries yet</div>';
            return;
        }
        
        // Show latest 5 entries in dropdown
        const recentEntries = entries.slice(0, 5);
        
        recentEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <span class="entry-mood">${entry.mood || '📝'}</span>
                <div class="entry-info">
                    <div class="entry-title">${entry.title}</div>
                    <div class="entry-date">${formatDate(entry.date)}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                openModal(entry.id);
                // Close dropdown
                document.querySelectorAll('.dropdown-content').forEach(d => {
                    d.style.display = 'none';
                });
            });
            
            dropdown.appendChild(item);
        });
        
        // Add "View All" option if there are more than 5 entries
        if (entries.length > 5) {
            const viewAll = document.createElement('div');
            viewAll.className = 'dropdown-item';
            viewAll.innerHTML = `
                <span class="entry-mood">📋</span>
                <div class="entry-info">
                    <div class="entry-title">View All Entries</div>
                    <div class="entry-date">${entries.length} total entries</div>
                </div>
            `;
            
            viewAll.addEventListener('click', () => {
                // Scroll to entries list
                document.getElementById('entries-list').scrollIntoView({ behavior: 'smooth' });
                // Close dropdown
                document.querySelectorAll('.dropdown-content').forEach(d => {
                    d.style.display = 'none';
                });
            });
            
            dropdown.appendChild(viewAll);
        }
    }


    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '12px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10001',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });
        const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function openModal(id) {
        const entries = loadEntries();
        const entry = entries.find(e => e.id === id);
        if (!entry) return;

        currentEntryId = id; // Make sure this is set

        document.getElementById('modal-title').textContent = entry.title;
        document.getElementById('modal-content').textContent = entry.content;
        document.getElementById('modal-date').textContent = formatDate(entry.date);
        document.getElementById('modal-mood').textContent = entry.mood || '';

        // Optional: Word count and read time
        const wordCount = entry.content.trim().split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200); // assuming 200 WPM reading speed
        document.getElementById('modal-word-count').textContent = `${wordCount} words`;
        document.getElementById('modal-read-time').textContent = `${readTime} min read`;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }


    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentEntryId = null;
    }

    // Delete entry handler
    function deleteEntry() {
        if (!currentEntryId) return;
        if (!confirm('Are you sure you want to delete this entry?')) return;

        let entries = loadEntries();
        entries = entries.filter(e => e.id !== currentEntryId);
        saveEntries(entries);
        renderEntries();
        closeModal();
        showNotification('Entry deleted successfully!', 'success');
    }

    // Make sure this listener is set once
    deleteEntryBtn?.addEventListener('click', deleteEntry);

    // Add clear entries button functionality
    clearEntriesBtn?.addEventListener('click', clearAllEntries);


    // --- Event Listeners ---
    homeBtn?.addEventListener('click', () => navigateToPage('home'));
    newEntryBtn?.addEventListener('click', () => navigateToPage('new-entry'));
    startWritingBtn?.addEventListener('click', () => navigateToPage('new-entry'));
    fab?.addEventListener('click', () => navigateToPage('new-entry'));
    cancelBtn?.addEventListener('click', () => {
        if (titleInput.value || contentTextarea.value) {
            if (!confirm('You have unsaved changes. Discard them?')) return;
        }
        entryForm.reset();
        updateWordCount();
        navigateToPage('home');
    });
    closeModalBtn?.addEventListener('click', closeModal);
    deleteEntryBtn?.addEventListener('click', deleteEntry);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    contentTextarea?.addEventListener('input', updateWordCount);

    // Form submission
    entryForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();
        const mood = moodSelect.value;

        if (!title || !content) {
            showNotification('Title and content are required!', 'error');
            return;
        }

        const entries = loadEntries();
        const newEntry = {
            id: Date.now(),
            title,
            content,
            mood,
            date: new Date().toISOString()
        };
        entries.unshift(newEntry); // newest on top
        saveEntries(entries);

        showNotification('Entry saved successfully! 📝', 'success');
        entryForm.reset();
        updateWordCount();
        renderEntries();
        navigateToPage('home');
    });

    // Smooth scroll
    [homeBtn, newEntryBtn, fab].forEach(btn => btn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }));

    // Initial render
    updateWordCount();
    renderEntries();
    console.log('📖 Personal Journal initialized with dynamic entries!');
}

