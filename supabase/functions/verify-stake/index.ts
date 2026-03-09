import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STAKING_WALLET = '8YorNCXpJBDpjoj9jnyvDdMBk4Acqd7A6XWm24wGCrU7';
const INSU_MINT = 'AuHzjKyKAiWzjk13Ry9BovBeFxDRPyien166TTxXpump';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

const TIERS = [
  { minAmount: 3_000_000, months: 12 },
  { minAmount: 2_000_000, months: 3 },
  { minAmount: 1_000_000, months: 1 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { txSignature, userId, walletAddress } = await req.json();

    if (!txSignature || !userId || !walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing txSignature, userId or walletAddress' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Check if tx was already used
    const { data: existing } = await adminClient
      .from('insu_stakes')
      .select('id')
      .eq('tx_signature', txSignature)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Diese Transaktion wurde bereits verwendet.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch transaction from Solana
    const rpcResponse = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [txSignature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
      }),
    });

    const rpcData = await rpcResponse.json();
    const tx = rpcData?.result;

    if (!tx) {
      return new Response(
        JSON.stringify({ error: 'Transaktion nicht gefunden. Bitte warte kurz und versuche es erneut.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check transaction is not too old (max 24 hours)
    const txAge = Date.now() / 1000 - tx.blockTime;
    if (txAge > 86400) {
      return new Response(
        JSON.stringify({ error: 'Transaktion ist älter als 24 Stunden.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Find received INSU amount at staking wallet
    const preBalances = tx.meta?.preTokenBalances ?? [];
    const postBalances = tx.meta?.postTokenBalances ?? [];

    const stakingPost = postBalances.find(
      (b: any) => b.mint === INSU_MINT && b.owner === STAKING_WALLET
    );
    const stakingPre = preBalances.find(
      (b: any) => b.mint === INSU_MINT && b.owner === STAKING_WALLET
    );

    const postAmount = stakingPost?.uiTokenAmount?.uiAmount ?? 0;
    const preAmount = stakingPre?.uiTokenAmount?.uiAmount ?? 0;
    const receivedAmount = postAmount - preAmount;

    if (receivedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Keine $INSU Token an die Staking-Adresse gesendet.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Determine tier
    const tier = TIERS.find(t => receivedAmount >= t.minAmount);
    if (!tier) {
      return new Response(
        JSON.stringify({ error: `Mindestens 1'000'000 $INSU erforderlich. Gesendet: ${receivedAmount.toLocaleString()}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Insert stake record
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + tier.months);

    const { error: insertError } = await adminClient.from('insu_stakes').insert({
      user_id: userId,
      wallet_address: walletAddress,
      tx_signature: txSignature,
      amount_insu: receivedAmount,
      duration_months: tier.months,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        months: tier.months,
        amount: receivedAmount,
        expires_at: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('verify-stake error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Interner Fehler' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
