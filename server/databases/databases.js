const Database = require('better-sqlite3');
const db = new Database('../database/database.db');
const userDb = new Database('../database/userDatabase.db');

// User Database
userDb.prepare(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL, 
        banned INTEGER NOT NULL
    );`
).run();

//Banned Refresh tokens Database
userDb.prepare(
    `CREATE TABLE IF NOT EXISTS bannedRefreshTokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value TEXT NOT NULL
    );`
).run();

//Posts Database
db.prepare(`
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_username TEXT NOT NULL,
        content TEXT NOT NULL,
        timeStamp TEXT NOT NULL
    );`
).run();

//Replies Database
db.prepare(`
    CREATE TABLE IF NOT EXISTS replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_username TEXT NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id)
    );`
).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_username TEXT NOT NULL,
        vote_value INTEGER NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id)
    );`
).run();

module.exports = { userDb, db };