import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Award, ExternalLink } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import WalletConnection from './components/WalletConnection';
import CertificateForm from './components/CertificateForm';
import MintedCertificates from './components/MintedCertificates';
import { useWallet } from './hooks/useWallet';
import { mintCertificateNFT, fetchCreatedCertificates } from './utils/algorand';
import { CertificateData, MintedCertificate } from './types/certificate';

// Helper: merge two certificate arrays (avoid losing optimistic items)
const mergeCertificates = (prev: MintedCertificate[], next: MintedCertificate[]) => {
  const m = new Map<number, MintedCertificate>();
  prev.forEach(c => m.set(c.assetId, c));
  next.forEach(c => m.set(c.assetId, c));
  return Array.from(m.values()).sort((a, b) => b.assetId - a.assetId);
};

function App() {
  const { walletState, signTransaction, refreshBalance } = useWallet();
  const [certificates, setCertificates] = useState<MintedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // -------------- 1) INITIAL LOAD --------------
  useEffect(() => {
    const loadCertificates = async () => {
      if (walletState.isConnected && walletState.address) {
        setIsLoadingCertificates(true);
        try {
          console.log('Loading certificates from blockchain...');
          const blockchainCertificates = await fetchCreatedCertificates(walletState.address);
          setCertificates(prev => mergeCertificates(prev, blockchainCertificates));
          console.log('Loaded certificates:', blockchainCertificates.length);
        } catch (error) {
          console.error('Error loading certificates:', error);
          showNotification('error', 'Failed to load certificates from blockchain');
        } finally {
          setIsLoadingCertificates(false);
        }
      } else {
        // Clear certificates when wallet disconnects
        setCertificates([]);
      }
    };

    loadCertificates();
  }, [walletState.isConnected, walletState.address]);

  const handleCertificateUpdate = (assetId: number, updates: Partial<MintedCertificate>) => {
    setCertificates(prev => 
      prev.map(cert => 
        cert.assetId === assetId ? { ...cert, ...updates } : cert
      )
    );
  };

  // -------------- 2) REFRESH --------------
  const refreshCertificates = async () => {
    if (!walletState.address) return;
    try {
      const blockchainCertificates = await fetchCreatedCertificates(walletState.address);
      setCertificates(prev => mergeCertificates(prev, blockchainCertificates));
    } catch (error) {
      console.error('Error refreshing certificates:', error);
    }
  };

  // -------------- 3) MINT --------------
  const handleMintCertificate = async (certificateData: CertificateData) => {
    if (!walletState.address || !walletState.isConnected) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await mintCertificateNFT(
        walletState.address,
        certificateData,
        signTransaction
      );

      // Optimistic card so it stays visible
      const optimisticCertificate: MintedCertificate = {
        assetId: result.assetId,
        txId: result.txId,
        certificateData,
        timestamp: Date.now(),
        isTransferred: false
      };
      setCertificates(prev => [optimisticCertificate, ...prev]);

      // Give the Indexer time, then pull canonical data
      setTimeout(() => {
        refreshCertificates();
      }, 10000); // Increased to 10 seconds for better reliability

      // Update ALGO balance
      await refreshBalance();
      
      showNotification(
        'success',
        `Certificate NFT #${result.assetId} created successfully!`
      );
    } catch (error) {
      console.error('Error minting certificate:', error);
      const message = error instanceof Error ? error.message : 'Failed to mint certificate. Please try again.';
      showNotification('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Header />
        
        {/* Notification */}
        {notification && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right duration-300">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        <main className="max-w-6xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Create Verifiable Certificate NFTs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Issue tamper-proof digital certificates on the Algorand blockchain. 
              Each certificate is a unique NFT that can be verified and transferred.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <WalletConnection />
              
              {walletState.isConnected && walletState.address && (
                <CertificateForm 
                  onSubmit={handleMintCertificate}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <MintedCertificates 
                certificates={certificates}
                onCertificateUpdate={handleCertificateUpdate}
                onNotification={showNotification}
                onRefresh={refreshCertificates}
                isLoading={isLoadingCertificates}
              />
              
              {/* Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3">How It Works</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                    <p>Connect your Pera wallet to the Algorand Testnet</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                    <p>Fill in the certificate details (recipient, course, etc.)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <p>Click "Mint Certificate NFT" and approve the transaction</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                    <p>Your certificate NFT is created and stored on Algorand</p>
                  </div>
                </div>
                
                {/* Blockchain Data Notice */}
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>🔗 Live Blockchain Data:</strong> Certificates are loaded directly from the Algorand blockchain using the Indexer API, ensuring accuracy and persistence.
                  </p>
                </div>

                {/* Transfer Instructions */}
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>📤 Transfer Tip:</strong> Recipients must opt-in to the asset before receiving transfers. Ask them to add the Asset ID in their Pera wallet first.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="p-4 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Verifiable</h3>
              <p className="text-gray-600">
                Each certificate is stored on Algorand blockchain, making it tamper-proof and easily verifiable.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Permanent</h3>
              <p className="text-gray-600">
                Certificates are permanently stored on the blockchain and cannot be lost or destroyed.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-xl w-fit mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Transferable</h3>
              <p className="text-gray-600">
                Certificate NFTs can be transferred between wallets while maintaining their authenticity.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 mt-16">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="text-center text-gray-600">
              <p>Built on Algorand Testnet • Powered by Pera Wallet</p>
              <p className="text-sm mt-2">
                This is a demo application. Use Algorand Testnet tokens only.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;