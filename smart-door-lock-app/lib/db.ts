import Database from 'better-sqlite3'
import crypto from 'crypto'

if (!process.env.DATABASE_FILE) throw new Error('Database file not defined in environment')

export const database = new Database(process.env.DATABASE_FILE, { verbose: console.log })

// export function hashPasswordSync(password: crypto.BinaryLike, salt: crypto.BinaryLike) {
//   if (!process.env.PASSWORD_PEPPER) throw new Error('Password pepper not defined in environment')
//   const seasoning = salt + process.env.PASSWORD_PEPPER

//   return crypto.pbkdf2Sync(password, seasoning, 310000, 32, 'sha256')
// }

export function hashPassword(password: crypto.BinaryLike, salt: crypto.BinaryLike) {
  if (!process.env.PASSWORD_PEPPER) throw new Error('Password pepper not defined in environment')
  const seasoning = salt + process.env.PASSWORD_PEPPER

  return new Promise<Buffer>((resolve, reject) => crypto.pbkdf2(password, seasoning, 310000, 32, 'sha256', (err, hashedPwd) => {
    if (err) return reject(err)
    resolve(hashedPwd)
  }))
}

const initDatabase = async () => {
  console.log('initializing database')
  const salt = crypto.randomBytes(16)

  if (!process.env.ADMIN_PASSWORD) throw new Error('Admin password not defined in environment')

  database.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash BLOB,
    salt BLOB,
    created_at INTEGER
  )`)

  database.prepare(`
    INSERT OR IGNORE INTO users (email, username, name, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    'admin@example.com',
    'admin',
    'Admin',
    await hashPassword(process.env.ADMIN_PASSWORD, salt),
    salt,
    Date.now()
  )
}
initDatabase()

export interface User {
  id: number
  email: string
  username: string
  name: string
  password_hash: Buffer
  salt: Buffer
  created_at: number
}