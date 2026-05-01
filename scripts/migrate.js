import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }

  const sql = neon(url)
  const files = ['001_schema.sql', '002_seed.sql']

  for (const file of files) {
    const path = join(__dirname, '../sql', file)
    console.log(`Running ${file}...`)
    const content = readFileSync(path, 'utf8')
    await sql.transaction(txn => [txn.unsafe(content)])
    console.log(`✓ ${file} done`)
  }
  console.log('Migration complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
