import { useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { WalletState } from '../types/certificate';
import { getAccountBalance } from '../utils/algorand';
import algosdk from 'algosdk';

const peraWallet = new PeraWalletConnect();

// Define SignerTransaction type for Pera Wallet
interface SignerTransaction {
  txn: algosdk.Transaction;
  signers?: string[];
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: 0
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          const balance = await getAccountBalance(address);
          setWalletState({
            isConnected: true,
            address,
            balance
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Listen for wallet events
  useEffect(() => {
    const handleDisconnect = () => {
      setWalletState({
        isConnected: false,
        address: null,
        balance: 0
      });
    };

    peraWallet.connector?.on('disconnect', handleDisconnect);

    return () => {
      if (peraWallet.connector?.off) {
        peraWallet.connector.off('disconnect', handleDisconnect);
      }
    };
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const accounts = await peraWallet.connect();
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const balance = await getAccountBalance(address);
        setWalletState({
          isConnected: true,
          address,
          balance
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await peraWallet.disconnect();
      setWalletState({
        isConnected: false,
        address: null,
        balance: 0
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const signTransaction = async (
    groups: SignerTransaction[][]
  ): Promise<Uint8Array[]> => {
    if (!walletState.address) throw new Error('Wallet not connected');
    
    console.log('Signing transaction groups:', groups);
    const result = await peraWallet.signTransaction(groups);
    console.log('Transaction signed successfully');
    return result;
  };

  const refreshBalance = async () => {
    if (walletState.address) {
      try {
        const balance = await getAccountBalance(walletState.address);
        setWalletState(prev => ({ ...prev, balance }));
      } catch (error) {
        console.error('Error refreshing balance:', error);
      }
    }
  };

  return {
    walletState,
    isConnecting,
    connectWallet,
    disconnectWallet,
    signTransaction,
    refreshBalance
  };
};