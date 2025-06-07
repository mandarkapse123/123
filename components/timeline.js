// Timeline Component - Timeline management
class TimelineComponent {
    constructor() {
        this.events = [];
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadEvents();
    }

    bindElements() {
        this.addEventBtn = document.getElementById('add-event');
        this.timelineBoard = document.getElementById('timeline-board');
    }

    bindEvents() {
        this.addEventBtn.addEventListener('click', () => this.showAddEventModal());
    }

    async loadEvents() {
        try {
            this.events = await storage.getTimelineEvents();
            this.renderTimeline();
        } catch (error) {
            console.error('Error loading timeline events:', error);
        }
    }

    renderTimeline() {
        this.timelineBoard.innerHTML = '';

        if (this.events.length === 0) {
            this.timelineBoard.innerHTML = `
                <div class="empty-state">
                    <p>No timeline events yet. Click "Add Event" to start building your story timeline!</p>
                </div>
            `;
            return;
        }

        const timeline = document.createElement('div');
        timeline.className = 'timeline';

        this.events.forEach((event, index) => {
            const eventElement = this.createEventElement(event, index);
            timeline.appendChild(eventElement);
        });

        this.timelineBoard.appendChild(timeline);
    }

    createEventElement(event, index) {
        const element = document.createElement('div');
        element.className = 'timeline-event';
        element.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="event-header">
                    <h4>${event.title}</h4>
                    <div class="event-actions">
                        <button class="action-btn" onclick="timeline.editEvent(${event.id})" title="Edit">✏️</button>
                        <button class="action-btn" onclick="timeline.deleteEvent(${event.id})" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="event-date">${this.formatDate(event.date)}</div>
                ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                ${event.characters ? `<div class="event-characters"><strong>Characters:</strong> ${event.characters}</div>` : ''}
                ${event.location ? `<div class="event-location"><strong>Location:</strong> ${event.location}</div>` : ''}
                ${event.importance ? `<div class="event-importance importance-${event.importance}"><strong>Importance:</strong> ${event.importance}</div>` : ''}
                ${event.notes ? `<div class="event-notes"><strong>Notes:</strong> ${event.notes}</div>` : ''}
            </div>
        `;

        return element;
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown Date';
        
        // Handle different date formats
        if (dateString.includes('/') || dateString.includes('-')) {
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString();
            } catch (e) {
                return dateString;
            }
        }
        
        return dateString; // Return as-is for fictional dates
    }

    showAddEventModal() {
        const modal = this.createModal('Add Timeline Event', `
            <form id="event-form">
                <div class="form-group">
                    <label for="event-title">Event Title *</label>
                    <input type="text" id="event-title" required placeholder="What happens?">
                </div>
                <div class="form-group">
                    <label for="event-date">Date *</label>
                    <input type="text" id="event-date" required placeholder="e.g., 2023-05-15, Spring 1847, Day 3 of journey">
                    <small>You can use real dates or fictional timeline references</small>
                </div>
                <div class="form-group">
                    <label for="event-description">Description</label>
                    <textarea id="event-description" placeholder="Detailed description of what happens..."></textarea>
                </div>
                <div class="form-group">
                    <label for="event-characters">Characters Involved</label>
                    <input type="text" id="event-characters" placeholder="List main characters present">
                </div>
                <div class="form-group">
                    <label for="event-location">Location</label>
                    <input type="text" id="event-location" placeholder="Where does this event take place?">
                </div>
                <div class="form-group">
                    <label for="event-importance">Importance</label>
                    <select id="event-importance">
                        <option value="">Select importance...</option>
                        <option value="low">Low - Minor event</option>
                        <option value="medium">Medium - Significant event</option>
                        <option value="high">High - Major plot point</option>
                        <option value="critical">Critical - Turning point</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="event-notes">Additional Notes</label>
                    <textarea id="event-notes" placeholder="Any additional information, connections, or reminders..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Event</button>
                </div>
            </form>
        `);

        modal.querySelector('#event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent(modal);
        });
    }

    async addEvent(modal) {
        const title = modal.querySelector('#event-title').value.trim();
        const date = modal.querySelector('#event-date').value.trim();

        if (!title || !date) return;

        try {
            const event = {
                title,
                date,
                description: modal.querySelector('#event-description').value.trim(),
                characters: modal.querySelector('#event-characters').value.trim(),
                location: modal.querySelector('#event-location').value.trim(),
                importance: modal.querySelector('#event-importance').value,
                notes: modal.querySelector('#event-notes').value.trim(),
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            await storage.add('timeline', event);
            modal.remove();
            await this.loadEvents();
        } catch (error) {
            console.error('Error adding timeline event:', error);
            alert('Error adding timeline event. Please try again.');
        }
    }

    async editEvent(eventId) {
        const event = await storage.get('timeline', eventId);
        if (!event) return;

        const modal = this.createModal('Edit Timeline Event', `
            <form id="edit-event-form">
                <div class="form-group">
                    <label for="edit-event-title">Event Title *</label>
                    <input type="text" id="edit-event-title" value="${event.title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-event-date">Date *</label>
                    <input type="text" id="edit-event-date" value="${event.date}" required>
                    <small>You can use real dates or fictional timeline references</small>
                </div>
                <div class="form-group">
                    <label for="edit-event-description">Description</label>
                    <textarea id="edit-event-description">${event.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-event-characters">Characters Involved</label>
                    <input type="text" id="edit-event-characters" value="${event.characters || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-event-location">Location</label>
                    <input type="text" id="edit-event-location" value="${event.location || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-event-importance">Importance</label>
                    <select id="edit-event-importance">
                        <option value="">Select importance...</option>
                        <option value="low" ${event.importance === 'low' ? 'selected' : ''}>Low - Minor event</option>
                        <option value="medium" ${event.importance === 'medium' ? 'selected' : ''}>Medium - Significant event</option>
                        <option value="high" ${event.importance === 'high' ? 'selected' : ''}>High - Major plot point</option>
                        <option value="critical" ${event.importance === 'critical' ? 'selected' : ''}>Critical - Turning point</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-event-notes">Additional Notes</label>
                    <textarea id="edit-event-notes">${event.notes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Event</button>
                </div>
            </form>
        `);

        modal.querySelector('#edit-event-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            event.title = modal.querySelector('#edit-event-title').value.trim();
            event.date = modal.querySelector('#edit-event-date').value.trim();
            event.description = modal.querySelector('#edit-event-description').value.trim();
            event.characters = modal.querySelector('#edit-event-characters').value.trim();
            event.location = modal.querySelector('#edit-event-location').value.trim();
            event.importance = modal.querySelector('#edit-event-importance').value;
            event.notes = modal.querySelector('#edit-event-notes').value.trim();
            event.lastModified = new Date().toISOString();

            try {
                await storage.update('timeline', event);
                modal.remove();
                await this.loadEvents();
            } catch (error) {
                console.error('Error updating timeline event:', error);
                alert('Error updating timeline event. Please try again.');
            }
        });
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this timeline event?')) return;

        try {
            await storage.delete('timeline', eventId);
            await this.loadEvents();
        } catch (error) {
            console.error('Error deleting timeline event:', error);
            alert('Error deleting timeline event. Please try again.');
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

// Initialize timeline component
window.TimelineComponent = TimelineComponent;
