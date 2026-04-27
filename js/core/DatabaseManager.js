class DatabaseManager {
    constructor() {
        this.dbName = "MuseArchitectDB";
        this.dbVersion = 4; // Bắt buộc v4 để giữ code clear DB cũ
        this.db = null;
        this.isSupported = !!window.indexedDB;
    }

    init() {
        return new Promise((resolve) => {
            if (!this.isSupported) {
                console.warn("[Cine-Tech] Browser not supporting IndexedDB.");
                return resolve(false);
            }

            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (db.objectStoreNames.contains('gallery')) db.deleteObjectStore('gallery');
                    if (db.objectStoreNames.contains('idols')) db.deleteObjectStore('idols');
                    
                    const galleryStore = db.createObjectStore('gallery', { keyPath: 'id', autoIncrement: true });
                    galleryStore.createIndex('idolId', 'idolId', { unique: false });
                    galleryStore.createIndex('timestamp', 'timestamp', { unique: false });
                    
                    db.createObjectStore('idols', { keyPath: 'id' });
                    console.log("[Cine-Tech DB] Initialized v4.");
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve(true);
                };

                request.onerror = (event) => {
                    console.error("[Cine-Tech] DB Error:", event.target.error);
                    resolve(false); 
                };
            } catch (err) {
                resolve(false);
            }
        });
    }

    async savePhoto(idolId, imageUrl, fullPrompt) {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['gallery'], 'readwrite');
                const store = transaction.objectStore('gallery');
                const request = store.add({ idolId, imageUrl, prompt: fullPrompt, timestamp: Date.now() });
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(false);
            } catch (e) { resolve(false); }
        });
    }

    async updatePhoto(photoData) {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['gallery'], 'readwrite');
                const store = transaction.objectStore('gallery');
                const request = store.put(photoData);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            } catch (e) { resolve(false); }
        });
    }

    async getPhoto(id) {
        if (!this.db) await this.init();
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['gallery'], 'readonly');
                const store = transaction.objectStore('gallery');
                const request = store.get(Number(id));
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (e) { resolve(null); }
        });
    }

    async getAllPhotos() {
        if (!this.db) await this.init();
        if (!this.db) return []; 

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['gallery'], 'readonly');
                const store = transaction.objectStore('gallery');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
                request.onerror = () => resolve([]);
            } catch (e) { resolve([]); }
        });
    }

    async deletePhoto(id) {
        if (!this.db) await this.init();
        if (!this.db) return false;
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['gallery'], 'readwrite');
                const store = transaction.objectStore('gallery');
                const req = store.delete(Number(id));
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            } catch (e) { resolve(false); }
        });
    }

    async getPhotosPaginated(offset = 0, limit = 12) {
        if (!this.db) await this.init();
        if (!this.db) return []; 

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['gallery'], 'readonly');
                const store = transaction.objectStore('gallery');
                const index = store.index('timestamp'); // Must sort by newest first
                const request = index.openCursor(null, 'prev'); 
                
                const results = [];
                let advanced = false;

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (!cursor) {
                        resolve(results);
                        return;
                    }

                    if (offset > 0 && !advanced) {
                        advanced = true;
                        cursor.advance(offset);
                        return;
                    }

                    if (results.length < limit) {
                        results.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };
                request.onerror = () => resolve([]);
            } catch (e) { resolve([]); }
        });
    }
    
    async saveIdolData(idolData) {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['idols'], 'readwrite');
                const store = transaction.objectStore('idols');
                const request = store.put(idolData);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            } catch (e) { resolve(false); }
        });
    }

    async getAllIdols() {
        if (!this.db) await this.init();
        if (!this.db) return [];

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['idols'], 'readonly');
                const store = transaction.objectStore('idols');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve([]);
            } catch (e) { resolve([]); }
        });
    }
	
	async deleteIdolData(id) {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction(['idols'], 'readwrite');
                const store = transaction.objectStore('idols');
                const request = store.delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            } catch (e) { resolve(false); }
        });
    }
}
const dbManager = new DatabaseManager();
