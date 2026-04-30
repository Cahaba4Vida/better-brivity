import { deliverMessage } from './_shared/delivery.mjs';
import { assertAdmin, getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    assertAdmin(event);
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    const body = parseJsonBody(event);
    if (!body.message_id) return json(400, { error: 'message_id is required' });
    const result = await deliverMessage(getTeamId(), body.message_id);
    return json(200, result);
  } catch (error) {
    return handleError(error);
  }
};
