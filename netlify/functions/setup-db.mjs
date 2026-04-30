import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, audit } from './_shared/db.mjs';
import { assertSetupSecret, getTeamId, handleError, json } from './_shared/http.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readIncludedFile(relativePath) {
  const candidates = [
    path.resolve(__dirname, '../..', relativePath),
    path.resolve(process.cwd(), relativePath),
    path.resolve(__dirname, relativePath),
    path.resolve(__dirname, '..', relativePath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, 'utf8');
  }
  throw new Error(`Included file not found: ${relativePath}. Tried ${candidates.join(', ')}`);
}

function splitSqlStatements(sqlText) {
  const statements = [];
  let current = '';
  let singleQuote = false;
  let doubleQuote = false;
  let dollarTag = null;

  for (let i = 0; i < sqlText.length; i += 1) {
    const char = sqlText[i];
    const rest = sqlText.slice(i);

    if (!singleQuote && !doubleQuote) {
      const dollarMatch = rest.match(/^\$[a-zA-Z0-9_]*\$/);
      if (dollarMatch) {
        const tag = dollarMatch[0];
        if (dollarTag === tag) dollarTag = null;
        else if (!dollarTag) dollarTag = tag;
        current += tag;
        i += tag.length - 1;
        continue;
      }
    }

    if (!dollarTag && char === "'" && !doubleQuote) singleQuote = !singleQuote;
    else if (!dollarTag && char === '"' && !singleQuote) doubleQuote = !doubleQuote;

    if (char === ';' && !singleQuote && !doubleQuote && !dollarTag) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = '';
    } else {
      current += char;
    }
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    assertSetupSecret(event);

    const sql = db();
    const schema = readIncludedFile('db/schema.sql');
    const seed = readIncludedFile('db/seed.sql');
    const statements = [...splitSqlStatements(schema), ...splitSqlStatements(seed)];

    for (const statement of statements) {
      await sql.query(statement);
    }

    await audit({ teamId: getTeamId(), action: 'system.setup_db', summary: 'Database schema and seed data installed', payload: { statementCount: statements.length } });
    return json(200, { ok: true, statementCount: statements.length });
  } catch (error) {
    return handleError(error);
  }
};
