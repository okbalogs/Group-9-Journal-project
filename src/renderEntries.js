/**
 * Render Entries Module
 * Handles rendering and display logic for journal entries
 */

export class EntryRenderer {
    constructor(journalManager) {
        this.journalManager = journalManager;
        this.entriesContainer = document.getElementById('entries-list');
        this.noEntriesContainer = document.getElementById('no-entries');
        this.modal = document.getElementById('entry-modal');
        this.currentEntryId = null;
    }

    /**
     * Render all entries on the homepage
     */
    renderEntries() {
        const entries = this.journalManager.getAllEntries();

        if (entries.length === 0) {
            this.showNoEntries();
            return;
        }

        this.hideNoEntries();
        this.entriesContainer.innerHTML = '';

        entries.forEach(entry => {
            const entryCard = this.createEntryCard(entry);
            this.entriesContainer.appendChild(entryCard);
        });
    }

    /**
     * Create a single entry card element
     * @param {Object} entry - Journal entry object
     * @returns {HTMLElement} Entry card element
     */
    createEntryCard(entry) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.dataset.entryId = entry.id;

        const title = document.createElement('h3');
        title.className = 'entry-title';
        title.textContent = entry.title;

        const date = document.createElement('p');
        date.className = 'entry-date';
        date.textContent = this.formatDate(entry.date);

        const mood = document.createElement('span');
        mood.className = 'entry-mood';
        mood.textContent = entry.mood || '';

        const preview = document.createElement('p');
        preview.className = 'entry-preview';
        preview.textContent = this.createPreview(entry.content);

        card.appendChild(mood);
        card.appendChild(title);
        card.appendChild(date);
        card.appendChild(preview);

        // Open modal when clicked
        card.addEventListener('click', () => this.openEntryModal(entry));

        return card;
    }

    /**
     * Create a preview of the entry content (first 150 characters)
     */
    createPreview(content) {
        const maxLength = 150;
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    }

    showNoEntries() {
        this.entriesContainer.style.display = 'none';
        this.noEntriesContainer.style.display = 'block';
    }

    hideNoEntries() {
        this.entriesContainer.style.display = 'grid';
        this.noEntriesContainer.style.display = 'none';
    }

    /**
     * Open modal for a single entry
     */
    openEntryModal(entry) {
        this.currentEntryId = entry.id;

        const modalTitle = document.getElementById('modal-title');
        const modalDate = document.getElementById('modal-date');
        const modalContent = document.getElementById('modal-content');
        const modalMood = document.getElementById('modal-mood');
        const modalWordCount = document.getElementById('modal-word-count');
        const modalReadTime = document.getElementById('modal-read-time');

        if (modalTitle) modalTitle.textContent = entry.title;
        if (modalDate) modalDate.textContent = this.formatDate(entry.date);
        if (modalContent) modalContent.textContent = entry.content;
        if (modalMood) modalMood.textContent = entry.mood || '';

        // Word count and read time
        const wordCount = entry.content.split(/\s+/).filter(w => w.length > 0).length;
        if (modalWordCount) modalWordCount.textContent = `${wordCount} words`;
        if (modalReadTime) modalReadTime.textContent = `${Math.ceil(wordCount / 200)} min read`; // ~200 WPM

        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeEntryModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.currentEntryId = null;
    }

    deleteCurrentEntry() {
        if (!this.currentEntryId) return false;

        if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            const success = this.journalManager.deleteEntry(this.currentEntryId);
            if (success) {
                this.closeEntryModal();
                this.renderEntries();
                this.showNotification('Entry deleted successfully!', 'success');
                return true;
            } else {
                this.showNotification('Failed to delete entry. Please try again.', 'error');
                return false;
            }
        }
        return false;
    }

    /**
     * Render entries based on a search query
     */
    renderSearchResults(query) {
        const entries = this.journalManager.searchEntries(query);

        if (entries.length === 0) {
            this.entriesContainer.innerHTML = `
            <div class="no-results">
                <p>No entries found matching "${query}"</p>
            </div>`;
            return;
        }

        this.entriesContainer.innerHTML = '';
        entries.forEach(entry => {
            const entryCard = this.createEntryCard(entry);
            if (query.trim()) this.highlightSearchTerms(entryCard, query.trim());
            this.entriesContainer.appendChild(entryCard);
        });
    }

    highlightSearchTerms(element, query) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) textNodes.push(node);

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            const text = textNode.textContent;

            if (regex.test(text)) {
                const highlightedHTML = text.replace(regex, '<mark>$1</mark>');
                const wrapper = document.createElement('span');
                wrapper.innerHTML = highlightedHTML;
                parent.replaceChild(wrapper, textNode);
            }
        });
    }

    addHighlightStyles() {
        const style = document.createElement('style');
        style.textContent = `
            mark { background-color: #fff3cd; padding: 2px 4px; border-radius: 3px; font-weight: 600; }
            .no-results { text-align: center; padding: 3rem; color: #666; font-style: italic; }
        `;
        document.head.appendChild(style);
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });

        const colors = { success: '#28a745', error: '#dc3545', info: '#17a2b8' };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => { notification.style.opacity = '1'; notification.style.transform = 'translateY(0)'; }, 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => { if (notification.parentNode) notification.remove(); }, 300);
        }, 3000);
    }

    init() {
        this.addHighlightStyles();
        this.renderEntries();
    }
}

