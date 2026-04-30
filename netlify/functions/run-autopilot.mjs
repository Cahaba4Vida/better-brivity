import { db, audit, getLeadContext } from './_shared/db.mjs';
import { decideFollowUp } from './_shared/ai.mjs';
import { validateDecision, nextFollowUpTimestamp } from './_shared/policy.mjs';
import { deliverMessage } from './_shared/delivery.mjs';
import { sendAgentText } from './_shared/sendblue.mjs';
import { assertAdmin, getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    assertAdmin(event);
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

    const body = parseJsonBody(event);
    const teamId = getTeamId();
    const sql = db();
    const limit = Math.min(Number(body.limit || process.env.MAX_AUTOPILOT_LEADS || 10), 25);
    const autoSend = Boolean(body.autoSend) || String(process.env.AUTO_SEND_LOW_RISK || 'false').toLowerCase() === 'true';

    const [run] = await sql`
      insert into automation_runs (team_id, run_type, status)
      values (${teamId}, ${body.run_type || 'manual'}, 'running')
      returning *
    `;

    const dueLeads = await sql`
      select id
      from leads
      where team_id = ${teamId}
        and automation_enabled = true
        and status not in ('closed','do_not_contact')
        and (next_follow_up_at is null or next_follow_up_at <= now())
      order by coalesce(next_follow_up_at, created_at) asc
      limit ${limit}
    `;

    const summary = {
      runId: run.id,
      due: dueLeads.length,
      messagesCreated: 0,
      messagesSent: 0,
      tasksCreated: 0,
      blocked: 0,
      decisions: [],
    };

    for (const item of dueLeads) {
      const context = await getLeadContext(teamId, item.id);
      if (!context) continue;
      const decision = await decideFollowUp(context);
      const validation = validateDecision(context.lead, decision);
      const riskFlags = validation.riskFlags;

      const [decisionRow] = await sql`
        insert into ai_decisions (team_id, lead_id, run_id, recommended_action, confidence, requires_human_review, risk_flags, reason, decision)
        values (${teamId}, ${context.lead.id}, ${run.id}, ${decision.recommended_action}, ${decision.confidence || null}, ${validation.requiresHumanReview}, ${JSON.stringify(riskFlags)}::jsonb, ${decision.reason || null}, ${JSON.stringify(decision)}::jsonb)
        returning *
      `;

      summary.decisions.push({ leadId: context.lead.id, action: decision.recommended_action, flags: riskFlags, confidence: decision.confidence });

      if (['send_sms', 'send_email'].includes(decision.recommended_action) && decision.message) {
        const channel = decision.recommended_action === 'send_sms' ? 'sms' : 'email';
        const status = validation.allowedToAutoSend && autoSend ? 'queued' : 'needs_review';
        const [message] = await sql`
          insert into messages (team_id, lead_id, channel, direction, subject, body, status, ai_generated, requires_human_review, idempotency_key, metadata)
          values (${teamId}, ${context.lead.id}, ${channel}, 'outbound', ${channel === 'email' ? 'Quick real estate follow-up' : null}, ${decision.message}, ${status}, true, ${status !== 'queued'}, ${`autopilot_${run.id}_${context.lead.id}_${channel}`}, ${JSON.stringify({ ai_decision_id: decisionRow.id, risk_flags: riskFlags })}::jsonb)
          returning *
        `;
        summary.messagesCreated += 1;

        if (status === 'queued') {
          try {
            await deliverMessage(teamId, message.id);
            summary.messagesSent += 1;
          } catch (error) {
            summary.blocked += 1;
            await sql`
              insert into tasks (team_id, lead_id, type, status, title, description, priority, metadata)
              values (${teamId}, ${context.lead.id}, 'message_failed', 'open', 'Message failed', ${error.message}, 'high', ${JSON.stringify({ message_id: message.id })}::jsonb)
            `;
            summary.tasksCreated += 1;
          }
        } else {
          await sql`
            insert into tasks (team_id, lead_id, type, status, title, description, priority, metadata)
            values (${teamId}, ${context.lead.id}, 'message_review', 'open', 'Review AI message', ${decision.reason || 'AI message requires review'}, ${riskFlags.length ? 'high' : 'normal'}, ${JSON.stringify({ message_id: message.id, risk_flags: riskFlags })}::jsonb)
          `;
          summary.tasksCreated += 1;
        }
      } else if (decision.recommended_action === 'create_task') {
        await sql`
          insert into tasks (team_id, lead_id, type, status, title, description, priority, metadata)
          values (${teamId}, ${context.lead.id}, 'ai_review', 'open', ${decision.task_title || 'Review lead'}, ${decision.task_description || decision.reason || 'AI requested human review'}, ${riskFlags.length ? 'high' : 'normal'}, ${JSON.stringify({ ai_decision_id: decisionRow.id, risk_flags: riskFlags })}::jsonb)
        `;
        summary.tasksCreated += 1;
      } else {
        summary.blocked += 1;
      }

      const nextFollowUp = nextFollowUpTimestamp(decision.follow_up_in_hours || 24);
      await sql`
        update leads
        set stage = coalesce(${decision.next_status || null}, stage), next_follow_up_at = ${nextFollowUp}
        where id = ${context.lead.id}
      `;
    }

    await sql`
      update automation_runs
      set status = 'completed', completed_at = now(), summary = ${JSON.stringify(summary)}::jsonb
      where id = ${run.id}
    `;
    await audit({ teamId, action: 'automation.run_completed', entityType: 'automation_run', entityId: run.id, summary: `Autopilot handled ${summary.due} due leads`, payload: summary });

    if (body.notifyAgent) {
      await sendAgentText(`Autopilot complete: ${summary.due} leads reviewed, ${summary.messagesSent} sent, ${summary.messagesCreated - summary.messagesSent} need review, ${summary.tasksCreated} tasks created.`).catch((error) => console.error('Agent notification failed:', error));
    }

    return json(200, summary);
  } catch (error) {
    return handleError(error);
  }
};
