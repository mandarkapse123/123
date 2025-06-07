// Main Application Controller
class NovelWriterApp {
    constructor() {
        this.currentView = 'writer';
        this.components = {};
        this.init();
    }

    async init() {
        // Wait for storage to initialize
        await this.waitForStorage();
        
        // Initialize components
        this.initializeComponents();
        
        // Bind global events
        this.bindEvents();
        
        // Load theme
        this.loadTheme();
        
        // Show initial view
        this.showView('writer');
        
        console.log('Novel Writer App initialized successfully');
    }

    async waitForStorage() {
        try {
            // Wait for storage to be ready
            if (window.storageReady) {
                await window.storageReady;
            } else {
                // Fallback: wait for storage object
                let attempts = 0;
                while (!window.storage?.db && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
            }

            if (!window.storage?.db) {
                console.error('Storage failed to initialize');
                // Try to restore from localStorage as fallback
                if (window.storage) {
                    await window.storage.restoreFromLocalStorage();
                }
                throw new Error('Storage initialization failed');
            }

            console.log('Storage initialized successfully');
        } catch (error) {
            console.error('Storage error:', error);
            alert('Failed to initialize storage. Some features may not work properly. Your data will be saved to browser storage as a fallback.');
        }
    }

    initializeComponents() {
        try {
            this.components.writer = new WriterComponent();
            this.components.organizer = new OrganizerComponent();
            this.components.characters = new CharactersComponent();
            this.components.outline = new OutlineComponent();
            this.components.goals = new GoalsComponent();
            this.components.research = new ResearchComponent();
            this.components.timeline = new TimelineComponent();
            this.components.stats = new StatsComponent();
            
            // Make components globally accessible for onclick handlers
            window.writer = this.components.writer;
            window.organizer = this.components.organizer;
            window.characters = this.components.characters;
            window.outline = this.components.outline;
            window.goals = this.components.goals;
            window.research = this.components.research;
            window.timeline = this.components.timeline;
            window.stats = this.components.stats;
            
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.showView(view);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Focus mode toggle
        const focusMode = document.getElementById('focus-mode');
        if (focusMode) {
            focusMode.addEventListener('click', () => this.toggleFocusMode());
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }

        // Search button
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.showGlobalSearch());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            if (this.components.writer) {
                this.components.writer.saveCurrentContent();
            }
        });
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        const targetBtn = document.querySelector(`[data-view="${viewName}"]`);

