import * as SQLite from 'expo-sqlite';

export const openDatabase = () => {
  return SQLite.openDatabaseSync('markers.db');
};

export const initDB = async () => {
  const db = openDatabase();
  
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS markers (
      id TEXT PRIMARY KEY NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS marker_images (
      id TEXT PRIMARY KEY NOT NULL,
      marker_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
    );
  `);

  return db;
};

export const db = openDatabase();
