// Characters Component - Character profiles and tracking
class CharactersComponent {
    constructor() {
        this.characters = [];
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadCharacters();
    }

    bindElements() {
        this.addCharacterBtn = document.getElementById('add-character');
        this.charactersGrid = document.getElementById('characters-grid');
    }

    bindEvents() {
        this.addCharacterBtn.addEventListener('click', () => this.showAddCharacterModal());
    }

    async loadCharacters() {
        try {
            this.characters = await storage.getAll('characters');
            this.renderCharacters();
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    }

    renderCharacters() {
        this.charactersGrid.innerHTML = '';

        if (this.characters.length === 0) {
            this.charactersGrid.innerHTML = `
                <div class="empty-state">
                    <p>No characters yet. Click "Add Character" to create your first character!</p>
                </div>
            `;
            return;
        }

        this.characters.forEach(character => {
            const card = this.createCharacterCard(character);
            this.charactersGrid.appendChild(card);
        });
    }

    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'card character-card';
        card.innerHTML = `
            <div class="character-header">
                <h3>${character.name}</h3>
                <div class="character-actions">
                    <button class="action-btn" onclick="characters.editCharacter(${character.id})" title="Edit">✏️</button>
                    <button class="action-btn" onclick="characters.deleteCharacter(${character.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="character-info">
                ${character.role ? `<p><strong>Role:</strong> ${character.role}</p>` : ''}
                ${character.age ? `<p><strong>Age:</strong> ${character.age}</p>` : ''}
                ${character.description ? `<p><strong>Description:</strong> ${character.description}</p>` : ''}
            </div>
            <div class="character-details">
                ${character.appearance ? `<div class="detail-section"><strong>Appearance:</strong><p>${character.appearance}</p></div>` : ''}
                ${character.personality ? `<div class="detail-section"><strong>Personality:</strong><p>${character.personality}</p></div>` : ''}
                ${character.background ? `<div class="detail-section"><strong>Background:</strong><p>${character.background}</p></div>` : ''}
                ${character.goals ? `<div class="detail-section"><strong>Goals:</strong><p>${character.goals}</p></div>` : ''}
                ${character.relationships ? `<div class="detail-section"><strong>Relationships:</strong><p>${character.relationships}</p></div>` : ''}
            </div>
            ${character.notes ? `<div class="character-notes"><strong>Notes:</strong><p>${character.notes}</p></div>` : ''}
        `;

        return card;
    }