        if (targetView && targetBtn) {
            targetView.classList.add('active');
            targetBtn.classList.add('active');
            this.currentView = viewName;

            // Refresh stats when stats view is shown
            if (viewName === 'stats' && this.components.stats) {
                this.components.stats.refresh();
            }
        }
    }

    async loadTheme() {
        try {
            const savedTheme = await storage.getSetting('theme', 'light');
            this.setTheme(savedTheme);
        } catch (error) {
            console.error('Error loading theme:', error);
            this.setTheme('light');
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    async toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.setTheme(newTheme);
        
        try {
            await storage.setSetting('theme', newTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }

    toggleFocusMode() {
        if (this.currentView === 'writer' && this.components.writer) {
            if (document.body.classList.contains('focus-mode')) {
                this.components.writer.exitFocusMode();
            } else {
                this.components.writer.enterFocusMode();
            }
        }
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.showView('writer');
                    break;
                case '2':
                    e.preventDefault();
                    this.showView('organizer');
                    break;
                case '3':
                    e.preventDefault();
                    this.showView('characters');
                    break;
                case '4':
                    e.preventDefault();
                    this.showView('outline');
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFocusMode();
                    break;
                case 'e':
                    e.preventDefault();
                    this.showExportModal();
                    break;
                case '/':
                    e.preventDefault();
                    this.showGlobalSearch();
                    break;
            }
        }

        // Escape key to exit focus mode
        if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) {
            this.toggleFocusMode();
        }
    }

    async showExportModal() {
        try {
            const data = await storage.exportData();
            const chapters = data.chapters || [];
            const totalWords = this.calculateTotalWords(chapters, data.scenes || []);

            const modal = this.createModal('Export Your Novel', `
                <div class="export-options">
                    <div class="export-summary">
                        <h4>📊 Your Novel Summary</h4>
                        <p><strong>Chapters:</strong> ${chapters.length}</p>
                        <p><strong>Total Words:</strong> ${totalWords.toLocaleString()}</p>
                        <p><strong>Characters:</strong> ${(data.characters || []).length}</p>
                    </div>

                    <h4>📤 Export Options</h4>

                    <div class="form-group">
                        <button class="btn-primary" onclick="app.exportAsCompleteNovel()">📖 Export Complete Novel</button>
                        <p><small>Download your entire novel as a formatted text file</small></p>
                    </div>

                    <div class="form-group">
                        <button class="btn-primary" onclick="app.exportAsPDF()">📄 Export as PDF</button>
                        <p><small>Generate a PDF version of your novel (requires internet)</small></p>
                    </div>

                    <div class="form-group">
                        <button class="btn-secondary" onclick="app.exportAsZip()">🗜️ Export as ZIP Package</button>
                        <p><small>Download everything as a ZIP file with separate chapter files</small></p>
                    </div>

                    <div class="form-group">
                        <button class="btn-secondary" onclick="app.exportAsJSON()">💾 Export Data Backup (JSON)</button>
                        <p><small>Technical backup file - can be imported back into the app</small></p>
                    </div>

                    <div class="form-group">
                        <button class="btn-secondary" onclick="app.exportCurrentContent()">📝 Export Current Chapter</button>
                        <p><small>Export only what you're currently writing</small></p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            `);
        } catch (error) {
            console.error('Error preparing export:', error);
            alert('Error preparing export. Please try again.');
        }
    }

    async exportAsJSON() {
        try {
            const data = await storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `novel-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();
        } catch (error) {
            console.error('Error exporting JSON:', error);
            alert('Error exporting data. Please try again.');
        }
    }

    calculateTotalWords(chapters, scenes) {
        let totalWords = 0;

        // Count words in chapters
        chapters.forEach(chapter => {
            if (chapter.content) {
                const words = chapter.content.trim().split(/\s+/).length;
                totalWords += chapter.content.trim() ? words : 0;
            }
        });

        // Count words in scenes
        scenes.forEach(scene => {
            if (scene.content) {
                const words = scene.content.trim().split(/\s+/).length;
                totalWords += scene.content.trim() ? words : 0;
            }
        });

        return totalWords;
    }

    async exportAsCompleteNovel() {
        try {
            const data = await storage.exportData();
            const chapters = data.chapters || [];
            const scenes = data.scenes || [];

            let novelText = `MY NOVEL\n`;
            novelText += `Generated on ${new Date().toLocaleDateString()}\n`;
            novelText += `Total Chapters: ${chapters.length}\n`;
            novelText += `Total Words: ${this.calculateTotalWords(chapters, scenes).toLocaleString()}\n\n`;
            novelText += `${'='.repeat(50)}\n\n`;

            // Sort chapters by order
            chapters.sort((a, b) => a.order - b.order);

            for (const chapter of chapters) {
                novelText += `CHAPTER ${chapter.order + 1}: ${chapter.title.toUpperCase()}\n\n`;

                if (chapter.content) {
                    novelText += chapter.content + '\n\n';
                }

                // Add scenes for this chapter
                const chapterScenes = scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
                for (const scene of chapterScenes) {
                    if (scene.content) {
                        novelText += `--- ${scene.title} ---\n\n`;
                        novelText += scene.content + '\n\n';
                    }
                }

                novelText += `${'='.repeat(50)}\n\n`;
            }

            this.downloadFile(novelText, 'my-novel.txt', 'text/plain');
            document.querySelector('.modal-overlay')?.remove();
        } catch (error) {
            console.error('Error exporting novel:', error);
            alert('Error exporting novel. Please try again.');
        }
    }

    async exportAsPDF() {
        try {
            // Check if we can use the browser's print to PDF
            const data = await storage.exportData();
            const chapters = data.chapters || [];
            const scenes = data.scenes || [];

            // Create a new window with formatted content
            const printWindow = window.open('', '_blank');
            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>My Novel</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 2cm; }
                        h1 { text-align: center; font-size: 24px; margin-bottom: 2cm; }
                        h2 { font-size: 18px; margin-top: 2cm; margin-bottom: 1cm; page-break-before: always; }
                        h3 { font-size: 16px; margin-top: 1cm; margin-bottom: 0.5cm; }
                        p { margin-bottom: 1em; text-align: justify; }
                        .stats { text-align: center; margin-bottom: 2cm; font-style: italic; }
                        @media print { body { margin: 1cm; } }
                    </style>
                </head>
                <body>
                    <h1>MY NOVEL</h1>
                    <div class="stats">
                        Generated on ${new Date().toLocaleDateString()}<br>
                        ${chapters.length} Chapters • ${this.calculateTotalWords(chapters, scenes).toLocaleString()} Words
                    </div>
            `;

            chapters.sort((a, b) => a.order - b.order);

            for (const chapter of chapters) {
                htmlContent += `<h2>Chapter ${chapter.order + 1}: ${chapter.title}</h2>`;

                if (chapter.content) {
                    const paragraphs = chapter.content.split('\n\n');
                    paragraphs.forEach(para => {
                        if (para.trim()) {
                            htmlContent += `<p>${para.trim()}</p>`;
                        }
                    });
                }

                const chapterScenes = scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
                for (const scene of chapterScenes) {
                    if (scene.content) {
                        htmlContent += `<h3>${scene.title}</h3>`;
                        const paragraphs = scene.content.split('\n\n');
                        paragraphs.forEach(para => {
                            if (para.trim()) {
                                htmlContent += `<p>${para.trim()}</p>`;
                            }
                        });
                    }
                }
            }

            htmlContent += '</body></html>';

            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Wait a moment then trigger print dialog
            setTimeout(() => {
                printWindow.print();
            }, 500);

            document.querySelector('.modal-overlay')?.remove();
        } catch (error) {
            console.error('Error creating PDF:', error);
            alert('Error creating PDF. Please try again.');
        }
    }

    exportCurrentContent() {
        if (this.components.writer) {
            this.components.writer.exportCurrentContent();
            // Close modal
            document.querySelector('.modal-overlay')?.remove();
        }
    }

    async exportAsZip() {
        try {
            if (typeof JSZip === 'undefined') {
                alert('ZIP functionality requires internet connection. Please try again when online.');
                return;
            }

            const data = await storage.exportData();
            const zip = new JSZip();

            // Create folders
            const chaptersFolder = zip.folder("chapters");
            const dataFolder = zip.folder("data");

            // Add complete novel
            const chapters = data.chapters || [];
            const scenes = data.scenes || [];
            let completeNovel = this.generateCompleteNovelText(chapters, scenes);
            zip.file("complete-novel.txt", completeNovel);

            // Add individual chapters
            chapters.sort((a, b) => a.order - b.order);
            for (const chapter of chapters) {
                let chapterText = `${chapter.title}\n${'='.repeat(chapter.title.length)}\n\n`;

                if (chapter.content) {
                    chapterText += chapter.content + '\n\n';
                }

                // Add scenes
                const chapterScenes = scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
                for (const scene of chapterScenes) {
                    if (scene.content) {
                        chapterText += `--- ${scene.title} ---\n\n${scene.content}\n\n`;
                    }
                }

                chaptersFolder.file(`chapter-${chapter.order + 1}-${chapter.title.replace(/[^a-zA-Z0-9]/g, '-')}.txt`, chapterText);
            }

            // Add character profiles
            if (data.characters && data.characters.length > 0) {
                let charactersText = "CHARACTER PROFILES\n==================\n\n";
                data.characters.forEach(char => {
                    charactersText += `${char.name}\n${'-'.repeat(char.name.length)}\n`;
                    if (char.role) charactersText += `Role: ${char.role}\n`;
                    if (char.age) charactersText += `Age: ${char.age}\n`;
                    if (char.description) charactersText += `Description: ${char.description}\n`;
                    if (char.appearance) charactersText += `Appearance: ${char.appearance}\n`;
                    if (char.personality) charactersText += `Personality: ${char.personality}\n`;
                    if (char.background) charactersText += `Background: ${char.background}\n`;
                    if (char.goals) charactersText += `Goals: ${char.goals}\n`;
                    if (char.relationships) charactersText += `Relationships: ${char.relationships}\n`;
                    if (char.notes) charactersText += `Notes: ${char.notes}\n`;
                    charactersText += '\n' + '='.repeat(50) + '\n\n';
                });
                dataFolder.file("characters.txt", charactersText);
            }

            // Add plot outline
            if (data.plotPoints && data.plotPoints.length > 0) {
                let outlineText = "PLOT OUTLINE\n============\n\n";
                data.plotPoints.sort((a, b) => a.order - b.order).forEach(point => {
                    outlineText += `${point.title} (${point.type})\n`;
                    if (point.description) outlineText += `${point.description}\n`;
                    if (point.characters) outlineText += `Characters: ${point.characters}\n`;
                    if (point.location) outlineText += `Location: ${point.location}\n`;
                    if (point.notes) outlineText += `Notes: ${point.notes}\n`;
                    outlineText += '\n' + '-'.repeat(30) + '\n\n';
                });
                dataFolder.file("plot-outline.txt", outlineText);
            }

            // Add research notes
            if (data.research && data.research.length > 0) {
                let researchText = "RESEARCH NOTES\n==============\n\n";
                data.research.forEach(note => {
                    researchText += `${note.title}\n${'-'.repeat(note.title.length)}\n`;
                    if (note.category) researchText += `Category: ${note.category}\n`;
                    if (note.source) researchText += `Source: ${note.source}\n`;
                    if (note.url) researchText += `URL: ${note.url}\n`;
                    researchText += `\n${note.content}\n\n`;
                    if (note.tags) researchText += `Tags: ${note.tags}\n`;
                    researchText += '\n' + '='.repeat(50) + '\n\n';
                });
                dataFolder.file("research-notes.txt", researchText);
            }

            // Add backup JSON
            dataFolder.file("backup-data.json", JSON.stringify(data, null, 2));

            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({type: "blob"});
            const url = URL.createObjectURL(zipBlob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `my-novel-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            document.querySelector('.modal-overlay')?.remove();
        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Error creating ZIP file. Please try again.');
        }
    }

    generateCompleteNovelText(chapters, scenes) {
        let novelText = `MY NOVEL\n`;
        novelText += `Generated on ${new Date().toLocaleDateString()}\n`;
        novelText += `Total Chapters: ${chapters.length}\n`;
        novelText += `Total Words: ${this.calculateTotalWords(chapters, scenes).toLocaleString()}\n\n`;
        novelText += `${'='.repeat(50)}\n\n`;

        chapters.sort((a, b) => a.order - b.order);

        for (const chapter of chapters) {
            novelText += `CHAPTER ${chapter.order + 1}: ${chapter.title.toUpperCase()}\n\n`;

            if (chapter.content) {
                novelText += chapter.content + '\n\n';
            }

            const chapterScenes = scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
            for (const scene of chapterScenes) {
                if (scene.content) {
                    novelText += `--- ${scene.title} ---\n\n`;
                    novelText += scene.content + '\n\n';
                }
            }

            novelText += `${'='.repeat(50)}\n\n`;
        }

        return novelText;
    }

    // Global Search Functionality
    showGlobalSearch() {
        const searchModal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input');

        searchModal.classList.remove('hidden');
        searchInput.focus();

        // Bind search events
        searchInput.addEventListener('input', this.performSearch.bind(this));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });
    }

    closeSearch() {
        const searchModal = document.getElementById('search-modal');
        searchModal.classList.add('hidden');

        // Clear search
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = `
            <div class="search-placeholder">
                Type to search across chapters, scenes, characters, and notes...
            </div>
        `;
    }

    async performSearch() {
        const query = document.getElementById('search-input').value.trim();
        const resultsContainer = document.getElementById('search-results');

        if (query.length < 2) {
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    Type at least 2 characters to search...
                </div>
            `;
            return;
        }

        try {
            const data = await storage.exportData();
            const results = [];

            // Search chapters
            (data.chapters || []).forEach(chapter => {
                if (this.matchesQuery(chapter.title, query) || this.matchesQuery(chapter.content, query)) {
                    results.push({
                        type: 'Chapter',
                        title: chapter.title,
                        content: this.getSearchSnippet(chapter.content || chapter.title, query),
                        id: chapter.id,
                        category: 'chapters'
                    });
                }
            });

            // Search scenes
            (data.scenes || []).forEach(scene => {
                if (this.matchesQuery(scene.title, query) || this.matchesQuery(scene.content, query)) {
                    const chapter = (data.chapters || []).find(c => c.id === scene.chapterId);
                    results.push({
                        type: 'Scene',
                        title: `${chapter?.title || 'Unknown'} > ${scene.title}`,
                        content: this.getSearchSnippet(scene.content || scene.title, query),
                        id: scene.id,
                        category: 'scenes'
                    });
                }
            });

            // Search characters
            (data.characters || []).forEach(character => {
                const searchText = `${character.name} ${character.description} ${character.personality} ${character.background}`;
                if (this.matchesQuery(searchText, query)) {
                    results.push({
                        type: 'Character',
                        title: character.name,
                        content: character.description || character.personality || 'Character profile',
                        id: character.id,
                        category: 'characters'
                    });
                }
            });

            // Search research
            (data.research || []).forEach(note => {
                const searchText = `${note.title} ${note.content} ${note.tags}`;
                if (this.matchesQuery(searchText, query)) {
                    results.push({
                        type: 'Research',
                        title: note.title,
                        content: this.getSearchSnippet(note.content, query),
                        id: note.id,
                        category: 'research'
                    });
                }
            });

            this.displaySearchResults(results, query);
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    Error performing search. Please try again.
                </div>
            `;
        }
    }

    matchesQuery(text, query) {
        if (!text) return false;
        return text.toLowerCase().includes(query.toLowerCase());
    }

    getSearchSnippet(text, query, maxLength = 150) {
        if (!text) return '';

        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);

        if (index === -1) return text.substring(0, maxLength) + '...';

        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 50);

        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        // Highlight the query
        const regex = new RegExp(`(${query})`, 'gi');
        snippet = snippet.replace(regex, '<span class="search-highlight">$1</span>');

        return snippet;
    }

    displaySearchResults(results, query) {
        const resultsContainer = document.getElementById('search-results');

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    No results found for "${query}"
                </div>
            `;
            return;
        }

        const resultsHTML = results.map(result => `
            <div class="search-result" onclick="app.goToSearchResult('${result.category}', ${result.id})">
                <div class="search-result-header">
                    <span class="search-result-title">${result.title}</span>
                    <span class="search-result-type">${result.type}</span>
                </div>
                <div class="search-result-content">${result.content}</div>
            </div>
        `).join('');

        resultsContainer.innerHTML = `
            <div style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"
            </div>
            ${resultsHTML}
        `;
    }

    goToSearchResult(category, id) {
        this.closeSearch();

        switch (category) {
            case 'chapters':
            case 'scenes':
                this.showView('writer');
                // Let the writer component handle loading the specific content
                if (this.components.writer) {
                    this.components.writer.loadSearchResult(category, id);
                }
                break;
            case 'characters':
                this.showView('characters');
                break;
            case 'research':
                this.showView('research');
                break;
        }
    }

    // Session Management
    showSessionModal() {
        const sessionModal = document.getElementById('session-modal');
        sessionModal.classList.remove('hidden');
    }

    closeSessionModal() {
        const sessionModal = document.getElementById('session-modal');
        sessionModal.classList.add('hidden');
    }

    startWritingSession() {
        const sessionType = document.querySelector('input[name="session-type"]:checked').value;

        if (sessionType === 'time') {
            const duration = parseInt(document.getElementById('time-duration').value);
            this.startTimerSession(duration);
        } else {
            const wordGoal = parseInt(document.getElementById('word-goal').value) || 500;
            this.startWordGoalSession(wordGoal);
        }

        this.closeSessionModal();
    }

    startTimerSession(minutes) {
        if (this.components.writer) {
            this.components.writer.startTimerSession(minutes);
        }
    }

    startWordGoalSession(wordGoal) {
        if (this.components.writer) {
            this.components.writer.startWordGoalSession(wordGoal);
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <h3>${title}</h3>
                ${content}
            </div>
        `;

        document.getElementById('modal-container').appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        return overlay;
    }

    // Method to show notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 4px;
            color: white;
            z-index: 1000;
            font-size: 0.9rem;
            background-color: ${type === 'error' ? 'var(--danger-color)' : 
                              type === 'success' ? 'var(--success-color)' : 
                              'var(--accent-color)'};
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NovelWriterApp();
});

// Make app globally accessible
window.NovelWriterApp = NovelWriterApp;
