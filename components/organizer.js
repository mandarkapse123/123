// Organizer Component - Chapter and scene management
class OrganizerComponent {
    constructor() {
        this.chapters = [];
        this.scenes = [];
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadData();
    }

    bindElements() {
        this.addChapterBtn = document.getElementById('add-chapter');
        this.projectTree = document.getElementById('project-tree');
    }

    bindEvents() {
        this.addChapterBtn.addEventListener('click', () => this.showAddChapterModal());
    }

    async loadData() {
        try {
            this.chapters = await storage.getChapters();
            await this.loadAllScenes();
            this.renderProjectTree();
        } catch (error) {
            console.error('Error loading organizer data:', error);
        }
    }

    async loadAllScenes() {
        this.scenes = [];
        for (const chapter of this.chapters) {
            const chapterScenes = await storage.getScenesByChapter(chapter.id);
            this.scenes.push(...chapterScenes);
        }
    }

    renderProjectTree() {
        this.projectTree.innerHTML = '';
        
        if (this.chapters.length === 0) {
            this.projectTree.innerHTML = `
                <div class="empty-state">
                    <p>No chapters yet. Click "Add Chapter" to get started!</p>
                </div>
            `;
            return;
        }

        const tree = document.createElement('div');
        tree.className = 'tree';

        this.chapters.forEach(chapter => {
            const chapterElement = this.createChapterElement(chapter);
            tree.appendChild(chapterElement);
        });

        this.projectTree.appendChild(tree);
    }

    createChapterElement(chapter) {
        const chapterScenes = this.scenes.filter(scene => scene.chapterId === chapter.id);
        
        const element = document.createElement('div');
        element.className = 'tree-item chapter-item';
        element.innerHTML = `
            <div class="tree-node">
                <div class="node-content">
                    <span class="node-icon">📖</span>
                    <span class="node-title">${chapter.title}</span>
                    <span class="node-stats">${this.getWordCount(chapter.content)} words</span>
                </div>
                <div class="node-actions">
                    <button class="action-btn" onclick="organizer.editChapter(${chapter.id})" title="Edit">✏️</button>
                    <button class="action-btn" onclick="organizer.addScene(${chapter.id})" title="Add Scene">➕</button>
                    <button class="action-btn" onclick="organizer.deleteChapter(${chapter.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="tree-children">
                ${chapterScenes.map(scene => this.createSceneElement(scene)).join('')}
            </div>
        `;

        return element;
    }

    createSceneElement(scene) {
        return `
            <div class="tree-item scene-item">
                <div class="tree-node">
                    <div class="node-content">
                        <span class="node-icon">🎬</span>
                        <span class="node-title">${scene.title}</span>
                        <span class="node-stats">${this.getWordCount(scene.content)} words</span>
                    </div>
                    <div class="node-actions">
                        <button class="action-btn" onclick="organizer.editScene(${scene.id})" title="Edit">✏️</button>
                        <button class="action-btn" onclick="organizer.deleteScene(${scene.id})" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }

    getWordCount(content) {
        if (!content) return 0;
        return content.trim() ? content.trim().split(/\s+/).length : 0;
    }

    showAddChapterModal() {
        const modal = this.createModal('Add Chapter', `
            <form id="chapter-form">
                <div class="form-group">
                    <label for="chapter-title">Title</label>
                    <input type="text" id="chapter-title" required>
                </div>
                <div class="form-group">
                    <label for="chapter-description">Description</label>
                    <textarea id="chapter-description" placeholder="Brief description of this chapter..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Chapter</button>
                </div>
            </form>
        `);

        modal.querySelector('#chapter-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addChapter(modal);
        });
    }

    async addChapter(modal) {
        const title = modal.querySelector('#chapter-title').value;
        const description = modal.querySelector('#chapter-description').value;

        if (!title.trim()) return;

        try {
            const chapter = {
                title: title.trim(),
                description: description.trim(),
                content: '',
                order: this.chapters.length,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            await storage.add('chapters', chapter);
            modal.remove();
            await this.loadData();
        } catch (error) {
            console.error('Error adding chapter:', error);
            alert('Error adding chapter. Please try again.');
        }
    }

    async editChapter(chapterId) {
        const chapter = await storage.get('chapters', chapterId);
        if (!chapter) return;

        const modal = this.createModal('Edit Chapter', `
            <form id="edit-chapter-form">
                <div class="form-group">
                    <label for="edit-chapter-title">Title</label>
                    <input type="text" id="edit-chapter-title" value="${chapter.title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-chapter-description">Description</label>
                    <textarea id="edit-chapter-description">${chapter.description || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Chapter</button>
                </div>
            </form>
        `);

        modal.querySelector('#edit-chapter-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            chapter.title = modal.querySelector('#edit-chapter-title').value.trim();
            chapter.description = modal.querySelector('#edit-chapter-description').value.trim();
            chapter.lastModified = new Date().toISOString();

            try {
                await storage.update('chapters', chapter);
                modal.remove();
                await this.loadData();
            } catch (error) {
                console.error('Error updating chapter:', error);
                alert('Error updating chapter. Please try again.');
            }
        });
    }

    async deleteChapter(chapterId) {
        if (!confirm('Are you sure you want to delete this chapter and all its scenes?')) return;

        try {
            // Delete all scenes in this chapter
            const scenes = await storage.getScenesByChapter(chapterId);
            for (const scene of scenes) {
                await storage.delete('scenes', scene.id);
            }

            // Delete the chapter
            await storage.delete('chapters', chapterId);
            await this.loadData();
        } catch (error) {
            console.error('Error deleting chapter:', error);
            alert('Error deleting chapter. Please try again.');
        }
    }

    addScene(chapterId) {
        const modal = this.createModal('Add Scene', `
            <form id="scene-form">
                <div class="form-group">
                    <label for="scene-title">Title</label>
                    <input type="text" id="scene-title" required>
                </div>
                <div class="form-group">
                    <label for="scene-description">Description</label>
                    <textarea id="scene-description" placeholder="Brief description of this scene..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Scene</button>
                </div>
            </form>
        `);

        modal.querySelector('#scene-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = modal.querySelector('#scene-title').value;
            const description = modal.querySelector('#scene-description').value;

            if (!title.trim()) return;

            try {
                const chapterScenes = await storage.getScenesByChapter(chapterId);
                const scene = {
                    title: title.trim(),
                    description: description.trim(),
                    content: '',
                    chapterId: chapterId,
                    order: chapterScenes.length,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };

                await storage.add('scenes', scene);
                modal.remove();
                await this.loadData();
            } catch (error) {
                console.error('Error adding scene:', error);
                alert('Error adding scene. Please try again.');
            }
        });
    }

    async editScene(sceneId) {
        const scene = await storage.get('scenes', sceneId);
        if (!scene) return;

        const modal = this.createModal('Edit Scene', `
            <form id="edit-scene-form">
                <div class="form-group">
                    <label for="edit-scene-title">Title</label>
                    <input type="text" id="edit-scene-title" value="${scene.title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-scene-description">Description</label>
                    <textarea id="edit-scene-description">${scene.description || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Scene</button>
                </div>
            </form>
        `);

        modal.querySelector('#edit-scene-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            scene.title = modal.querySelector('#edit-scene-title').value.trim();
            scene.description = modal.querySelector('#edit-scene-description').value.trim();
            scene.lastModified = new Date().toISOString();

            try {
                await storage.update('scenes', scene);
                modal.remove();
                await this.loadData();
            } catch (error) {
                console.error('Error updating scene:', error);
                alert('Error updating scene. Please try again.');
            }
        });
    }

    async deleteScene(sceneId) {
        if (!confirm('Are you sure you want to delete this scene?')) return;

        try {
            await storage.delete('scenes', sceneId);
            await this.loadData();
        } catch (error) {
            console.error('Error deleting scene:', error);
            alert('Error deleting scene. Please try again.');
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
}

// Initialize organizer component
window.OrganizerComponent = OrganizerComponent;
