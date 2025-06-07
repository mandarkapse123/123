// Storage Management for Novel Writer
class NovelStorage {
    constructor() {
        this.dbName = 'NovelWriterDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('chapters')) {
                    const chaptersStore = db.createObjectStore('chapters', { keyPath: 'id', autoIncrement: true });
                    chaptersStore.createIndex('order', 'order', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('scenes')) {
                    const scenesStore = db.createObjectStore('scenes', { keyPath: 'id', autoIncrement: true });
                    scenesStore.createIndex('chapterId', 'chapterId', { unique: false });
                    scenesStore.createIndex('order', 'order', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('characters')) {
                    db.createObjectStore('characters', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('plotPoints')) {
                    const plotStore = db.createObjectStore('plotPoints', { keyPath: 'id', autoIncrement: true });
                    plotStore.createIndex('order', 'order', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('goals')) {
                    db.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('research')) {
                    db.createObjectStore('research', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('timeline')) {
                    const timelineStore = db.createObjectStore('timeline', { keyPath: 'id', autoIncrement: true });
                    timelineStore.createIndex('date', 'date', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains('stats')) {
                    const statsStore = db.createObjectStore('stats', { keyPath: 'date' });
                    statsStore.createIndex('date', 'date', { unique: true });
                }
            };
        });
    }

    // Generic CRUD operations
    async add(storeName, data) {
        try {
            if (!this.db) {
                return this.addToLocalStorage(storeName, data);
            }
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            return store.add(data);
        } catch (error) {
            console.warn('IndexedDB add failed, using localStorage:', error);
            return this.addToLocalStorage(storeName, data);
        }
    }

    async update(storeName, data) {
        try {
            if (!this.db) {
                return this.updateInLocalStorage(storeName, data);
            }
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            return store.put(data);
        } catch (error) {
            console.warn('IndexedDB update failed, using localStorage:', error);
            return this.updateInLocalStorage(storeName, data);
        }
    }

    async delete(storeName, id) {
        try {
            if (!this.db) {
                return this.deleteFromLocalStorage(storeName, id);
            }
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            return store.delete(id);
        } catch (error) {
            console.warn('IndexedDB delete failed, using localStorage:', error);
            return this.deleteFromLocalStorage(storeName, id);
        }
    }

    async get(storeName, id) {
        try {
            if (!this.db) {
                return this.getFromLocalStorage(storeName, id);
            }
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            return new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('IndexedDB get failed, using localStorage:', error);
            return this.getFromLocalStorage(storeName, id);
        }
    }

    async getAll(storeName) {
        try {
            if (!this.db) {
                return this.getAllFromLocalStorage(storeName);
            }
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('IndexedDB getAll failed, using localStorage:', error);
            return this.getAllFromLocalStorage(storeName);
        }
    }

    async getAllByIndex(storeName, indexName, value) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Specific methods for novel data
    async getChapters() {
        const chapters = await this.getAll('chapters');
        return chapters.sort((a, b) => a.order - b.order);
    }

    async getScenesByChapter(chapterId) {
        const scenes = await this.getAllByIndex('scenes', 'chapterId', chapterId);
        return scenes.sort((a, b) => a.order - b.order);
    }

    async getPlotPoints() {
        const plotPoints = await this.getAll('plotPoints');
        return plotPoints.sort((a, b) => a.order - b.order);
    }

    async getTimelineEvents() {
        const events = await this.getAll('timeline');
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Settings management
    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.get('settings', key);
            return setting ? setting.value : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    async setSetting(key, value) {
        return this.update('settings', { key, value });
    }

    // Statistics tracking
    async recordWritingSession(wordCount, sessionDuration) {
        const today = new Date().toISOString().split('T')[0];
        let stats = await this.get('stats', today);
        
        if (!stats) {
            stats = {
                date: today,
                wordCount: 0,
                sessionCount: 0,
                totalTime: 0,
                sessions: []
            };
        }
        
        stats.wordCount += wordCount;
        stats.sessionCount += 1;
        stats.totalTime += sessionDuration;
        stats.sessions.push({
            timestamp: new Date().toISOString(),
            wordCount,
            duration: sessionDuration
        });
        
        return this.update('stats', stats);
    }

    async getStatsForPeriod(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        const allStats = await this.getAll('stats');
        return allStats.filter(stat => {
            const statDate = new Date(stat.date);
            return statDate >= startDate && statDate <= endDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Export functionality
    async exportData() {
        const data = {
            chapters: await this.getAll('chapters'),
            scenes: await this.getAll('scenes'),
            characters: await this.getAll('characters'),
            plotPoints: await this.getAll('plotPoints'),
            goals: await this.getAll('goals'),
            research: await this.getAll('research'),
            timeline: await this.getAll('timeline'),
            settings: await this.getAll('settings'),
            stats: await this.getAll('stats'),
            exportDate: new Date().toISOString()
        };
        return data;
    }

    async importData(data) {
        const stores = ['chapters', 'scenes', 'characters', 'plotPoints', 'goals', 'research', 'timeline', 'settings', 'stats'];
        
        for (const storeName of stores) {
            if (data[storeName]) {
                // Clear existing data
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await store.clear();
                
                // Import new data
                for (const item of data[storeName]) {
                    await this.add(storeName, item);
                }
            }
        }
    }

    // LocalStorage fallback methods
    getLocalStorageData() {
        const data = localStorage.getItem('novelWriterData');
        return data ? JSON.parse(data) : {};
    }

    setLocalStorageData(data) {
        localStorage.setItem('novelWriterData', JSON.stringify(data));
    }

    addToLocalStorage(storeName, data) {
        const allData = this.getLocalStorageData();
        if (!allData[storeName]) allData[storeName] = [];

        // Generate ID if not present
        if (!data.id) {
            data.id = Date.now() + Math.random();
        }

        allData[storeName].push(data);
        this.setLocalStorageData(allData);
        return Promise.resolve(data);
    }

    updateInLocalStorage(storeName, data) {
        const allData = this.getLocalStorageData();
        if (!allData[storeName]) allData[storeName] = [];

        const index = allData[storeName].findIndex(item => item.id === data.id);
        if (index >= 0) {
            allData[storeName][index] = data;
        } else {
            allData[storeName].push(data);
        }

        this.setLocalStorageData(allData);
        return Promise.resolve(data);
    }

    deleteFromLocalStorage(storeName, id) {
        const allData = this.getLocalStorageData();
        if (!allData[storeName]) return Promise.resolve();

        allData[storeName] = allData[storeName].filter(item => item.id !== id);
        this.setLocalStorageData(allData);
        return Promise.resolve();
    }

    getFromLocalStorage(storeName, id) {
        const allData = this.getLocalStorageData();
        if (!allData[storeName]) return Promise.resolve(null);

        const item = allData[storeName].find(item => item.id === id);
        return Promise.resolve(item || null);
    }

    getAllFromLocalStorage(storeName) {
        const allData = this.getLocalStorageData();
        return Promise.resolve(allData[storeName] || []);
    }

    // Backup to localStorage as fallback
    backupToLocalStorage() {
        if (this.db) {
            this.exportData().then(data => {
                localStorage.setItem('novelWriterBackup', JSON.stringify(data));
            });
        }
    }

    restoreFromLocalStorage() {
        const backup = localStorage.getItem('novelWriterBackup');
        if (backup) {
            const data = JSON.parse(backup);
            return this.importData(data);
        }
        return Promise.resolve();
    }
}

// Initialize storage
const storage = new NovelStorage();

// Auto-backup every 5 minutes
setInterval(() => {
    if (storage.db) {
        storage.backupToLocalStorage();
    }
}, 5 * 60 * 1000);

// Export for use in other modules
window.NovelStorage = NovelStorage;
window.storage = storage;

// Storage ready promise
window.storageReady = storage.init();
