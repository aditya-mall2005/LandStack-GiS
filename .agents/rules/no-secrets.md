# No Secrets in Code

**Never hardcode secrets, credentials, passwords, API keys, or connection strings directly in source code.**

All sensitive values must be loaded from environment variables via the `.env` file.

## Rules

- Use `process.env.VARIABLE_NAME` to access secrets
- If a required env variable is missing, fail fast with a clear error message
- Never provide a hardcoded fallback for secrets (e.g., `process.env.DB_URL || 'postgresql://user:pass@...'`)
- The `.env` file is listed in `.gitignore` and must never be committed to git
- For scripts outside Next.js, use `require('dotenv').config()` to load `.env`
- Next.js automatically loads `.env` — no extra setup needed for API routes

## Example

```js
// ✅ CORRECT
require('dotenv').config();
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ❌ WRONG — hardcoded fallback
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost/db'
});
```
