// Stats Component - Writing statistics
class StatsComponent {
    constructor() {
        this.stats = [];
        this.init();
    }

    init() {
        this.bindElements();
        this.loadStats();
    }

    bindElements() {
        this.statsDashboard = document.getElementById('stats-dashboard');
    }

    async loadStats() {
        try {
            this.stats = await storage.getStatsForPeriod(30); // Last 30 days
            this.renderStats();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderStats() {
        this.statsDashboard.innerHTML = '';

        if (this.stats.length === 0) {
            this.statsDashboard.innerHTML = `
                <div class="empty-state">
                    <p>No writing statistics yet. Start writing to see your progress!</p>
                </div>
            `;
            return;
        }

        // Calculate overall statistics
        const overallStats = this.calculateOverallStats();
        
        // Create stat cards
        this.createStatCard('Total Words', overallStats.totalWords, '📝');
        this.createStatCard('Writing Days', overallStats.writingDays, '📅');
        this.createStatCard('Total Sessions', overallStats.totalSessions, '⏱️');
        this.createStatCard('Avg Words/Day', Math.round(overallStats.avgWordsPerDay), '📊');
        this.createStatCard('Avg Session Length', this.formatDuration(overallStats.avgSessionLength), '⏰');
        this.createStatCard('Most Productive Day', overallStats.mostProductiveDay.date, '🏆', overallStats.mostProductiveDay.words + ' words');

        // Create charts
        this.createWordCountChart();
        this.createSessionChart();
    }

    calculateOverallStats() {
        const totalWords = this.stats.reduce((sum, day) => sum + day.wordCount, 0);
        const writingDays = this.stats.length;
        const totalSessions = this.stats.reduce((sum, day) => sum + day.sessionCount, 0);
        const totalTime = this.stats.reduce((sum, day) => sum + day.totalTime, 0);
        
        const avgWordsPerDay = writingDays > 0 ? totalWords / writingDays : 0;
        const avgSessionLength = totalSessions > 0 ? totalTime / totalSessions : 0;
        
        const mostProductiveDay = this.stats.reduce((max, day) => 
            day.wordCount > max.words ? { date: day.date, words: day.wordCount } : max,
            { date: 'None', words: 0 }
        );

        return {
            totalWords,
            writingDays,
            totalSessions,
            avgWordsPerDay,
            avgSessionLength,
            mostProductiveDay
        };
    }

    createStatCard(title, value, icon, subtitle = '') {
        const card = document.createElement('div');
        card.className = 'card stat-card';
        card.innerHTML = `
            <div class="stat-icon">${icon}</div>
            <div class="stat-content">
                <h3>${title}</h3>
                <div class="stat-value">${value}</div>
                ${subtitle ? `<div class="stat-subtitle">${subtitle}</div>` : ''}
            </div>
        `;
        this.statsDashboard.appendChild(card);
    }

    createWordCountChart() {
        const chartCard = document.createElement('div');
        chartCard.className = 'card chart-card';
        chartCard.innerHTML = `
            <h3>Daily Word Count (Last 30 Days)</h3>
            <div class="chart-container">
                <div class="simple-chart" id="word-count-chart"></div>
            </div>
        `;
        this.statsDashboard.appendChild(chartCard);

        // Create simple bar chart
        const chartContainer = chartCard.querySelector('#word-count-chart');
        const maxWords = Math.max(...this.stats.map(day => day.wordCount));
        
        this.stats.slice(-14).forEach(day => { // Show last 14 days
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            const height = maxWords > 0 ? (day.wordCount / maxWords) * 100 : 0;
            bar.innerHTML = `
                <div class="bar" style="height: ${height}%" title="${day.date}: ${day.wordCount} words"></div>
                <div class="bar-label">${new Date(day.date).getDate()}</div>
            `;
            chartContainer.appendChild(bar);
        });
    }

    createSessionChart() {
        const chartCard = document.createElement('div');
        chartCard.className = 'card chart-card';
        chartCard.innerHTML = `
            <h3>Writing Sessions (Last 30 Days)</h3>
            <div class="chart-container">
                <div class="simple-chart" id="session-chart"></div>
            </div>
        `;
        this.statsDashboard.appendChild(chartCard);

        // Create simple bar chart for sessions
        const chartContainer = chartCard.querySelector('#session-chart');
        const maxSessions = Math.max(...this.stats.map(day => day.sessionCount));
        
        this.stats.slice(-14).forEach(day => { // Show last 14 days
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            const height = maxSessions > 0 ? (day.sessionCount / maxSessions) * 100 : 0;
            bar.innerHTML = `
                <div class="bar sessions" style="height: ${height}%" title="${day.date}: ${day.sessionCount} sessions"></div>
                <div class="bar-label">${new Date(day.date).getDate()}</div>
            `;
            chartContainer.appendChild(bar);
        });
    }

    formatDuration(seconds) {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600 * 10) / 10}h`;
    }

    // Method to refresh stats (called from other components)
    async refresh() {
        await this.loadStats();
    }
}

// Initialize stats component
window.StatsComponent = StatsComponent;
