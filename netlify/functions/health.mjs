import { db } from './_shared/db.mjs';
import { handleError, json, okStatus } from './_shared/http.mjs';

export const handler = async () => {
  try {
    let database = 'not_checked';
    let now = null;
    if (process.env.DATABASE_URL) {
      try {
        const [row] = await db()`select now() as now`;
        database = 'ok';
        now = row.now;
      } catch (error) {
        database = `error: ${error.message}`;
      }
    } else {
      database = 'missing';
    }

    return json(200, {
      ok: database === 'ok',
      database,
      now,
      env: {
        adminApiKey: okStatus(process.env.ADMIN_API_KEY),
        setupSecret: okStatus(process.env.SETUP_SECRET),
        ollamaApiUrl: okStatus(process.env.OLLAMA_API_URL),
        sendblue: okStatus(process.env.SENDBLUE_API_KEY_ID && process.env.SENDBLUE_API_SECRET_KEY && process.env.SENDBLUE_FROM_NUMBER),
        resend: okStatus(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
        docusign: okStatus(process.env.DOCUSIGN_ACCOUNT_ID && process.env.DOCUSIGN_ACCESS_TOKEN),
        mockProviders: String(process.env.ALLOW_MOCK_PROVIDERS || 'false'),
      }
    });
  } catch (error) {
    return handleError(error);
  }
};
