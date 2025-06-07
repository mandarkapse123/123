// Writer Component - Distraction-free writing interface
class WriterComponent {
    constructor() {
        this.currentChapter = null;
        this.currentScene = null;
        this.sessionStartTime = null;
        this.sessionWordCount = 0;
        this.lastWordCount = 0;
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadChapters();
        this.startSession();
        this.setupAutoSave();
    }

    bindElements() {
        this.chapterSelect = document.getElementById('chapter-select');
        this.sceneSelect = document.getElementById('scene-select');
        this.mainEditor = document.getElementById('main-editor');
        this.wordCountDisplay = document.getElementById('word-count');
        this.charCountDisplay = document.getElementById('char-count');
        this.sessionWordsDisplay = document.getElementById('session-words');
        this.saveLocationDisplay = document.getElementById('save-location');
    }

    bindEvents() {
        this.chapterSelect.addEventListener('change', () => this.onChapterChange());
        this.sceneSelect.addEventListener('change', () => this.onSceneChange());
        this.mainEditor.addEventListener('input', () => this.onTextChange());
        this.mainEditor.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // Auto-save on blur
        this.mainEditor.addEventListener('blur', () => this.saveCurrentContent());
    }

    async loadChapters() {
        try {
            const chapters = await storage.getChapters();
            this.populateChapterSelect(chapters);

            // Show helpful message if no chapters exist
            if (chapters.length === 0) {
                this.showNoChaptersMessage();
            }

            // Load last selected chapter/scene
            const lastChapter = await storage.getSetting('lastSelectedChapter');
            const lastScene = await storage.getSetting('lastSelectedScene');

            if (lastChapter) {
                this.chapterSelect.value = lastChapter;
                await this.onChapterChange();

                if (lastScene) {
                    this.sceneSelect.value = lastScene;
                    await this.onSceneChange();
                }
            }
        } catch (error) {
            console.error('Error loading chapters:', error);
            this.showNoChaptersMessage();
        }
    }

    showNoChaptersMessage() {
        this.mainEditor.value = `Welcome to Novel Writer! 📖

To get started:
1. Go to the "Organize" tab to create your first chapter
2. Come back here to start writing
3. Select your chapter and scene from the dropdowns above
4. Your work will auto-save every 30 seconds

You can also write directly here, and this content will be saved to your selected chapter.

Happy writing! ✍️`;
        this.mainEditor.style.fontStyle = 'italic';
        this.mainEditor.style.color = 'var(--text-secondary)';
    }

