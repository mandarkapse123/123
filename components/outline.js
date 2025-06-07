// Outline Component - Plot outline tools
class OutlineComponent {
    constructor() {
        this.plotPoints = [];
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadPlotPoints();
    }

    bindElements() {
        this.addPlotPointBtn = document.getElementById('add-plot-point');
        this.outlineBoard = document.getElementById('outline-board');
    }

    bindEvents() {
        this.addPlotPointBtn.addEventListener('click', () => this.showAddPlotPointModal());
    }

    async loadPlotPoints() {
        try {
            this.plotPoints = await storage.getPlotPoints();
            this.renderOutline();
        } catch (error) {
            console.error('Error loading plot points:', error);
        }
    }

    renderOutline() {
        this.outlineBoard.innerHTML = '';

        if (this.plotPoints.length === 0) {
            this.outlineBoard.innerHTML = `
                <div class="empty-state">
                    <p>No plot points yet. Click "Add Plot Point" to start outlining your story!</p>
                </div>
            `;
            return;
        }

        const outline = document.createElement('div');
        outline.className = 'outline-container';

        // Group plot points by act/section
        const acts = this.groupPlotPointsByAct();
        
        acts.forEach((act, index) => {
            const actElement = this.createActElement(act, index + 1);
            outline.appendChild(actElement);
        });

        this.outlineBoard.appendChild(outline);
    }

    groupPlotPointsByAct() {
        const acts = [];
        let currentAct = [];
        
        this.plotPoints.forEach(point => {
            if (point.type === 'act-break' && currentAct.length > 0) {
                acts.push([...currentAct]);
                currentAct = [point];
            } else {
                currentAct.push(point);
            }
        });
        
        if (currentAct.length > 0) {
            acts.push(currentAct);
        }
        
        // If no acts defined, put everything in Act 1
        if (acts.length === 0 && this.plotPoints.length > 0) {
            acts.push(this.plotPoints);
        }
        
        return acts;
    }

    createActElement(plotPoints, actNumber) {
        const actDiv = document.createElement('div');
        actDiv.className = 'act-section';
        
        const actHeader = document.createElement('div');
        actHeader.className = 'act-header';
        actHeader.innerHTML = `<h3>Act ${actNumber}</h3>`;
        
        const plotPointsList = document.createElement('div');
        plotPointsList.className = 'plot-points-list';
        
        plotPoints.forEach(point => {
            if (point.type !== 'act-break') {
                const pointElement = this.createPlotPointElement(point);
                plotPointsList.appendChild(pointElement);
            }
        });
        
        actDiv.appendChild(actHeader);
        actDiv.appendChild(plotPointsList);
        
        return actDiv;
    }

    createPlotPointElement(plotPoint) {
        const element = document.createElement('div');
        element.className = `plot-point ${plotPoint.type}`;
        element.innerHTML = `
            <div class="plot-point-header">
                <span class="plot-point-type">${this.getPlotPointTypeLabel(plotPoint.type)}</span>
                <div class="plot-point-actions">
                    <button class="action-btn" onclick="outline.editPlotPoint(${plotPoint.id})" title="Edit">✏️</button>
                    <button class="action-btn" onclick="outline.deletePlotPoint(${plotPoint.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="plot-point-content">
                <h4>${plotPoint.title}</h4>
                ${plotPoint.description ? `<p>${plotPoint.description}</p>` : ''}
                ${plotPoint.characters ? `<div class="plot-characters"><strong>Characters:</strong> ${plotPoint.characters}</div>` : ''}
                ${plotPoint.location ? `<div class="plot-location"><strong>Location:</strong> ${plotPoint.location}</div>` : ''}
                ${plotPoint.notes ? `<div class="plot-notes"><strong>Notes:</strong> ${plotPoint.notes}</div>` : ''}
            </div>
        `;

        return element;
    }

    getPlotPointTypeLabel(type) {
        const labels = {
            'inciting-incident': '🎯 Inciting Incident',
            'plot-point-1': '📈 Plot Point 1',
            'midpoint': '⚖️ Midpoint',
            'plot-point-2': '📉 Plot Point 2',
            'climax': '🔥 Climax',
            'resolution': '✅ Resolution',
            'scene': '🎬 Scene',
            'character-arc': '👤 Character Arc',
            'subplot': '🔀 Subplot',
            'other': '📝 Other'
        };
        return labels[type] || '📝 Plot Point';
    }

