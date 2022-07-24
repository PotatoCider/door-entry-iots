import Database from 'better-sqlite3'

export default new Database('.db/main.db', { verbose: console.log })