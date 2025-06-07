// Ideas Component - Freeform ideas and notes space
class IdeasComponent {
    constructor() {
        this.autoSaveInterval = null;
        this.lastSaveTime = null;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadIdeas();
        this.setupAutoSave();
        console.log('Ideas component initialized');
    }

    bindElements() {
        this.ideasTextarea = document.getElementById('ideas-textarea');
        this.exportIdeasBtn = document.getElementById('export-ideas');
        this.clearIdeasBtn = document.getElementById('clear-ideas');
        this.wordCountDisplay = document.getElementById('ideas-word-count');
        this.saveStatusDisplay = document.getElementById('ideas-save-status');
        this.noteTemplates = document.querySelectorAll('.note-template');

        console.log('Ideas elements bound:', {
            textarea: !!this.ideasTextarea,
            exportBtn: !!this.exportIdeasBtn,
            clearBtn: !!this.clearIdeasBtn,
            wordCount: !!this.wordCountDisplay,
            saveStatus: !!this.saveStatusDisplay
        });
    }

    bindEvents() {
        if (this.ideasTextarea) {
            this.ideasTextarea.addEventListener('input', () => this.onTextChange());
            this.ideasTextarea.addEventListener('blur', () => this.saveIdeas());
        }

        if (this.exportIdeasBtn) {
            this.exportIdeasBtn.addEventListener('click', () => this.exportIdeas());
        }

        if (this.clearIdeasBtn) {
            this.clearIdeasBtn.addEventListener('click', () => this.clearIdeas());
        }

        // Template buttons
        this.noteTemplates.forEach(btn => {
            btn.addEventListener('click', () => this.insertTemplate(btn.dataset.template));
        });
    }

    async loadIdeas() {
        try {
            const savedIdeas = await storage.getSetting('ideas', '');
            if (this.ideasTextarea) {
                this.ideasTextarea.value = savedIdeas;
                this.updateWordCount();
                this.updateSaveStatus('Loaded');
            }
        } catch (error) {
            console.error('Error loading ideas:', error);
            this.updateSaveStatus('Error loading');
        }
    }

    onTextChange() {
        this.updateWordCount();
        this.updateSaveStatus('Typing...');

        // Debounced auto-save
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveIdeas();
        }, 2000);
    }

    updateWordCount() {
        if (!this.ideasTextarea || !this.wordCountDisplay) return;

        const text = this.ideasTextarea.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;

        this.wordCountDisplay.textContent = `${words} words`;
        this.wordCountDisplay.title = `${words} words, ${chars} characters`;
    }

    updateSaveStatus(status) {
        if (!this.saveStatusDisplay) return;

        this.saveStatusDisplay.textContent = status;
        this.saveStatusDisplay.className = 'save-status';

        if (status.includes('Saved')) {
            this.saveStatusDisplay.classList.add('saved');
        } else if (status.includes('Error')) {
            this.saveStatusDisplay.classList.add('error');
        } else if (status.includes('Typing')) {
            this.saveStatusDisplay.classList.add('typing');
        }
    }

    async saveIdeas() {
        if (!this.ideasTextarea) return;

        try {
            const content = this.ideasTextarea.value;
            await storage.setSetting('ideas', content);

            this.lastSaveTime = new Date();
            this.updateSaveStatus('Auto-saved');

            console.log('Ideas saved successfully');
        } catch (error) {
            console.error('Error saving ideas:', error);
            this.updateSaveStatus('Save failed');
        }
    }

    insertTemplate(templateType) {
        if (!this.ideasTextarea) return;

        const templates = {
            story: '\n💡 STORY IDEA:\n- What if...\n- Main conflict:\n- Resolution:\n\n',
            character: '\n🎭 CHARACTER:\n- Name:\n- Role:\n- Personality:\n- Backstory:\n\n',
            dialogue: '\n💬 DIALOGUE:\n"[Character name]: [What they say]"\n- Context:\n- Emotion:\n\n',
            scene: '\n🎬 SCENE IDEA:\n- Setting:\n- Characters present:\n- What happens:\n- Purpose:\n\n',
            research: '\n📚 RESEARCH NOTE:\n- Topic:\n- Source:\n- Key points:\n- How to use:\n\n',
            todo: '\n📋 TO-DO:\n- [ ] \n- [ ] \n- [ ] \n\n'
        };

        const template = templates[templateType] || '\n\n';
        const textarea = this.ideasTextarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + template + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + template.length;
        textarea.focus();

        this.onTextChange();
    }

    clearIdeas() {
        if (!this.ideasTextarea || this.ideasTextarea.value.trim() === '') {
            return;
        }

        const confirmClear = confirm('Are you sure you want to clear all ideas? This cannot be undone.');
        if (confirmClear) {
            this.ideasTextarea.value = '';
            this.updateWordCount();
            this.saveIdeas();
            if (window.app) {
                app.showNotification('Ideas cleared', 'info');
            }
        }
    }

    exportIdeas() {
        if (!this.ideasTextarea) return;

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

        if (window.app) {
            app.showNotification('Ideas exported!', 'success');
        }
    }



    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.ideasTextarea && this.ideasTextarea.value.trim()) {
                this.saveIdeas();
            }
        }, 30000);
    }

    // Focus the textarea
    focus() {
        if (this.ideasTextarea) {
            this.ideasTextarea.focus();
        }
    }

    // Get current content
    getContent() {
        return this.ideasTextarea ? this.ideasTextarea.value : '';
    }

    // Set content
    setContent(content) {
        if (this.ideasTextarea) {
            this.ideasTextarea.value = content;
            this.onTextChange();
        }
    }

    // Cleanup
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
    }
}

// Initialize ideas component
window.IdeasComponent = IdeasComponent;
