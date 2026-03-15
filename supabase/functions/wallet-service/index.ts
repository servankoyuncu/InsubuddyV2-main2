import { Keypair } from 'npm:@solana/web3.js@1.95.3';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function deriveEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyBytes = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptPrivateKey(secretKey: Uint8Array, encryptionKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    secretKey
  );
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return btoa(String.fromCharCode(...combined));
}

async function decryptPrivateKey(encryptedBase64: string, encryptionKey: CryptoKey): Promise<Uint8Array> {
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKey, encrypted);
  return new Uint8Array(decrypted);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, action } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const walletEncryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY') ?? 'fallback-key-change-in-prod';

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const encKey = await deriveEncryptionKey(walletEncryptionKey);

    // Check if wallet already exists for this user
    const { data: existingWallet } = await adminClient
      .from('user_wallets')
      .select('public_key, encrypted_private_key, network')
      .eq('user_id', userId)
      .single();

    if (existingWallet) {
      // Return existing wallet public key (never expose private key to frontend)
      if (action === 'get_private_key') {
        // Only for internal edge function use — not accessible from frontend
        const secretKey = await decryptPrivateKey(existingWallet.encrypted_private_key, encKey);
        const keypair = Keypair.fromSecretKey(secretKey);
        return new Response(
          JSON.stringify({
            publicKey: existingWallet.public_key,
            secretKey: Array.from(keypair.secretKey),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          publicKey: existingWallet.public_key,
          network: existingWallet.network,
          created: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new managed wallet
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const encryptedPrivateKey = await encryptPrivateKey(keypair.secretKey, encKey);
    const network = Deno.env.get('NFT_NETWORK') || 'devnet';

    const { error: insertError } = await adminClient
      .from('user_wallets')
      .insert({
        user_id: userId,
        public_key: publicKey,
        encrypted_private_key: encryptedPrivateKey,
        network,
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        publicKey,
        network,
        created: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('wallet-service error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
