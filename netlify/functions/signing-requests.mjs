import { db } from './_shared/db.mjs';
import { assertAdmin, getPagination, getTeamId, handleError, json } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    assertAdmin(event);
    const teamId = getTeamId();
    const sql = db();
    const { limit, offset } = getPagination(event, { limit: 50, max: 150 });
    const rows = await sql`
      select sr.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone
      from signing_requests sr
      left join leads l on l.id = sr.lead_id
      where sr.team_id = ${teamId}
      order by sr.created_at desc
      limit ${limit} offset ${offset}
    `;
    return json(200, { signingRequests: rows });
  } catch (error) {
    return handleError(error);
  }
};
