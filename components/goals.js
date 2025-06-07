// Goals Component - Writing goals and progress tracking
class GoalsComponent {
    constructor() {
        this.goals = [];
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadGoals();
    }

    bindElements() {
        this.addGoalBtn = document.getElementById('add-goal');
        this.goalsDashboard = document.getElementById('goals-dashboard');
    }

    bindEvents() {
        this.addGoalBtn.addEventListener('click', () => this.showAddGoalModal());
    }

    async loadGoals() {
        try {
            this.goals = await storage.getAll('goals');
            this.renderGoals();
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }

    renderGoals() {
        this.goalsDashboard.innerHTML = '';

        if (this.goals.length === 0) {
            this.goalsDashboard.innerHTML = `
                <div class="empty-state">
                    <p>No writing goals yet. Click "Add Goal" to set your first writing target!</p>
                </div>
            `;
            return;
        }

        this.goals.forEach(goal => {
            const card = this.createGoalCard(goal);
            this.goalsDashboard.appendChild(card);
        });
    }

    createGoalCard(goal) {
        const progress = this.calculateProgress(goal);
        const progressPercent = Math.min(100, (progress.current / goal.target) * 100);

        const card = document.createElement('div');
        card.className = 'card goal-card';
        card.innerHTML = `
            <div class="goal-header">
                <h3>${goal.title}</h3>
                <div class="goal-actions">
                    <button class="action-btn" onclick="goals.editGoal(${goal.id})" title="Edit">✏️</button>
                    <button class="action-btn" onclick="goals.deleteGoal(${goal.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="goal-info">
                <p><strong>Type:</strong> ${goal.type}</p>
                <p><strong>Target:</strong> ${goal.target} ${goal.unit}</p>
                <p><strong>Deadline:</strong> ${new Date(goal.deadline).toLocaleDateString()}</p>
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="progress-text">
                    ${progress.current} / ${goal.target} ${goal.unit} (${Math.round(progressPercent)}%)
                </div>
            </div>
            ${goal.description ? `<div class="goal-description"><p>${goal.description}</p></div>` : ''}
            <div class="goal-status ${this.getGoalStatus(goal, progress)}">
                ${this.getGoalStatusText(goal, progress)}
            </div>
        `;

        return card;
    }

    calculateProgress(goal) {
        // This is a simplified calculation - in a real app, you'd track actual progress
        const now = new Date();
        const start = new Date(goal.createdAt);
        const end = new Date(goal.deadline);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
        
        // Simulate some progress based on time passed
        const timeProgress = Math.min(1, daysPassed / totalDays);
        const current = Math.floor(goal.target * timeProgress * 0.7); // 70% efficiency simulation
        
        return { current, total: goal.target };
    }

    getGoalStatus(goal, progress) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const isOverdue = now > deadline;
        const isComplete = progress.current >= goal.target;
        
        if (isComplete) return 'complete';
        if (isOverdue) return 'overdue';
        return 'active';
    }

    getGoalStatusText(goal, progress) {
        const status = this.getGoalStatus(goal, progress);
        switch (status) {
            case 'complete': return '✅ Goal Completed!';
            case 'overdue': return '⚠️ Overdue';
            case 'active': return '🎯 In Progress';
            default: return '';
        }
    }

