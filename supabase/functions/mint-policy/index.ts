import {
  Keypair,
  Connection,
  Transaction,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
} from 'npm:@solana/web3.js@1.95.3';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

const RPC_ENDPOINTS: Record<string, string> = {
  devnet: 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://rpc.ankr.com/solana',
};

async function deriveEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyBytes = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function decryptPrivateKey(encryptedBase64: string, encryptionKey: CryptoKey): Promise<Uint8Array> {
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKey, encrypted);
  return new Uint8Array(decrypted);
}

async function uploadToIPFS(metadata: object, pinataJwt: string, name: string): Promise<string> {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`IPFS Upload fehlgeschlagen: ${err}`);
  }

  const { IpfsHash } = await res.json();
  return IpfsHash;
}

async function sendMemoTransaction(
  connection: Connection,
  keypair: Keypair,
  memo: string
): Promise<string | null> {
  try {
    // On devnet, request airdrop if needed
    const network = Deno.env.get('NFT_NETWORK') || 'devnet';
    if (network === 'devnet') {
      try {
        const balance = await connection.getBalance(keypair.publicKey);
        if (balance < 5000) {
          await connection.requestAirdrop(keypair.publicKey, 100_000_000); // 0.1 SOL
          // Wait for airdrop confirmation
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (_e) {
        // Airdrop failed, skip on-chain tx
        console.log('Airdrop failed, skipping on-chain transaction');
        return null;
      }
    }

    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: new TextEncoder().encode(memo),
    });

    const transaction = new Transaction().add(memoInstruction);
    const txSig = await sendAndConfirmTransaction(connection, transaction, [keypair], {
      commitment: 'confirmed',
    });
    return txSig;
  } catch (err) {
    console.error('Memo transaction failed (non-critical):', err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { policyId, userId, policyData } = await req.json();

    if (!policyId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing policyId or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const walletEncryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY') ?? 'fallback-key-change-in-prod';
    const pinataJwt = Deno.env.get('PINATA_JWT') || Deno.env.get('VITE_PINATA_JWT') || '';
    const network = Deno.env.get('NFT_NETWORK') || 'devnet';

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if already minted
    const { data: existingNft } = await adminClient
      .from('policy_nfts')
      .select('id, ipfs_uri, tx_signature')
      .eq('policy_id', policyId)
      .single();

    if (existingNft) {
      return new Response(
        JSON.stringify({
          alreadyMinted: true,
          ipfsUri: existingNft.ipfs_uri,
          txSignature: existingNft.tx_signature,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create user's managed wallet
    const { data: walletRow } = await adminClient
      .from('user_wallets')
      .select('public_key, encrypted_private_key')
      .eq('user_id', userId)
      .single();

    let walletPublicKey: string;
    let keypair: Keypair;

    if (walletRow) {
      const encKey = await deriveEncryptionKey(walletEncryptionKey);
      const secretKey = await decryptPrivateKey(walletRow.encrypted_private_key, encKey);
      keypair = Keypair.fromSecretKey(secretKey);
      walletPublicKey = walletRow.public_key;
    } else {
      // Auto-create wallet if it doesn't exist yet
      keypair = Keypair.generate();
      walletPublicKey = keypair.publicKey.toBase58();
      const encKey = await deriveEncryptionKey(walletEncryptionKey);

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encKey,
        keypair.secretKey
      );
      const combined = new Uint8Array(12 + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), 12);
      const encryptedBase64 = btoa(String.fromCharCode(...combined));

      await adminClient.from('user_wallets').insert({
        user_id: userId,
        public_key: walletPublicKey,
        encrypted_private_key: encryptedBase64,
        network,
      });
    }

    // Build NFT metadata (Metaplex-compatible)
    const policy = policyData || {};
    const certId = crypto.randomUUID();
    const issuedAt = new Date().toISOString().split('T')[0];

    const metadata = {
      name: `${policy.type || 'Versicherung'} – InsuBuddy`,
      symbol: 'INSP',
      description: 'Verifiziertes Versicherungszertifikat, ausgestellt via InsuBuddy.',
      image: 'https://insubu.netlify.app/icons/appstore.png',
      external_url: `https://insubu.netlify.app/verify/${policyId}`,
      attributes: [
        { trait_type: 'Versicherungstyp', value: policy.type || 'Unbekannt' },
        { trait_type: 'Anbieter', value: policy.company || 'N/A' },
        { trait_type: 'Prämie', value: policy.premium ? `${policy.premium} CHF/Jahr` : 'N/A' },
        { trait_type: 'Ablaufdatum', value: policy.expiryDate || 'N/A' },
        { trait_type: 'Zertifikat-ID', value: certId },
        { trait_type: 'Wallet', value: walletPublicKey },
        { trait_type: 'Zertifiziert durch', value: 'InsuBuddy' },
        { trait_type: 'Ausgestellt am', value: issuedAt },
        { trait_type: 'Netzwerk', value: network },
      ],
    };

    // Upload metadata to IPFS
    let ipfsHash = '';
    let ipfsUri = '';
    if (pinataJwt) {
      try {
        ipfsHash = await uploadToIPFS(metadata, pinataJwt, `insubuddy-policy-${policyId}.json`);
        ipfsUri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      } catch (ipfsErr) {
        console.error('IPFS upload failed (non-critical):', ipfsErr);
        // Store cert without IPFS — still creates valid DB record
        ipfsUri = `insubuddy://cert/${certId}`;
      }
    } else {
      ipfsUri = `insubuddy://cert/${certId}`;
    }

    // Send on-chain memo transaction (best-effort)
    const connection = new Connection(RPC_ENDPOINTS[network] || RPC_ENDPOINTS['devnet'], 'confirmed');
    const memoText = `InsuBuddy:${policyId}:${certId}`;
    const txSignature = await sendMemoTransaction(connection, keypair, memoText);

    // Save certificate to database
    const { error: insertError } = await adminClient.from('policy_nfts').insert({
      user_id: userId,
      policy_id: policyId,
      wallet_address: walletPublicKey,
      ipfs_hash: ipfsHash || certId,
      ipfs_uri: ipfsUri,
      tx_signature: txSignature || certId,
      minted_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        ipfsUri,
        ipfsHash: ipfsHash || certId,
        txSignature: txSignature || null,
        walletAddress: walletPublicKey,
        certId,
        explorerUrl: txSignature
          ? `https://explorer.solana.com/tx/${txSignature}${network === 'devnet' ? '?cluster=devnet' : ''}`
          : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('mint-policy error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
