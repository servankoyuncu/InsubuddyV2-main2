// Supabase Edge Function: send-push-notification
// Sendet iOS Push-Notifications via Apple APNs (HTTP/2 + JWT)
// Benoetigte Supabase Secrets:
//   APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY, APNS_BUNDLE_ID

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// APNs JWT generieren mit SubtleCrypto (nativ in Deno verfuegbar)
async function generateApnsJwt(keyId: string, teamId: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'ES256', kid: keyId };
  const payload = { iss: teamId, iat: now };

  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const signingInput = `${base64url(header)}.${base64url(payload)}`;

  // PEM -> CryptoKey importieren
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(signingInput)
  );

  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signingInput}.${sigBase64}`;
}

// Einzelne APNs Notification senden
async function sendApnsNotification(
  token: string,
  title: string,
  message: string,
  jwt: string,
  bundleId: string
): Promise<{ success: boolean; error?: string }> {
  const payload = JSON.stringify({
    aps: {
      alert: { title, body: message },
      sound: 'default',
      badge: 1,
    },
  });

  try {
    const response = await fetch(`https://api.push.apple.com/3/device/${token}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: payload,
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorBody = await response.json().catch(() => ({}));
      return { success: false, error: errorBody.reason || `HTTP ${response.status}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Secrets aus Environment lesen
    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsPrivateKey = Deno.env.get('APNS_PRIVATE_KEY');
    const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') || 'com.insubuddy.app';

    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'APNs Secrets fehlen (APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Request-Body parsen
    const { title, message, user_ids } = await req.json();

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'title und message sind erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase Admin Client (service_role fuer RLS-Bypass)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Tokens aus DB laden (nur iOS)
    let query = supabase
      .from('device_push_tokens')
      .select('token, user_id')
      .eq('platform', 'ios');

    if (user_ids && user_ids.length > 0) {
      query = query.in('user_id', user_ids);
    }

    const { data: tokens, error: dbError } = await query;

    if (dbError) {
      return new Response(
        JSON.stringify({ error: 'DB Fehler: ' + dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: 'Keine iOS Tokens gefunden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT einmal generieren (gueltig fuer ~60 min)
    const jwt = await generateApnsJwt(apnsKeyId, apnsTeamId, apnsPrivateKey);

    // Notifications senden
    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    await Promise.all(
      tokens.map(async ({ token }: { token: string }) => {
        const result = await sendApnsNotification(token, title, message, jwt, apnsBundleId);
        if (result.success) {
          sent++;
        } else {
          failed++;
          // Ungueltige Tokens fuer Bereinigung merken
          if (result.error === 'BadDeviceToken' || result.error === 'Unregistered') {
            invalidTokens.push(token);
          }
        }
      })
    );

    // Ungueltige Tokens aus DB entfernen
    if (invalidTokens.length > 0) {
      await supabase.from('device_push_tokens').delete().in('token', invalidTokens);
    }

    // Log-Eintrag erstellen
    // sent_by aus Authorization Header auslesen
    const authHeader = req.headers.get('authorization') || '';
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    await supabase.from('push_notification_log').insert({
      title,
      message,
      sent_by: user?.id || null,
      recipient_count: sent,
    });

    return new Response(
      JSON.stringify({ sent, failed, total: tokens.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
