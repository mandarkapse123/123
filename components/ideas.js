// Ideas Component - Freeform ideas and notes space
class IdeasComponent {
    constructor() {
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadIdeas();
        this.setupAutoSave();
    }

    bindElements() {
        this.ideasTextarea = document.getElementById('ideas-textarea');
        this.saveIdeasBtn = document.getElementById('save-ideas');
        this.clearIdeasBtn = document.getElementById('clear-ideas');
    }

    bindEvents() {
        this.ideasTextarea.addEventListener('input', () => this.onTextChange());
        this.saveIdeasBtn.addEventListener('click', () => this.saveIdeas());
        this.clearIdeasBtn.addEventListener('click', () => this.clearIdeas());
        
        // Auto-save on blur
        this.ideasTextarea.addEventListener('blur', () => this.saveIdeas());
    }

    async loadIdeas() {
        try {
            const savedIdeas = await storage.getSetting('ideas', '');
            this.ideasTextarea.value = savedIdeas;
            this.updateWordCount();
        } catch (error) {
            console.error('Error loading ideas:', error);
        }
    }

    onTextChange() {
        this.updateWordCount();
        // Mark as unsaved
        this.saveIdeasBtn.textContent = '💾 Save Ideas';
        this.saveIdeasBtn.classList.add('btn-primary');
        this.saveIdeasBtn.classList.remove('btn-secondary');
    }

    updateWordCount() {
        const text = this.ideasTextarea.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        
        // Update button text with word count
        if (words > 0) {
            this.saveIdeasBtn.title = `${words} words, ${chars} characters`;
        }
    }

    async saveIdeas() {
        try {
            const content = this.ideasTextarea.value;
            await storage.setSetting('ideas', content);
            
            // Mark as saved
            this.saveIdeasBtn.textContent = '✅ Saved';
            this.saveIdeasBtn.classList.remove('btn-primary');
            this.saveIdeasBtn.classList.add('btn-secondary');
            
            // Show save indicator
            this.showSaveIndicator();
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                this.saveIdeasBtn.textContent = '💾 Save Ideas';
                this.saveIdeasBtn.classList.add('btn-primary');
                this.saveIdeasBtn.classList.remove('btn-secondary');
            }, 2000);
        } catch (error) {
            console.error('Error saving ideas:', error);
            this.showErrorIndicator();
        }
    }

    clearIdeas() {
        if (this.ideasTextarea.value.trim() === '') {
            return;
        }
        
        const confirmClear = confirm('Are you sure you want to clear all ideas? This cannot be undone.');
        if (confirmClear) {
            this.ideasTextarea.value = '';
            this.saveIdeas();
            app.showNotification('Ideas cleared', 'info');
        }
    }

    showSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.textContent = '✓ Ideas Saved';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            z-index: 1000;
            font-size: 0.9rem;
        `;
        
        document.body.appendChild(indicator);
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 2000);
    }

    showErrorIndicator() {
        const indicator = document.createElement('div');
        indicator.textContent = '✗ Save failed';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--danger-color);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            z-index: 1000;
            font-size: 0.9rem;
        `;
        
        document.body.appendChild(indicator);
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 3000);
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.ideasTextarea.value.trim()) {
                this.saveIdeas();
            }
        }, 30000);
    }

    // Export ideas
    exportIdeas() {
        const content = this.ideasTextarea.value;
        if (!content.trim()) {
            alert('No ideas to export');
            return;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ideas-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import ideas (append to existing)
    importIdeas(text) {
        const currentContent = this.ideasTextarea.value;
        const separator = currentContent.trim() ? '\n\n---\n\n' : '';
        this.ideasTextarea.value = currentContent + separator + text;
        this.onTextChange();
        this.saveIdeas();
    }

    // Focus the textarea
    focus() {
        this.ideasTextarea.focus();
    }

    // Get current content
    getContent() {
        return this.ideasTextarea.value;
    }

    // Set content
    setContent(content) {
        this.ideasTextarea.value = content;
        this.onTextChange();
    }

    // Cleanup
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Initialize ideas component
window.IdeasComponent = IdeasComponent;
