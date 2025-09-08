/**
 * Journal Manager Module
 * Handles all CRUD operations for journal entries using localStorage
 */

const STORAGE_KEY = 'journalEntries';

// Entry model
class JournalEntry {
    constructor(title, content, mood = '', id = null, date = null) {
        this.id = id || this.generateId();
        this.title = title;
        this.content = content;
        this.mood = mood; // Store mood emoji or text
        this.date = date || new Date().toISOString();
        this.createdAt = new Date().toISOString();
        this.updatedAt = null;
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
}

export class JournalManager {
    constructor() {
        this.entries = this.loadEntries();
    }

    // Load entries from localStorage
    loadEntries() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading entries:', error);
            return [];
        }
    }

    // Save entries to localStorage
    saveEntries() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
        } catch (error) {
            console.error('Error saving entries:', error);
            throw new Error('Failed to save entry. Please try again.');
        }
    }

    // Add a new entry
    addEntry(title, content, mood = '') {
        const entry = new JournalEntry(title.trim(), content.trim(), mood);
        this.entries.unshift(entry); // newest first
        this.saveEntries();
        return entry;
    }

    // Get all entries sorted by date
    getAllEntries() {
        return this.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Get an entry by ID
    getEntryById(id) {
        return this.entries.find(entry => entry.id === id) || null;
    }

    // Update an entry
    updateEntry(id, title, content, mood) {
        const entryIndex = this.entries.findIndex(entry => entry.id === id);
        if (entryIndex === -1) return null;

        this.entries[entryIndex].title = title.trim();
        this.entries[entryIndex].content = content.trim();
        this.entries[entryIndex].mood = mood || this.entries[entryIndex].mood;
        this.entries[entryIndex].updatedAt = new Date().toISOString();

        this.saveEntries();
        return this.entries[entryIndex];
    }

    // Delete an entry
    deleteEntry(id) {
        const entryIndex = this.entries.findIndex(entry => entry.id === id);
        if (entryIndex === -1) return false;

        this.entries.splice(entryIndex, 1);
        this.saveEntries();
        return true;
    }

    // Search entries by title, content, or mood
    searchEntries(query) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return this.getAllEntries();

        return this.entries.filter(entry =>
            entry.title.toLowerCase().includes(searchTerm) ||
            entry.content.toLowerCase().includes(searchTerm) ||
            entry.mood.toLowerCase().includes(searchTerm)
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Get entry statistics
    getStats() {
        const totalEntries = this.entries.length;
        const totalWords = this.entries.reduce((sum, entry) =>
            sum + entry.content.split(/\s+/).filter(word => word.length > 0).length, 0
        );
        const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

        return {
            totalEntries,
            totalWords,
            avgWordsPerEntry,
            firstEntry: totalEntries > 0 ? this.entries[this.entries.length - 1].date : null,
            lastEntry: totalEntries > 0 ? this.entries[0].date : null
        };
    }

    // Export entries as JSON
    exportEntries() {
        return JSON.stringify(this.entries, null, 2);
    }

    // Import entries from JSON
    importEntries(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            if (!Array.isArray(imported)) throw new Error('Invalid data format');

            for (const entry of imported) {
                if (!entry.id || !entry.title || !entry.content || !entry.date) {
                    throw new Error('Invalid entry structure');
                }
            }

            this.entries = imported;
            this.saveEntries();
            return true;
        } catch (error) {
            console.error('Error importing entries:', error);
            return false;
        }
    }

    // Clear all entries
    clearAllEntries() {
        this.entries = [];
        this.saveEntries();
        return true;
    }
}

export function clearEntries() {
  localStorage.removeItem("journalEntries");
}