import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { supabase } from '../supabase';

const INSUBUDDY_WALLET = new PublicKey('8YorNCXpJBDpjoj9jnyvDdMBk4Acqd7A6XWm24wGCrU7');
const INSUBUDDY_FEE_SOL = 0.03;
const NETWORK_FEE_SOL = 0.01;
export const TOTAL_MINT_FEE_SOL = INSUBUDDY_FEE_SOL + NETWORK_FEE_SOL;

// Set to 'devnet' for testing, 'mainnet-beta' for production
export const NFT_NETWORK = import.meta.env.VITE_NFT_NETWORK || 'devnet';

const RPC_ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://rpc.ankr.com/solana',
};

const getConnection = () => new Connection(RPC_ENDPOINTS[NFT_NETWORK] || RPC_ENDPOINTS['devnet'], 'confirmed');

export const getSolanaExplorerUrl = (signature, type = 'tx') =>
  `https://explorer.solana.com/${type}/${signature}${NFT_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`;

/**
 * Upload policy metadata to IPFS via Pinata
 */
export const uploadPolicyMetadata = async (policy, walletAddress) => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;
  console.log('[Pinata] JWT first 20 chars:', pinataJwt?.substring(0, 20));
  console.log('[Pinata] JWT length:', pinataJwt?.length);

  const metadata = {
    name: `${policy.type || 'Versicherung'} – InsuBuddy`,
    symbol: 'INSP',
    description: `Verifizierte Versicherungspolice, ausgestellt via InsuBuddy.`,
    image: 'https://insubu.netlify.app/icons/appstore.png',
    external_url: 'https://insubu.netlify.app',
    attributes: [
      { trait_type: 'Versicherungstyp', value: policy.type || 'Unbekannt' },
      { trait_type: 'Anbieter', value: policy.company || 'N/A' },
      { trait_type: 'Prämie', value: policy.premium ? `${policy.premium} CHF/Jahr` : 'N/A' },
      { trait_type: 'Ablaufdatum', value: policy.expiryDate || 'N/A' },
      { trait_type: 'Wallet', value: walletAddress },
      { trait_type: 'Zertifiziert durch', value: 'InsuBuddy' },
      { trait_type: 'Datum', value: new Date().toISOString().split('T')[0] },
    ],
  };

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `insubuddy-policy-${policy.id || Date.now()}.json` },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`IPFS Upload fehlgeschlagen: ${err}`);
  }

  const { IpfsHash } = await res.json();
  return {
    uri: `https://gateway.pinata.cloud/ipfs/${IpfsHash}`,
    hash: IpfsHash,
  };
};

/**
 * Transfer SOL fee to InsuBuddy wallet and return tx signature
 */
export const payMintFee = async (wallet) => {
  const connection = getConnection();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: INSUBUDDY_WALLET,
      lamports: Math.round(INSUBUDDY_FEE_SOL * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  const signed = await wallet.signTransaction(transaction);
  const txSig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({ signature: txSig, blockhash, lastValidBlockHeight });

  return txSig;
};

/**
 * Save NFT mint record to Supabase
 */
export const savePolicyNFT = async ({ userId, policyId, walletAddress, ipfsHash, ipfsUri, txSignature }) => {
  const { error } = await supabase.from('policy_nfts').insert({
    user_id: userId,
    policy_id: policyId,
    wallet_address: walletAddress,
    ipfs_hash: ipfsHash,
    ipfs_uri: ipfsUri,
    tx_signature: txSignature,
    minted_at: new Date().toISOString(),
  });
  if (error) throw error;
};

/**
 * Check if a policy already has an NFT minted
 */
export const getPolicyNFT = async (policyId) => {
  const { data } = await supabase
    .from('policy_nfts')
    .select('*')
    .eq('policy_id', policyId)
    .single();
  return data || null;
};

/**
 * Full mint flow: upload → pay → save
 */
export const mintPolicyCertificate = async ({ wallet, policy, userId }) => {
  const walletAddress = wallet.publicKey.toString();

  // 1. Upload metadata to IPFS
  const { uri, hash } = await uploadPolicyMetadata(policy, walletAddress);

  // 2. Pay InsuBuddy fee (user signs in Phantom)
  const txSig = await payMintFee(wallet);

  // 3. Save to Supabase
  await savePolicyNFT({
    userId,
    policyId: policy.id,
    walletAddress,
    ipfsHash: hash,
    ipfsUri: uri,
    txSignature: txSig,
  });

  return { ipfsUri: uri, txSignature: txSig };
};
