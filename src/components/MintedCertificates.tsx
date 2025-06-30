import React, { useState } from 'react';
import { Award, ExternalLink, Copy, CheckCircle, Send, RefreshCw } from 'lucide-react';
import { MintedCertificate } from '../types/certificate';
import TransferDialog from './TransferDialog';
import { useWallet } from '../hooks/useWallet';
import { transferCertificateNFT } from '../utils/algorand';

interface MintedCertificatesProps {
  certificates: MintedCertificate[];
  onCertificateUpdate: (assetId: number, updates: Partial<MintedCertificate>) => void;
  onNotification: (type: 'success' | 'error', message: string) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const MintedCertificates: React.FC<MintedCertificatesProps> = ({ 
  certificates, 
  onCertificateUpdate,
  onNotification,
  onRefresh,
  isLoading
}) => {
  const { walletState, signTransaction } = useWallet();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transferDialog, setTransferDialog] = useState<{
    isOpen: boolean;
    assetId: number;
    courseName: string;
  }>({ isOpen: false, assetId: 0, courseName: '' });
  const [isTransferring, setIsTransferring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      onNotification('success', 'Certificates refreshed from blockchain');
    } catch (error) {
      onNotification('error', 'Failed to refresh certificates');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTransfer = async (recipientAddress: string) => {
    if (!walletState.address) {
      throw new Error('Wallet not connected');
    }

    // Debug logging
    console.log('handleTransfer called with:', {
      recipientAddress,
      walletAddress: walletState.address,
      assetId: transferDialog.assetId,
      recipientLength: recipientAddress.length,
      recipientTrimmed: recipientAddress.trim()
    });

    setIsTransferring(true);
    try {
      const result = await transferCertificateNFT(
        walletState.address,
        recipientAddress,
        transferDialog.assetId,
        signTransaction
      );

      // Refresh certificates from blockchain to get updated ownership status
      await onRefresh();
      onNotification('success', `Certificate transferred successfully! Transaction: ${result.txId}`);
    } catch (error) {
      console.error('Transfer error in component:', error);
      const message = error instanceof Error ? error.message : 'Transfer failed';
      onNotification('error', message);
      throw error;
    } finally {
      setIsTransferring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="p-4 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Certificates</h3>
          <p className="text-gray-600">
            Fetching your certificates from the Algorand blockchain...
          </p>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="p-4 bg-gray-100 rounded-xl w-fit mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Certificates Yet</h3>
          <p className="text-gray-600">
            Minted certificates will appear here once you create them
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Minted Certificates</h3>
              <p className="text-gray-600">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} created</p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh from blockchain"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          {certificates.map((cert) => (
            <div key={cert.assetId} className={`border rounded-xl p-6 transition-colors ${
              cert.isTransferred ? 'border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {cert.certificateData.courseName}
                  </h4>
                  <p className="text-gray-600 mb-2">
                    Recipient: <span className="font-medium">{cert.certificateData.recipientName}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Issued: {new Date(cert.certificateData.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                    cert.isTransferred 
                      ? 'bg-gray-100 text-gray-600' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    {cert.isTransferred ? 'Transferred' : 'Owned'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Asset ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white px-2 py-1 rounded border">
                      {cert.assetId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(cert.assetId.toString(), `asset-${cert.assetId}`)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy Asset ID"
                    >
                      {copiedId === `asset-${cert.assetId}` ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://testnet.algoexplorer.io/asset/${cert.assetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                      title="View Asset on AlgoExplorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Transaction:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white px-2 py-1 rounded border">
                      {cert.txId.slice(0, 8)}...{cert.txId.slice(-8)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(cert.txId, `tx-${cert.txId}`)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy Transaction ID"
                    >
                      {copiedId === `tx-${cert.txId}` ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://testnet.algoexplorer.io/tx/${cert.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                      title="View Transaction on AlgoExplorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {cert.certificateData.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {cert.certificateData.description}
                  </p>
                </div>
              )}

              {!cert.isTransferred && walletState.isConnected && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      console.log('Opening transfer dialog for asset:', cert.assetId);
                      setTransferDialog({
                        isOpen: true,
                        assetId: cert.assetId,
                        courseName: cert.certificateData.courseName
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Transfer Certificate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <TransferDialog
        isOpen={transferDialog.isOpen}
        onClose={() => {
          console.log('Closing transfer dialog');
          setTransferDialog({ isOpen: false, assetId: 0, courseName: '' });
        }}
        onTransfer={handleTransfer}
        assetId={transferDialog.assetId}
        courseName={transferDialog.courseName}
        isLoading={isTransferring}
      />
    </>
  );
};

export default MintedCertificates;