    showAddGoalModal() {
        const modal = this.createModal('Add Writing Goal', `
            <form id="goal-form">
                <div class="form-group">
                    <label for="goal-title">Goal Title *</label>
                    <input type="text" id="goal-title" required placeholder="e.g., Complete first draft">
                </div>
                <div class="form-group">
                    <label for="goal-type">Goal Type</label>
                    <select id="goal-type">
                        <option value="words">Word Count</option>
                        <option value="pages">Page Count</option>
                        <option value="chapters">Chapters</option>
                        <option value="scenes">Scenes</option>
                        <option value="time">Writing Time (hours)</option>
                        <option value="days">Writing Days</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="goal-target">Target Amount *</label>
                    <input type="number" id="goal-target" required min="1" placeholder="e.g., 50000">
                </div>
                <div class="form-group">
                    <label for="goal-deadline">Deadline *</label>
                    <input type="date" id="goal-deadline" required>
                </div>
                <div class="form-group">
                    <label for="goal-description">Description</label>
                    <textarea id="goal-description" placeholder="Additional details about this goal..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Add Goal</button>
                </div>
            </form>
        `);

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        modal.querySelector('#goal-deadline').min = today;

        modal.querySelector('#goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal(modal);
        });
    }

    async addGoal(modal) {
        const title = modal.querySelector('#goal-title').value.trim();
        const target = parseInt(modal.querySelector('#goal-target').value);
        const deadline = modal.querySelector('#goal-deadline').value;

        if (!title || !target || !deadline) return;

        try {
            const goal = {
                title,
                type: modal.querySelector('#goal-type').value,
                target,
                unit: this.getUnitForType(modal.querySelector('#goal-type').value),
                deadline,
                description: modal.querySelector('#goal-description').value.trim(),
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            await storage.add('goals', goal);
            modal.remove();
            await this.loadGoals();
        } catch (error) {
            console.error('Error adding goal:', error);
            alert('Error adding goal. Please try again.');
        }
    }

    getUnitForType(type) {
        const units = {
            'words': 'words',
            'pages': 'pages',
            'chapters': 'chapters',
            'scenes': 'scenes',
            'time': 'hours',
            'days': 'days'
        };
        return units[type] || 'units';
    }

    async editGoal(goalId) {
        const goal = await storage.get('goals', goalId);
        if (!goal) return;

        const modal = this.createModal('Edit Writing Goal', `
            <form id="edit-goal-form">
                <div class="form-group">
                    <label for="edit-goal-title">Goal Title *</label>
                    <input type="text" id="edit-goal-title" value="${goal.title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-goal-type">Goal Type</label>
                    <select id="edit-goal-type">
                        <option value="words" ${goal.type === 'words' ? 'selected' : ''}>Word Count</option>
                        <option value="pages" ${goal.type === 'pages' ? 'selected' : ''}>Page Count</option>
                        <option value="chapters" ${goal.type === 'chapters' ? 'selected' : ''}>Chapters</option>
                        <option value="scenes" ${goal.type === 'scenes' ? 'selected' : ''}>Scenes</option>
                        <option value="time" ${goal.type === 'time' ? 'selected' : ''}>Writing Time (hours)</option>
                        <option value="days" ${goal.type === 'days' ? 'selected' : ''}>Writing Days</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-goal-target">Target Amount *</label>
                    <input type="number" id="edit-goal-target" value="${goal.target}" required min="1">
                </div>
                <div class="form-group">
                    <label for="edit-goal-deadline">Deadline *</label>
                    <input type="date" id="edit-goal-deadline" value="${goal.deadline.split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="edit-goal-description">Description</label>
                    <textarea id="edit-goal-description">${goal.description || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Goal</button>
                </div>
            </form>
        `);

        modal.querySelector('#edit-goal-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            goal.title = modal.querySelector('#edit-goal-title').value.trim();
            goal.type = modal.querySelector('#edit-goal-type').value;
            goal.target = parseInt(modal.querySelector('#edit-goal-target').value);
            goal.unit = this.getUnitForType(goal.type);
            goal.deadline = modal.querySelector('#edit-goal-deadline').value;
            goal.description = modal.querySelector('#edit-goal-description').value.trim();
            goal.lastModified = new Date().toISOString();

            try {
                await storage.update('goals', goal);
                modal.remove();
                await this.loadGoals();
            } catch (error) {
                console.error('Error updating goal:', error);
                alert('Error updating goal. Please try again.');
            }
        });
    }

    async deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        try {
            await storage.delete('goals', goalId);
            await this.loadGoals();
        } catch (error) {
            console.error('Error deleting goal:', error);
            alert('Error deleting goal. Please try again.');
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

// Initialize goals component
window.GoalsComponent = GoalsComponent;