    showAddPlotPointModal() {
        const modal = this.createModal('Add Plot Point', `
            <form id="plot-point-form">
                <div class="form-group">
                    <label for="plot-point-title">Title *</label>
                    <input type="text" id="plot-point-title" required>
                </div>
                <div class="form-group">
                    <label for="plot-point-type">Type</label>
                    <select id="plot-point-type">
                        <option value="scene">Scene</option>
                        <option value="inciting-incident">Inciting Incident</option>
                        <option value="plot-point-1">Plot Point 1</option>
                        <option value="midpoint">Midpoint</option>
                        <option value="plot-point-2">Plot Point 2</option>
                        <option value="climax">Climax</option>
                        <option value="resolution">Resolution</option>
                        <option value="character-arc">Character Arc</option>
                        <option value="subplot">Subplot</option>
                        <option value="act-break">Act Break</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="plot-point-description">Description</label>
                    <textarea id="plot-point-description" placeholder="What happens in this plot point?"></textarea>
                </div>
                <div class="form-group">
                    <label for="plot-point-characters">Characters Involved</label>
                    <input type="text" id="plot-point-characters" placeholder="List main characters in this scene">
                </div>
                <div class="form-group">
                    <label for="plot-point-location">Location</label>
                    <input type="text" id="plot-point-location" placeholder="Where does this take place?">
                </div>
                <div class="form-group">
                    <label for="plot-point-notes">Notes</label>
                    <textarea id="plot-point-notes" placeholder="Additional notes, ideas, or reminders..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Plot Point</button>
                </div>
            </form>
        `);

        modal.querySelector('#plot-point-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPlotPoint(modal);
        });
    }

    async addPlotPoint(modal) {
        const title = modal.querySelector('#plot-point-title').value.trim();
        if (!title) return;

        try {
            const plotPoint = {
                title,
                type: modal.querySelector('#plot-point-type').value,
                description: modal.querySelector('#plot-point-description').value.trim(),
                characters: modal.querySelector('#plot-point-characters').value.trim(),
                location: modal.querySelector('#plot-point-location').value.trim(),
                notes: modal.querySelector('#plot-point-notes').value.trim(),
                order: this.plotPoints.length,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            await storage.add('plotPoints', plotPoint);
            modal.remove();
            await this.loadPlotPoints();
        } catch (error) {
            console.error('Error adding plot point:', error);
            alert('Error adding plot point. Please try again.');
        }
    }

    async editPlotPoint(plotPointId) {
        const plotPoint = await storage.get('plotPoints', plotPointId);
        if (!plotPoint) return;

        const modal = this.createModal('Edit Plot Point', `
            <form id="edit-plot-point-form">
                <div class="form-group">
                    <label for="edit-plot-point-title">Title *</label>
                    <input type="text" id="edit-plot-point-title" value="${plotPoint.title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-plot-point-type">Type</label>
                    <select id="edit-plot-point-type">
                        <option value="scene" ${plotPoint.type === 'scene' ? 'selected' : ''}>Scene</option>
                        <option value="inciting-incident" ${plotPoint.type === 'inciting-incident' ? 'selected' : ''}>Inciting Incident</option>
                        <option value="plot-point-1" ${plotPoint.type === 'plot-point-1' ? 'selected' : ''}>Plot Point 1</option>
                        <option value="midpoint" ${plotPoint.type === 'midpoint' ? 'selected' : ''}>Midpoint</option>
                        <option value="plot-point-2" ${plotPoint.type === 'plot-point-2' ? 'selected' : ''}>Plot Point 2</option>
                        <option value="climax" ${plotPoint.type === 'climax' ? 'selected' : ''}>Climax</option>
                        <option value="resolution" ${plotPoint.type === 'resolution' ? 'selected' : ''}>Resolution</option>
                        <option value="character-arc" ${plotPoint.type === 'character-arc' ? 'selected' : ''}>Character Arc</option>
                        <option value="subplot" ${plotPoint.type === 'subplot' ? 'selected' : ''}>Subplot</option>
                        <option value="act-break" ${plotPoint.type === 'act-break' ? 'selected' : ''}>Act Break</option>
                        <option value="other" ${plotPoint.type === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-plot-point-description">Description</label>
                    <textarea id="edit-plot-point-description">${plotPoint.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-plot-point-characters">Characters Involved</label>
                    <input type="text" id="edit-plot-point-characters" value="${plotPoint.characters || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-plot-point-location">Location</label>
                    <input type="text" id="edit-plot-point-location" value="${plotPoint.location || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-plot-point-notes">Notes</label>
                    <textarea id="edit-plot-point-notes">${plotPoint.notes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Plot Point</button>
                </div>
            </form>
        `);

        modal.querySelector('#edit-plot-point-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            plotPoint.title = modal.querySelector('#edit-plot-point-title').value.trim();
            plotPoint.type = modal.querySelector('#edit-plot-point-type').value;
            plotPoint.description = modal.querySelector('#edit-plot-point-description').value.trim();
            plotPoint.characters = modal.querySelector('#edit-plot-point-characters').value.trim();
            plotPoint.location = modal.querySelector('#edit-plot-point-location').value.trim();
            plotPoint.notes = modal.querySelector('#edit-plot-point-notes').value.trim();
            plotPoint.lastModified = new Date().toISOString();

            try {
                await storage.update('plotPoints', plotPoint);
                modal.remove();
                await this.loadPlotPoints();
            } catch (error) {
                console.error('Error updating plot point:', error);
                alert('Error updating plot point. Please try again.');
            }
        });
    }

    async deletePlotPoint(plotPointId) {
        if (!confirm('Are you sure you want to delete this plot point?')) return;

        try {
            await storage.delete('plotPoints', plotPointId);
            await this.loadPlotPoints();
        } catch (error) {
            console.error('Error deleting plot point:', error);
            alert('Error deleting plot point. Please try again.');
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

// Initialize outline component
window.OutlineComponent = OutlineComponent;
