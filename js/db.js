const DB_NAME = 'SICU1_NCDs_HealthTech_DB';
const DB_VERSION = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error: ' + event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Upgrading database...');

            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'username' });
            }
            if (!db.objectStoreNames.contains('healthProfile')) {
                db.createObjectStore('healthProfile', { keyPath: 'username' });
            }
            if (!db.objectStoreNames.contains('bmiRecords')) {
                const bmiStore = db.createObjectStore('bmiRecords', { keyPath: 'id' });
                bmiStore.createIndex('usernameAndDate', ['username', 'date'], { unique: true });
            }
            if (!db.objectStoreNames.contains('trackingRecords')) {
                 const trackingStore = db.createObjectStore('trackingRecords', { keyPath: 'id' });
                 trackingStore.createIndex('username', 'username', { unique: false });
            }
            if (!db.objectStoreNames.contains('userProfile')) {
                db.createObjectStore('userProfile', { keyPath: 'username' });
            }
        };
    });
}

async function DBPut(storeName, item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error(`Error putting item in ${storeName}:`, event.target.error);
            reject(event.target.error);
        }
    });
}

async function DBGet(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
            console.error(`Error getting item from ${storeName}:`, event.target.error);
            reject(event.target.error);
        }
    });
}

async function DBGetAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
            console.error(`Error getting all items from ${storeName}:`, event.target.error);
            reject(event.target.error);
        }
    });
} 