    showAddCharacterModal() {
        const modal = this.createModal('Add Character', `
            <form id="character-form">
                <div class="form-group">
                    <label for="character-name">Name *</label>
                    <input type="text" id="character-name" required>
                </div>
                <div class="form-group">
                    <label for="character-role">Role</label>
                    <select id="character-role">
                        <option value="">Select role...</option>
                        <option value="Protagonist">Protagonist</option>
                        <option value="Antagonist">Antagonist</option>
                        <option value="Supporting">Supporting Character</option>
                        <option value="Minor">Minor Character</option>
                        <option value="Love Interest">Love Interest</option>
                        <option value="Mentor">Mentor</option>
                        <option value="Sidekick">Sidekick</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="character-age">Age</label>
                    <input type="text" id="character-age" placeholder="e.g., 25, Early 30s, Ancient">
                </div>
                <div class="form-group">
                    <label for="character-description">Brief Description</label>
                    <textarea id="character-description" placeholder="One-line character description..."></textarea>
                </div>
                <div class="form-group">
                    <label for="character-appearance">Appearance</label>
                    <textarea id="character-appearance" placeholder="Physical description..."></textarea>
                </div>
                <div class="form-group">
                    <label for="character-personality">Personality</label>
                    <textarea id="character-personality" placeholder="Personality traits, quirks, mannerisms..."></textarea>
                </div>
                <div class="form-group">
                    <label for="character-background">Background</label>
                    <textarea id="character-background" placeholder="History, origin, important events..."></textarea>
                </div>
                <div class="form-group">
                    <label for="character-goals">Goals & Motivations</label>
                    <textarea id="character-goals" placeholder="What does this character want? Why?"></textarea>
                </div>
                <div class="form-group">
                    <label for="character-relationships">Relationships</label>
                    <textarea id="character-relationships" placeholder="Relationships with other characters..."></textarea>
                </div>
                <div class="form-group">
                    <label for="character-notes">Additional Notes</label>
                    <textarea id="character-notes" placeholder="Any other important information..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Character</button>
                </div>
            </form>
        `);

        modal.querySelector('#character-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCharacter(modal);
        });
    }

    async addCharacter(modal) {
        const formData = new FormData(modal.querySelector('#character-form'));
        const name = modal.querySelector('#character-name').value.trim();

        if (!name) return;

        try {
            const character = {
                name,
                role: modal.querySelector('#character-role').value,
                age: modal.querySelector('#character-age').value.trim(),
                description: modal.querySelector('#character-description').value.trim(),
                appearance: modal.querySelector('#character-appearance').value.trim(),
                personality: modal.querySelector('#character-personality').value.trim(),
                background: modal.querySelector('#character-background').value.trim(),
                goals: modal.querySelector('#character-goals').value.trim(),
                relationships: modal.querySelector('#character-relationships').value.trim(),
                notes: modal.querySelector('#character-notes').value.trim(),
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            await storage.add('characters', character);
            modal.remove();
            await this.loadCharacters();
        } catch (error) {
            console.error('Error adding character:', error);
            alert('Error adding character. Please try again.');
        }
    }

    async editCharacter(characterId) {
        const character = await storage.get('characters', characterId);
        if (!character) return;

        const modal = this.createModal('Edit Character', `
            <form id="edit-character-form">
                <div class="form-group">
                    <label for="edit-character-name">Name *</label>
                    <input type="text" id="edit-character-name" value="${character.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-character-role">Role</label>
                    <select id="edit-character-role">
                        <option value="">Select role...</option>
                        <option value="Protagonist" ${character.role === 'Protagonist' ? 'selected' : ''}>Protagonist</option>
                        <option value="Antagonist" ${character.role === 'Antagonist' ? 'selected' : ''}>Antagonist</option>
                        <option value="Supporting" ${character.role === 'Supporting' ? 'selected' : ''}>Supporting Character</option>
                        <option value="Minor" ${character.role === 'Minor' ? 'selected' : ''}>Minor Character</option>
                        <option value="Love Interest" ${character.role === 'Love Interest' ? 'selected' : ''}>Love Interest</option>
                        <option value="Mentor" ${character.role === 'Mentor' ? 'selected' : ''}>Mentor</option>
                        <option value="Sidekick" ${character.role === 'Sidekick' ? 'selected' : ''}>Sidekick</option>
                        <option value="Other" ${character.role === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-character-age">Age</label>
                    <input type="text" id="edit-character-age" value="${character.age || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-character-description">Brief Description</label>
                    <textarea id="edit-character-description">${character.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-character-appearance">Appearance</label>
                    <textarea id="edit-character-appearance">${character.appearance || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-character-personality">Personality</label>
                    <textarea id="edit-character-personality">${character.personality || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-character-background">Background</label>
                    <textarea id="edit-character-background">${character.background || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-character-goals">Goals & Motivations</label>
                    <textarea id="edit-character-goals">${character.goals || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-character-relationships">Relationships</label>
                    <textarea id="edit-character-relationships">${character.relationships || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-character-notes">Additional Notes</label>
                    <textarea id="edit-character-notes">${character.notes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Character</button>
                </div>
            </form>
        `);

        modal.querySelector('#edit-character-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            character.name = modal.querySelector('#edit-character-name').value.trim();
            character.role = modal.querySelector('#edit-character-role').value;
            character.age = modal.querySelector('#edit-character-age').value.trim();
            character.description = modal.querySelector('#edit-character-description').value.trim();
            character.appearance = modal.querySelector('#edit-character-appearance').value.trim();
            character.personality = modal.querySelector('#edit-character-personality').value.trim();
            character.background = modal.querySelector('#edit-character-background').value.trim();
            character.goals = modal.querySelector('#edit-character-goals').value.trim();
            character.relationships = modal.querySelector('#edit-character-relationships').value.trim();
            character.notes = modal.querySelector('#edit-character-notes').value.trim();
            character.lastModified = new Date().toISOString();

            try {
                await storage.update('characters', character);
                modal.remove();
                await this.loadCharacters();
            } catch (error) {
                console.error('Error updating character:', error);
                alert('Error updating character. Please try again.');
            }
        });
    }

    async deleteCharacter(characterId) {
        if (!confirm('Are you sure you want to delete this character?')) return;

        try {
            await storage.delete('characters', characterId);
            await this.loadCharacters();
        } catch (error) {
            console.error('Error deleting character:', error);
            alert('Error deleting character. Please try again.');
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

// Initialize characters component
window.CharactersComponent = CharactersComponent;
