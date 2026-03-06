const INSU_MINT = 'AuHzjKyKAiWzjk13Ry9BovBeFxDRPyien166TTxXpump';
const MINIMUM_INSU = 1_000_000; // UI amount — RPC jsonParsed handles decimals
const SOLANA_RPCS = [
  'https://rpc.ankr.com/solana',
  'https://api.mainnet-beta.solana.com',
];

/**
 * Check how many $INSU tokens a wallet holds.
 * Uses jsonParsed encoding so uiAmount is already decimal-adjusted.
 * Returns { balance: number, isPremium: boolean }
 */
const fetchTokenBalance = async (rpc, walletAddress) => {
  const response = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { mint: INSU_MINT },
        { encoding: 'jsonParsed' },
      ],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data?.result?.value ?? [];
};

export const checkInsuBalance = async (walletAddress) => {
  console.log('[solanaService] Checking INSU balance for:', walletAddress);
  try {
    let accounts = [];
    for (const rpc of SOLANA_RPCS) {
      try {
        accounts = await fetchTokenBalance(rpc, walletAddress);
        console.log('[solanaService] RPC success:', rpc, 'accounts:', accounts.length);
        break;
      } catch (rpcErr) {
        console.warn('[solanaService] RPC failed:', rpc, rpcErr.message);
      }
    }

    if (accounts.length === 0) {
      console.log('[solanaService] No token accounts found → balance 0');
      return { balance: 0, isPremium: false };
    }

    let totalBalance = 0;
    for (const account of accounts) {
      const uiAmount = account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      totalBalance += uiAmount;
    }

    console.log('[solanaService] Total INSU balance:', totalBalance, '| isPremium:', totalBalance >= MINIMUM_INSU);
    return {
      balance: totalBalance,
      isPremium: totalBalance >= MINIMUM_INSU,
    };
  } catch (error) {
    console.error('[solanaService] checkInsuBalance error:', error);
    return { balance: 0, isPremium: false };
  }
};

/**
 * Shorten a Solana wallet address for display.
 * e.g. "7AYw...cLUo"
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
