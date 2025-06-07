// Research Component - Research notes management
class ResearchComponent {
    constructor() {
        this.research = [];
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadResearch();
    }

    bindElements() {
        this.addResearchBtn = document.getElementById('add-research');
        this.researchGrid = document.getElementById('research-grid');
    }

    bindEvents() {
        this.addResearchBtn.addEventListener('click', () => this.showAddResearchModal());
    }

    async loadResearch() {
        try {
            this.research = await storage.getAll('research');
            this.renderResearch();
        } catch (error) {
            console.error('Error loading research:', error);
        }
    }

    renderResearch() {
        this.researchGrid.innerHTML = '';

        if (this.research.length === 0) {
            this.researchGrid.innerHTML = `
                <div class="empty-state">
                    <p>No research notes yet. Click "Add Note" to start collecting research!</p>
                </div>
            `;
            return;
        }

        this.research.forEach(note => {
            const card = this.createResearchCard(note);
            this.researchGrid.appendChild(card);
        });
    }

    createResearchCard(note) {
        const card = document.createElement('div');
        card.className = 'card research-card';
        card.innerHTML = `
            <div class="research-header">
                <h3>${note.title}</h3>
                <div class="research-actions">
                    <button class="action-btn" onclick="research.editResearch(${note.id})" title="Edit">✏️</button>
                    <button class="action-btn" onclick="research.deleteResearch(${note.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="research-info">
                ${note.category ? `<span class="research-category">${note.category}</span>` : ''}
                ${note.source ? `<p><strong>Source:</strong> ${note.source}</p>` : ''}
                ${note.url ? `<p><strong>URL:</strong> <a href="${note.url}" target="_blank">${note.url}</a></p>` : ''}
            </div>
            <div class="research-content">
                ${note.content ? `<p>${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p>` : ''}
            </div>
            ${note.tags ? `<div class="research-tags">${note.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}</div>` : ''}
            <div class="research-meta">
                <small>Created: ${new Date(note.createdAt).toLocaleDateString()}</small>
            </div>
        `;

        return card;
    }

    showAddResearchModal() {
        const modal = this.createModal('Add Research Note', `
            <form id="research-form">
                <div class="form-group">
                    <label for="research-title">Title *</label>
                    <input type="text" id="research-title" required placeholder="Research topic or title">
                </div>
                <div class="form-group">
                    <label for="research-category">Category</label>
                    <select id="research-category">
                        <option value="">Select category...</option>
                        <option value="Historical">Historical</option>
                        <option value="Scientific">Scientific</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Geographic">Geographic</option>
                        <option value="Technical">Technical</option>
                        <option value="Character">Character Research</option>
                        <option value="Plot">Plot Research</option>
                        <option value="Setting">Setting</option>
                        <option value="Language">Language</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="research-source">Source</label>
                    <input type="text" id="research-source" placeholder="Book, website, person, etc.">
                </div>
                <div class="form-group">
                    <label for="research-url">URL</label>
                    <input type="url" id="research-url" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label for="research-content">Content *</label>
                    <textarea id="research-content" required placeholder="Your research notes, quotes, facts, etc."></textarea>
                </div>
                <div class="form-group">
                    <label for="research-tags">Tags</label>
                    <input type="text" id="research-tags" placeholder="Comma-separated tags (e.g., medieval, weapons, combat)">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Note</button>
                </div>
            </form>
        `);

        modal.querySelector('#research-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addResearch(modal);
        });
    }

    async addResearch(modal) {
        const title = modal.querySelector('#research-title').value.trim();
        const content = modal.querySelector('#research-content').value.trim();

        if (!title || !content) return;

        try {
            const note = {
                title,
                category: modal.querySelector('#research-category').value,
                source: modal.querySelector('#research-source').value.trim(),
                url: modal.querySelector('#research-url').value.trim(),
                content,
                tags: modal.querySelector('#research-tags').value.trim(),
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            await storage.add('research', note);
            modal.remove();
            await this.loadResearch();
        } catch (error) {
            console.error('Error adding research note:', error);
            alert('Error adding research note. Please try again.');
        }
    }

    async editResearch(researchId) {
        const note = await storage.get('research', researchId);
        if (!note) return;

        const modal = this.createModal('Edit Research Note', `
            <form id="edit-research-form">
                <div class="form-group">
                    <label for="edit-research-title">Title *</label>
                    <input type="text" id="edit-research-title" value="${note.title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-research-category">Category</label>
                    <select id="edit-research-category">
                        <option value="">Select category...</option>
                        <option value="Historical" ${note.category === 'Historical' ? 'selected' : ''}>Historical</option>
                        <option value="Scientific" ${note.category === 'Scientific' ? 'selected' : ''}>Scientific</option>
                        <option value="Cultural" ${note.category === 'Cultural' ? 'selected' : ''}>Cultural</option>
                        <option value="Geographic" ${note.category === 'Geographic' ? 'selected' : ''}>Geographic</option>
                        <option value="Technical" ${note.category === 'Technical' ? 'selected' : ''}>Technical</option>
                        <option value="Character" ${note.category === 'Character' ? 'selected' : ''}>Character Research</option>
                        <option value="Plot" ${note.category === 'Plot' ? 'selected' : ''}>Plot Research</option>
                        <option value="Setting" ${note.category === 'Setting' ? 'selected' : ''}>Setting</option>
                        <option value="Language" ${note.category === 'Language' ? 'selected' : ''}>Language</option>
                        <option value="Other" ${note.category === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-research-source">Source</label>
                    <input type="text" id="edit-research-source" value="${note.source || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-research-url">URL</label>
                    <input type="url" id="edit-research-url" value="${note.url || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-research-content">Content *</label>
                    <textarea id="edit-research-content" required>${note.content}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-research-tags">Tags</label>
                    <input type="text" id="edit-research-tags" value="${note.tags || ''}">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Note</button>
                </div>
            </form>
        `);

        modal.querySelector('#edit-research-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            note.title = modal.querySelector('#edit-research-title').value.trim();
            note.category = modal.querySelector('#edit-research-category').value;
            note.source = modal.querySelector('#edit-research-source').value.trim();
            note.url = modal.querySelector('#edit-research-url').value.trim();
            note.content = modal.querySelector('#edit-research-content').value.trim();
            note.tags = modal.querySelector('#edit-research-tags').value.trim();
            note.lastModified = new Date().toISOString();

            try {
                await storage.update('research', note);
                modal.remove();
                await this.loadResearch();
            } catch (error) {
                console.error('Error updating research note:', error);
                alert('Error updating research note. Please try again.');
            }
        });
    }

    async deleteResearch(researchId) {
        if (!confirm('Are you sure you want to delete this research note?')) return;

        try {
            await storage.delete('research', researchId);
            await this.loadResearch();
        } catch (error) {
            console.error('Error deleting research note:', error);
            alert('Error deleting research note. Please try again.');
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

// Initialize research component
window.ResearchComponent = ResearchComponent;
