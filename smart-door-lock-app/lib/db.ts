import Database from 'better-sqlite3'

export const database = new Database('.db/main.db', { verbose: console.log })

database.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  password_hash BLOB,
  salt BLOB,
  created_at INTEGER
)`)

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  password_hash: Buffer
  salt: Buffer
}