import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export function SolanaWalletProvider({ children }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => {
    const adapters = [new PhantomWalletAdapter()];

    // Only add WalletConnect if a project ID is configured
    if (WALLETCONNECT_PROJECT_ID) {
      try {
        adapters.push(
          new WalletConnectWalletAdapter({
            network,
            options: {
              projectId: WALLETCONNECT_PROJECT_ID,
              metadata: {
                name: 'InsuBuddy',
                description: 'Dein digitaler Versicherungsassistent',
                url: 'https://insubu.netlify.app',
                icons: ['https://insubu.netlify.app/icon.png'],
              },
            },
          })
        );
      } catch (e) {
        console.warn('WalletConnect adapter failed to initialize:', e);
      }
    }

    return adapters;
  }, [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
