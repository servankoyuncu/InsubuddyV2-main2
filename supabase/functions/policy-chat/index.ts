// Supabase Edge Function: policy-chat
// Beantwortet Versicherungsfragen basierend auf den hochgeladenen Policen des Users
//
// Benötigte Supabase Secrets (einmalig setzen via Dashboard oder CLI):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

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
    // 1. User authentifizieren via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nicht autorisiert' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Ungültige Session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Anfrage-Body lesen
    const { question, conversationHistory = [] } = await req.json();
    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Keine Frage angegeben' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Alle Policen des Users laden (inkl. extrahiertem Text)
    const { data: policies, error: policiesError } = await supabase
      .from('policies')
      .select('id, name, company, type, premium, expiry_date, coverage, extracted_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (policiesError) throw policiesError;

    if (!policies || policies.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'Du hast noch keine Policen in InsuBuddy hochgeladen. Lade zuerst deine Versicherungsdokumente hoch, damit ich dir helfen kann.',
          policiesUsed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Policen-Kontext für Claude aufbereiten
    const policiesContext = policies.map((p) => {
      const expiryStr = p.expiry_date
        ? new Date(p.expiry_date).toLocaleDateString('de-CH')
        : 'Kein Datum angegeben';

      let context = `--- POLICE: ${p.name || `${p.type} - ${p.company}`} ---
Versicherungsgesellschaft: ${p.company || 'Unbekannt'}
Versicherungsart: ${p.type || 'Unbekannt'}
Prämie: ${p.premium || 'Nicht angegeben'}
Ablaufdatum: ${expiryStr}
Deckungen: ${p.coverage?.join(', ') || 'Keine Angabe'}`;

      if (p.extracted_text) {
        // Maximal 3000 Zeichen pro Police (verhindert Token-Überlauf)
        const truncatedText = p.extracted_text.substring(0, 3000);
        context += `\nDokument-Inhalt:\n${truncatedText}`;
        if (p.extracted_text.length > 3000) {
          context += '\n[Dokument gekürzt...]';
        }
      }

      return context;
    }).join('\n\n');

    // 5. Claude API aufrufen
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'KI-Service nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gesprächsverlauf aufbereiten (max. letzte 6 Nachrichten)
    const recentHistory = conversationHistory.slice(-6);
    const messages = [
      ...recentHistory,
      { role: 'user', content: question }
    ];

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `Du bist InsuBuddy, ein freundlicher und kompetenter Schweizer Versicherungsassistent. Du hilfst dem Nutzer dabei, seine Versicherungssituation zu verstehen und beantwortest Fragen zu seinen Policen.

WICHTIGE REGELN:
- Antworte immer auf Schweizerdeutsch/Hochdeutsch (Schweizer Kontext: CHF, keine ß, "Grüsse" statt "Grüße")
- Beziehe dich konkret auf die Policen des Nutzers wenn möglich
- Wenn eine Deckung unklar ist, sage es ehrlich und empfehle beim Versicherer nachzufragen
- Gib keine Rechtsberatung, nur allgemeine Informationshinweise
- Sei präzise und verständlich, nicht zu technisch
- Verwende wenn sinnvoll ✅ für gedeckt, ⚠️ für bedingt gedeckt, ❌ für nicht gedeckt
- Strukturiere Antworten bei mehreren Punkten mit Aufzählungen

POLICEN DES NUTZERS:
${policiesContext}`,
        messages
      })
    });

    if (!claudeResponse.ok) {
      const errBody = await claudeResponse.text();
      console.error('Claude API Fehler:', errBody);
      return new Response(
        JSON.stringify({ error: 'KI-Service vorübergehend nicht verfügbar' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claudeData = await claudeResponse.json();
    const answer = claudeData.content?.[0]?.text ?? '';

    return new Response(
      JSON.stringify({
        answer,
        policiesUsed: policies.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unerwarteter Fehler:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
