import React from 'react';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

const WalletConnection: React.FC = () => {
  const { walletState, isConnecting, connectWallet, disconnectWallet, refreshBalance } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (!walletState.isConnected) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="p-4 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-6">
            Connect your Pera wallet to start minting certificate NFTs
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Connect Pera Wallet
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Wallet Connected</p>
            <p className="text-sm text-gray-600">
              {walletState.address?.slice(0, 8)}...{walletState.address?.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4">
            <p className="text-sm text-gray-600">Balance</p>
            <p className="font-semibold text-gray-900">{walletState.balance.toFixed(2)} ALGO</p>
          </div>
          <button
            onClick={refreshBalance}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh balance"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={disconnectWallet}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Disconnect wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletConnection;