const INSU_MINT = 'AuHzjKyKAiWzjk13Ry9BovBeFxDRPyien166TTxXpump';
const MINIMUM_INSU = 1_000_000; // UI amount — RPC jsonParsed handles decimals
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

/**
 * Check how many $INSU tokens a wallet holds.
 * Uses jsonParsed encoding so uiAmount is already decimal-adjusted.
 * Returns { balance: number, isPremium: boolean }
 */
export const checkInsuBalance = async (walletAddress) => {
  try {
    const response = await fetch(SOLANA_RPC, {
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
    const accounts = data?.result?.value ?? [];

    if (accounts.length === 0) {
      return { balance: 0, isPremium: false };
    }

    // Sum across all token accounts (usually just one)
    let totalBalance = 0;
    for (const account of accounts) {
      const uiAmount = account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      totalBalance += uiAmount;
    }

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
