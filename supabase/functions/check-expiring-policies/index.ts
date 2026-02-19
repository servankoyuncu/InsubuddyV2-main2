// Supabase Edge Function: check-expiring-policies
// Laedt taeglich ablaufende Policen und sendet Push-Notifications
//
// pg_cron Setup (einmalig im Supabase SQL Editor ausfuehren):
// SELECT cron.schedule(
//   'check-expiring-policies',
//   '0 8 * * *',
//   $$
//   SELECT net.http_post(
//     url := 'https://jpxtgzbyziipezbnsiiu.supabase.co/functions/v1/check-expiring-policies',
//     headers := jsonb_build_object(
//       'Content-Type', 'application/json',
//       'Authorization', 'Bearer ' || current_setting('app.service_role_key')
//     ),
//     body := '{}'::jsonb
//   ) AS request_id;
//   $$
// );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();

    // Alle Policen laden die in den naechsten 30 Tagen ablaufen
    // Dabei werden nur User beruecksichtigt die iOS Push Tokens haben
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    const { data: policies, error } = await supabase
      .from('policies')
      .select('id, name, company, type, expiry_date, user_id')
      .not('expiry_date', 'is', null)
      .gte('expiry_date', today.toISOString())
      .lte('expiry_date', thirtyDaysLater.toISOString());

    if (error) {
      console.error('Fehler beim Laden der Policen:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!policies || policies.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Keine ablaufenden Policen gefunden', notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notifications pro User zusammenfassen (ein User koennte mehrere ablaufende Policen haben)
    const byUser: Record<string, { policies: typeof policies; daysLeft: number[] }> = {};

    for (const policy of policies) {
      const expiry = new Date(policy.expiry_date);
      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Nur an exakten Meilensteinen benachrichtigen: 30, 14, 7, 1 Tage
      if (![30, 14, 7, 1].includes(daysLeft)) continue;

      if (!byUser[policy.user_id]) {
        byUser[policy.user_id] = { policies: [], daysLeft: [] };
      }
      byUser[policy.user_id].policies.push(policy);
      byUser[policy.user_id].daysLeft.push(daysLeft);
    }

    const userIds = Object.keys(byUser);
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Kein Benachrichtigungsmeilenstein heute', notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalNotified = 0;
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Fuer jeden User eine personalisierte Notification senden
    for (const userId of userIds) {
      const { policies: userPolicies, daysLeft } = byUser[userId];
      const minDays = Math.min(...daysLeft);

      let title: string;
      let message: string;

      if (userPolicies.length === 1) {
        const p = userPolicies[0];
        title = `Police laeuft ab in ${minDays} Tag${minDays === 1 ? '' : 'en'}`;
        message = `${p.company} – ${p.type} laeuft in ${minDays} Tag${minDays === 1 ? '' : 'en'} ab. Jetzt in InsuBuddy pruefen.`;
      } else {
        title = `${userPolicies.length} Policen laufen bald ab`;
        message = `Mehrere Policen laufen in den naechsten ${minDays} Tagen ab. Jetzt in InsuBuddy pruefen.`;
      }

      // send-push-notification Edge Function aufrufen (nur fuer diesen User)
      const sendResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-push-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ title, message, user_ids: [userId] }),
        }
      );

      if (sendResponse.ok) {
        const result = await sendResponse.json();
        totalNotified += result.sent || 0;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Abgelaufene Policen geprueft',
        usersChecked: userIds.length,
        notified: totalNotified,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