    populateChapterSelect(chapters) {
        this.chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.id;
            option.textContent = chapter.title;
            this.chapterSelect.appendChild(option);
        });
    }

    async onChapterChange() {
        const chapterId = parseInt(this.chapterSelect.value);
        if (!chapterId) {
            this.currentChapter = null;
            this.sceneSelect.innerHTML = '<option value="">Select Scene</option>';
            this.mainEditor.value = '';
            this.updateWordCount();
            return;
        }

        try {
            this.currentChapter = await storage.get('chapters', chapterId);
            const scenes = await storage.getScenesByChapter(chapterId);
            this.populateSceneSelect(scenes);

            // Clear welcome message styling
            this.clearWelcomeMessage();

            // Save selection
            await storage.setSetting('lastSelectedChapter', chapterId);

            // If no scenes, show chapter content
            if (scenes.length === 0) {
                this.mainEditor.value = this.currentChapter.content || '';
                this.mainEditor.placeholder = `Writing in: ${this.currentChapter.title}`;
                this.updateWordCount();
            }

            // Update save location indicator
            this.updateSaveLocation();
        } catch (error) {
            console.error('Error loading chapter:', error);
        }
    }

    populateSceneSelect(scenes) {
        this.sceneSelect.innerHTML = '<option value="">Select Scene</option>';
        scenes.forEach(scene => {
            const option = document.createElement('option');
            option.value = scene.id;
            option.textContent = scene.title;
            this.sceneSelect.appendChild(option);
        });
    }

    async onSceneChange() {
        const sceneId = parseInt(this.sceneSelect.value);
        if (!sceneId) {
            this.currentScene = null;
            // Show chapter content if no scene selected
            this.mainEditor.value = this.currentChapter?.content || '';
            this.mainEditor.placeholder = this.currentChapter ? `Writing in: ${this.currentChapter.title}` : 'Start writing your story...';
            this.updateWordCount();
            return;
        }

        try {
            this.currentScene = await storage.get('scenes', sceneId);

            // Clear welcome message styling
            this.clearWelcomeMessage();

            this.mainEditor.value = this.currentScene.content || '';
            this.mainEditor.placeholder = `Writing in: ${this.currentChapter.title} > ${this.currentScene.title}`;
            this.updateWordCount();

            // Save selection
            await storage.setSetting('lastSelectedScene', sceneId);

            // Update save location indicator
            this.updateSaveLocation();
        } catch (error) {
            console.error('Error loading scene:', error);
        }
    }

    clearWelcomeMessage() {
        this.mainEditor.style.fontStyle = 'normal';
        this.mainEditor.style.color = 'var(--text-primary)';
    }

    updateSaveLocation() {
        if (!this.saveLocationDisplay) return;

        if (this.currentScene) {
            this.saveLocationDisplay.textContent = `💾 Saving to: ${this.currentChapter.title} > ${this.currentScene.title}`;
            this.saveLocationDisplay.className = 'save-location active';
        } else if (this.currentChapter) {
            this.saveLocationDisplay.textContent = `💾 Saving to: ${this.currentChapter.title}`;
            this.saveLocationDisplay.className = 'save-location active';
        } else {
            this.saveLocationDisplay.textContent = '💾 Create a chapter first to save your work';
            this.saveLocationDisplay.className = 'save-location';
        }
    }

    onTextChange() {
        this.updateWordCount();
        this.updateSessionStats();
    }

    onKeyDown(e) {
        // Handle special key combinations
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveCurrentContent();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.insertParagraphBreak();
                    break;
            }
        }
        
        // Handle tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertTab();
        }
    }

    insertParagraphBreak() {
        const editor = this.mainEditor;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        
        editor.value = value.substring(0, start) + '\n\n' + value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
        this.onTextChange();
    }

    insertTab() {
        const editor = this.mainEditor;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        
        editor.value = value.substring(0, start) + '\t' + value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 1;
        this.onTextChange();
    }

    updateWordCount() {
        const text = this.mainEditor.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        
        this.wordCountDisplay.textContent = `${words} words`;
        this.charCountDisplay.textContent = `${chars} chars`;
        
        this.lastWordCount = words;
    }

    updateSessionStats() {
        const currentWords = this.lastWordCount;
        const sessionWords = Math.max(0, currentWords - this.sessionWordCount);
        this.sessionWordsDisplay.textContent = `Session: ${sessionWords}`;
    }

    startSession() {
        this.sessionStartTime = new Date();
        this.sessionWordCount = this.lastWordCount;
    }

    async saveCurrentContent() {
        const content = this.mainEditor.value;
        
        try {
            if (this.currentScene) {
                // Save scene content
                this.currentScene.content = content;
                this.currentScene.lastModified = new Date().toISOString();
                await storage.update('scenes', this.currentScene);
            } else if (this.currentChapter) {
                // Save chapter content
                this.currentChapter.content = content;
                this.currentChapter.lastModified = new Date().toISOString();
                await storage.update('chapters', this.currentChapter);
            }
            
            // Record writing session stats
            if (this.sessionStartTime) {
                const sessionDuration = (new Date() - this.sessionStartTime) / 1000; // seconds
                const wordsWritten = Math.max(0, this.lastWordCount - this.sessionWordCount);
                
                if (wordsWritten > 0) {
                    await storage.recordWritingSession(wordsWritten, sessionDuration);
                }
            }
            
            // Show save indicator
            this.showSaveIndicator();
        } catch (error) {
            console.error('Error saving content:', error);
            this.showErrorIndicator();
        }
    }

    showSaveIndicator() {
        // Create temporary save indicator
        const indicator = document.createElement('div');
        indicator.textContent = '✓ Saved';
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
            document.body.removeChild(indicator);
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
            document.body.removeChild(indicator);
        }, 3000);
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.mainEditor.value.trim()) {
                this.saveCurrentContent();
            }
        }, 30000);
    }

    // Focus mode methods
    enterFocusMode() {
        document.body.classList.add('focus-mode');
        this.mainEditor.focus();
    }

    exitFocusMode() {
        document.body.classList.remove('focus-mode');
    }

    // Export methods
    exportCurrentContent() {
        const content = this.mainEditor.value;
        if (!content.trim()) {
            alert('No content to export');
            return;
        }
        
        const title = this.currentScene?.title || this.currentChapter?.title || 'Untitled';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Cleanup
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Initialize writer component
window.WriterComponent = WriterComponent;
