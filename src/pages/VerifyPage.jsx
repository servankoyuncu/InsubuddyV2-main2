import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, ExternalLink, Shield, Calendar, Building, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

const NFT_NETWORK = import.meta.env.VITE_NFT_NETWORK || 'devnet';

function getExplorerUrl(txSignature) {
  if (!txSignature || txSignature.startsWith('insubuddy://')) return null;
  return `https://explorer.solana.com/tx/${txSignature}${NFT_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`;
}

function shortenAddress(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function VerifyPage() {
  const { policyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [ipfsMeta, setIpfsMeta] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch certificate from DB
        const { data, error: dbErr } = await supabase
          .from('policy_nfts')
          .select('*')
          .eq('policy_id', policyId)
          .single();

        if (dbErr || !data) {
          setError('Kein Zertifikat für diese Police gefunden.');
          return;
        }

        setCert(data);

        // Load IPFS metadata if available
        const ipfsUri = data.ipfs_uri;
        if (ipfsUri && !ipfsUri.startsWith('insubuddy://')) {
          try {
            const res = await fetch(ipfsUri);
            if (res.ok) {
              setIpfsMeta(await res.json());
            }
          } catch {
            // IPFS fetch failed — cert still valid via DB
          }
        }
      } catch (err) {
        setError(err.message || 'Fehler beim Laden des Zertifikats.');
      } finally {
        setLoading(false);
      }
    };

    if (policyId) load();
  }, [policyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Zertifikat wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nicht gefunden</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const attrs = ipfsMeta?.attributes || [];
  const getAttr = (traitType) => attrs.find(a => a.trait_type === traitType)?.value || '–';
  const explorerUrl = getExplorerUrl(cert?.tx_signature);
  const mintedDate = cert?.minted_at ? new Date(cert.minted_at).toLocaleDateString('de-CH') : '–';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img src="/icons/appstore.png" alt="InsuBuddy" className="w-9 h-9 rounded-xl" />
          <div>
            <div className="font-bold text-gray-900 text-sm">InsuBuddy</div>
            <div className="text-xs text-gray-500">Versicherungszertifikat</div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {/* Verified Badge */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Verifiziert</h1>
          <p className="text-gray-500 text-sm">
            Dieses Versicherungszertifikat wurde von InsuBuddy verifiziert und ist unveränderlich gespeichert.
          </p>
        </div>

        {/* Policy Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Versicherungsdetails</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Versicherungstyp</div>
              <div className="font-medium text-gray-900">
                {getAttr('Versicherungstyp')}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Anbieter</div>
              <div className="font-medium text-gray-900 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                {getAttr('Anbieter')}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Prämie</div>
              <div className="font-medium text-gray-900">{getAttr('Prämie')}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Ablaufdatum</div>
              <div className="font-medium text-gray-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {getAttr('Ablaufdatum')}
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Zertifikatsinformationen</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ausgestellt am</span>
              <span className="font-medium text-gray-900">{mintedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Wallet-Adresse</span>
              <span className="font-mono text-xs text-gray-700">
                {shortenAddress(cert?.wallet_address)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Netzwerk</span>
              <span className="font-medium text-gray-900 capitalize">
                {NFT_NETWORK === 'devnet' ? 'Solana Devnet' : 'Solana Mainnet'}
              </span>
            </div>
            {cert?.ipfs_hash && !cert.ipfs_hash.startsWith('insubuddy') && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">IPFS Hash</span>
                <a
                  href={cert.ipfs_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-violet-600 hover:underline flex items-center gap-1"
                >
                  {cert.ipfs_hash.slice(0, 12)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Explorer Link */}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Auf Solana Explorer ansehen
          </a>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Dieses Zertifikat wurde automatisch durch InsuBuddy ausgestellt.<br />
          <a href="https://insubu.netlify.app" className="underline hover:opacity-70">insubu.netlify.app</a>
        </p>
      </div>
    </div>
  );
}
