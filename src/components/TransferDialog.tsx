import React, { useState } from 'react';
import { X, Send, User } from 'lucide-react';
import algosdk from 'algosdk';

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (recipientAddress: string) => Promise<void>;
  assetId: number;
  courseName: string;
  isLoading: boolean;
}

const TransferDialog: React.FC<TransferDialogProps> = ({
  isOpen,
  onClose,
  onTransfer,
  assetId,
  courseName,
  isLoading
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [error, setError] = useState('');

  const validateAddress = (address: string): { isValid: boolean; error?: string } => {
    const trimmed = address.trim();
    
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a recipient address' };
    }
    
    if (trimmed.length !== 58) {
      return { 
        isValid: false, 
        error: `Address must be exactly 58 characters (current: ${trimmed.length})` 
      };
    }
    
    try {
      algosdk.decodeAddress(trimmed);
      return { isValid: true };
    } catch {
      return { 
        isValid: false, 
        error: 'Invalid address format or checksum' 
      };
    }
  };

  const handleInputChange = (value: string) => {
    setRecipientAddress(value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    // Real-time validation feedback
    if (value.trim()) {
      const validation = validateAddress(value);
      if (!validation.isValid && validation.error) {
        setError(validation.error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateAddress(recipientAddress);
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid address');
      return;
    }

    try {
      await onTransfer(recipientAddress.trim());
      setRecipientAddress('');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setRecipientAddress('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const validation = validateAddress(recipientAddress);
  const isAddressValid = validation.isValid;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Transfer Certificate</h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            <strong>Certificate:</strong> {courseName}
          </p>
          <p className="text-gray-600">
            <strong>Asset ID:</strong> {assetId}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="recipientAddress" className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Recipient Address
            </label>
            <input
              type="text"
              id="recipientAddress"
              value={recipientAddress}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter complete 58-character Algorand address"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                error ? 'border-red-300 bg-red-50' : 
                recipientAddress.trim() && isAddressValid ? 'border-green-300 bg-green-50' :
                'border-gray-300'
              }`}
              disabled={isLoading}
            />
            
            {/* Character count and validation feedback */}
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${
                recipientAddress.trim().length === 58 ? 'text-green-600' : 'text-gray-500'
              }`}>
                {recipientAddress.trim().length}/58 characters
              </p>
              {recipientAddress.trim() && isAddressValid && (
                <p className="text-xs text-green-600">✓ Valid address</p>
              )}
            </div>
            
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              💡 <strong>Tip:</strong> Copy the full address from AlgoExplorer or your wallet. 
              Algorand addresses are exactly 58 characters and start with A-Z.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isAddressValid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Transfer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferDialog;