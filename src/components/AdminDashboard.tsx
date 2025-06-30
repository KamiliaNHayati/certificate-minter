import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { Shield, User, Link, Send, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { CertificateMinterClient } from '../../smart_contracts/artifacts/certificate_minter/certificate_minter_client';
import algosdk from 'algosdk';

const APP_ID = parseInt(import.meta.env.VITE_APP_ID || '0');

const AdminDashboard: React.FC = () => {
  const { providers, activeAccount, signer, isReady, algodClient } = useWallet();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminAddress, setAdminAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [studentAddress, setStudentAddress] = useState<string>('');
  const [certificateUrl, setCertificateUrl] = useState<string>('');
  const [isIssuing, setIsIssuing] = useState<boolean>(false);
  const [lastTxId, setLastTxId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Memoize the contract client to avoid re-creating it on every render
  const client = useMemo(() => {
    if (!activeAccount || !algodClient) return null;

    return new CertificateMinterClient({
      appId: APP_ID,
      sender: { addr: activeAccount.address, signer },
      algod: algodClient
    });
  }, [activeAccount, algodClient, signer]);

  // Check if connected wallet is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!client || !isReady) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Use getGlobalState to read the 'admin' variable
        const state = await client.getGlobalState();
        const adminState = state.admin?.asAddress();

        if (adminState) {
          const adminAddr = algosdk.encodeAddress(adminState);
          setAdminAddress(adminAddr);
          setIsAdmin(activeAccount?.address === adminAddr);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to verify admin status');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [client, isReady, activeAccount]);

  const handleIssueCertificate = async () => {
    if (!studentAddress || !certificateUrl) {
      setError('Please fill in all fields');
      return;
    }

    if (!algosdk.isValidAddress(studentAddress)) {
      setError('Invalid student address');
      return;
    }

    setIsIssuing(true);
    setError('');
    setSuccess('');

    try {
      // Use the memoized client
      if (!client) {
        throw new Error('Contract client not available');
      }

      const result = await client.issueCertificate({
        student: studentAddress,
        certificate_url: certificateUrl // The argument name in the contract is certificate_url
      });

      setLastTxId(result.transaction.txID());
      setSuccess(`Certificate issued successfully! Review transaction ${result.transaction.txID()}`);
      setStudentAddress('');
      setCertificateUrl('');
    } catch (err) {
      console.error('Error issuing certificate:', err);
      setError('Failed to issue certificate. Please try again.');
    } finally {
      setIsIssuing(false);
    }
  };

  const connectWallet = async () => {
    try {
      const peraWallet = providers?.find(p => p.metadata.name === 'Pera');
      if (peraWallet) {
        await peraWallet.connect();
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-xl w-fit mx-auto mb-6">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Pera wallet to access the admin dashboard.
            </p>
            <button
              onClick={connectWallet}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Connect Pera Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-xl w-fit mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You are not authorized to access this admin dashboard.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Your Address:</strong>
              </p>
              <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                {activeAccount.address}
              </code>
              <p className="text-sm text-gray-600 mt-3 mb-2">
                <strong>Admin Address:</strong>
              </p>
              <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                {adminAddress}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Certificate Minter Control Panel</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Connected as Admin</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {activeAccount.address.slice(0, 8)}...{activeAccount.address.slice(-8)}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Issue Certificate Form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Issue Certificate</h2>
              <p className="text-gray-600">Create and send an NFT certificate to a student</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Student Address Input */}
            <div>
              <label htmlFor="studentAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Student Address
              </label>
              <input
                type="text"
                id="studentAddress"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                placeholder="Enter student's Algorand address"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isIssuing}
              />
              <p className="text-xs text-gray-500 mt-1">
                The Algorand address of the student who will receive the certificate
              </p>
            </div>

            {/* Certificate URL Input */}
            <div>
              <label htmlFor="certificateUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                <Link className="w-4 h-4 inline mr-2" />
                Certificate URL
              </label>
              <input
                type="url"
                id="certificateUrl"
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
                placeholder="https://example.com/certificate-metadata.json"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isIssuing}
              />
              <p className="text-xs text-gray-500 mt-1">
                URL pointing to the certificate metadata (JSON format recommended)
              </p>
            </div>

            {/* Issue Button */}
            <button
              onClick={handleIssueCertificate}
              disabled={isIssuing || !studentAddress || !certificateUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
            >
              {isIssuing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Issuing Certificate...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Issue Certificate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Transaction History */}
        {lastTxId && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Latest Transaction</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Transaction ID:</p>
              <code className="text-sm bg-white px-3 py-2 rounded border break-all block">
                {lastTxId}
              </code>
              <a
                href={`https://testnet.algoexplorer.io/tx/${lastTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mt-3 font-medium"
              >
                View on AlgoExplorer
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;