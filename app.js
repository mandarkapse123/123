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
        // Wait for storage to be ready
        let attempts = 0;
        while (!window.storage && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.storage) {
            console.error('Storage failed to initialize');
            alert('Failed to initialize storage. Some features may not work properly.');
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
            
            const modal = this.createModal('Export Data', `
                <div class="export-options">
                    <h4>Export Options</h4>
                    <div class="form-group">
                        <button class="btn-primary" onclick="app.exportAsJSON()">Export as JSON</button>
                        <p><small>Download all your data as a JSON file for backup or transfer</small></p>
                    </div>
                    <div class="form-group">
                        <button class="btn-secondary" onclick="app.exportCurrentContent()">Export Current Writing</button>
                        <p><small>Export only the current chapter/scene as a text file</small></p>
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

    exportCurrentContent() {
        if (this.components.writer) {
            this.components.writer.exportCurrentContent();
            // Close modal
            document.querySelector('.modal-overlay')?.remove();
        }
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
