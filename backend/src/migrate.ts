import 'dotenv/config'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from './db.js'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

async function migrate() {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), 'utf-8')
    console.log(`applying ${file}...`)
    await pool.query(sql)
  }
  console.log('done')
  await pool.end()
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
