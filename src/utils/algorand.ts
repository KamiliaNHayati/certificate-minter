import algosdk from 'algosdk';
import { CertificateData, MintedCertificate } from '../types/certificate';

// Algorand Testnet configuration
export const ALGORAND_CONFIG = {
  server: 'https://testnet-api.algonode.cloud',
  port: 443,
  token: '',
  network: 'testnet'
};

// Create Algod client
export const algodClient = new algosdk.Algodv2(
  ALGORAND_CONFIG.token,
  ALGORAND_CONFIG.server,
  ALGORAND_CONFIG.port
);

// Create Indexer client for querying blockchain data
export const indexerClient = new algosdk.Indexer(
  '',
  'https://testnet-idx.algonode.cloud',
  443
);

// Define SignerTransaction type for Pera Wallet
interface SignerTransaction {
  txn: algosdk.Transaction;
  signers?: string[];
}

// Create certificate metadata JSON
export const createCertificateMetadata = (data: CertificateData) => {
  return {
    name: `Certificate - ${data.courseName}`,
    description: data.description,
    image: data.imageUrl || 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=800',
    properties: {
      recipient: data.recipientName,
      course: data.courseName,
      issueDate: data.issueDate,
      type: 'Certificate NFT',
      issuer: 'Certificate Authority'
    },
    external_url: 'https://certificate-minter.demo',
    attributes: [
      {
        trait_type: 'Course',
        value: data.courseName
      },
      {
        trait_type: 'Recipient',
        value: data.recipientName
      },
      {
        trait_type: 'Issue Date',
        value: data.issueDate
      }
    ]
  };
};

// Parse certificate metadata from asset URL
const parseCertificateMetadata = (assetUrl: string): CertificateData | null => {
  try {
    if (assetUrl.startsWith('data:application/json;base64,')) {
      const base64Data = assetUrl.replace('data:application/json;base64,', '');
      const jsonString = atob(base64Data);
      const metadata = JSON.parse(jsonString);
      
      if (metadata.properties) {
        return {
          recipientName: metadata.properties.recipient || 'Unknown',
          courseName: metadata.properties.course || 'Unknown Course',
          issueDate: metadata.properties.issueDate || new Date().toISOString().split('T')[0],
          description: metadata.description || 'Certificate NFT',
          imageUrl: metadata.image
        };
      }
    }
  } catch (error) {
    console.warn('Failed to parse certificate metadata:', error);
  }
  return null;
};

// Fetch created certificate assets from blockchain
export const fetchCreatedCertificates = async (walletAddress: string): Promise<MintedCertificate[]> => {
  try {
    console.log('🔍 Fetching created certificates for address:', walletAddress);
    
    // Get all assets created by this address with pagination
    let nextToken = '';
    let allCreatedAssets: any[] = [];
    
    do {
      const params: any = { limit: 1000 };
      if (nextToken) params['next'] = nextToken;
      
      const createdAssetsResponse = await indexerClient
        .lookupAccountCreatedAssets(walletAddress)
        .do();
      
      const assets = createdAssetsResponse['created-assets'] || [];
      allCreatedAssets = allCreatedAssets.concat(assets);
      nextToken = createdAssetsResponse['next-token'] || '';
      
      console.log(`📦 Found ${assets.length} created assets (batch)`);
    } while (nextToken);
    
    console.log(`📦 Total created assets found: ${allCreatedAssets.length}`);
    
    // Filter for certificate NFTs (unit name 'CERT' and total supply 1)
    const certificateAssets = allCreatedAssets.filter((asset: any) => {
      const isNFT = asset.params.total === 1;
      const isCert = asset.params['unit-name'] === 'CERT';
      const hasName = asset.params.name && asset.params.name.includes('Certificate');
      
      console.log(`Asset ${asset.index}: NFT=${isNFT}, CERT=${isCert}, HasName=${hasName}`);
      return isNFT && (isCert || hasName);
    });
    
    console.log(`🏆 Certificate assets found: ${certificateAssets.length}`);
    
    // Convert to MintedCertificate format
    const certificates: MintedCertificate[] = [];
    
    for (const asset of certificateAssets) {
      try {
        console.log(`🔄 Processing asset ${asset.index}...`);
        
        // Parse metadata from asset URL
        const assetUrl = asset.params.url || '';
        let certificateData = parseCertificateMetadata(assetUrl);
        
        // Fallback: create certificate data from asset name if metadata parsing fails
        if (!certificateData && asset.params.name) {
          const courseName = asset.params.name.replace('Certificate - ', '') || 'Unknown Course';
          certificateData = {
            recipientName: 'Unknown Recipient',
            courseName,
            issueDate: new Date().toISOString().split('T')[0],
            description: `Certificate for ${courseName}`,
            imageUrl: ''
          };
        }
        
        if (certificateData) {
          // Get asset creation transaction
          let txId = '';
          try {
            const assetTxns = await indexerClient
              .lookupAssetTransactions(asset.index)
              .txType('acfg')
              .limit(1)
              .do();
            
            const creationTxn = assetTxns.transactions?.[0];
            txId = creationTxn?.id || `asset-${asset.index}`;
          } catch (txError) {
            console.warn(`Could not fetch transaction for asset ${asset.index}:`, txError);
            txId = `asset-${asset.index}`;
          }
          
          // Check if asset is still owned by creator (not transferred)
          let isTransferred = false;
          try {
            const accountAssets = await indexerClient
              .lookupAccountAssets(walletAddress)
              .assetId(asset.index)
              .do();
            
            isTransferred = !accountAssets.assets?.some((a: any) => 
              a['asset-id'] === asset.index && a.amount > 0
            );
          } catch (assetError) {
            console.warn(`Could not check ownership for asset ${asset.index}:`, assetError);
            // Assume not transferred if we can't check
            isTransferred = false;
          }
          
          const certificate: MintedCertificate = {
            assetId: Number(asset.index), // Convert BigInt to number
            txId,
            certificateData,
            timestamp: Date.now(), // Use current time as fallback
            isTransferred
          };
          
          certificates.push(certificate);
          console.log(`✅ Added certificate: ${certificateData.courseName} (Asset ${asset.index})`);
        } else {
          console.warn(`❌ Could not parse certificate data for asset ${asset.index}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to process asset ${asset.index}:`, error);
      }
    }
    
    // Sort by asset ID (newest first, assuming higher asset IDs are newer)
    certificates.sort((a, b) => b.assetId - a.assetId);
    
    console.log(`🎉 Successfully processed ${certificates.length} certificates`);
    return certificates;
    
  } catch (error) {
    console.error('❌ Error fetching created certificates:', error);
    
    // If indexer fails, try to get basic account info
    try {
      console.log('🔄 Fallback: Checking account info...');
      const accountInfo = await algodClient.accountInformation(walletAddress).do();
      console.log('Account info:', {
        address: accountInfo.address,
        balance: accountInfo.amount,
        createdAssets: accountInfo['created-assets']?.length || 0,
        assets: accountInfo.assets?.length || 0
      });
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
    
    return [];
  }
};

// Get account balance
export const getAccountBalance = async (address: string): Promise<number> => {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return Number(accountInfo.amount) / 1000000;
  } catch (error) {
    console.error('Error getting account balance:', error);
    return 0;
  }
};

// Create and mint certificate NFT
export const mintCertificateNFT = async (
  senderAddress: string,
  certificateData: CertificateData,
  signTransaction: (signerTransactions: SignerTransaction[][]) => Promise<Uint8Array[]>
): Promise<{ assetId: number; txId: string }> => {
  try {
    // Validate sender address
    if (!senderAddress || senderAddress.trim() === '') {
      throw new Error('Wallet address is required. Please ensure your wallet is properly connected.');
    }
    
    try {
      algosdk.decodeAddress(senderAddress);
    } catch (addressError) {
      throw new Error('Invalid wallet address format. Please reconnect your wallet.');
    }

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Check account balance
    const balance = await getAccountBalance(senderAddress);
    const estimatedFee = (Number(suggestedParams.fee) + 100000) / 1000000;

    if (balance < estimatedFee + 0.1) {
      throw new Error(`Insufficient balance. Need at least ${estimatedFee + 0.1} ALGO, but have ${balance} ALGO`);
    }
    
    // Create certificate metadata
    const metadata = createCertificateMetadata(certificateData);
    const metadataJSON = JSON.stringify(metadata);
    
    // Create asset creation transaction
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      suggestedParams: {
        ...suggestedParams,
        fee: 1000,
        flatFee: true
      },
      defaultFrozen: false,
      unitName: 'CERT',
      assetName: `Certificate - ${certificateData.courseName}`.slice(0, 32),
      manager: senderAddress,
      reserve: senderAddress,
      freeze: senderAddress,
      clawback: senderAddress,
      assetURL: `data:application/json;base64,${btoa(metadataJSON)}`.slice(0, 96),
      total: 1,
      decimals: 0,
    });

    // Sign transaction
    const signerTransactions: SignerTransaction[][] = [[{ txn: assetCreateTxn }]];
    const signedTxnResult = await signTransaction(signerTransactions);
    const signedTxn = signedTxnResult[0];

    // Submit transaction
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txid, 8);
    
    // Get asset ID and ensure it's a number
    const assetId = confirmedTxn['assetIndex'] ?? 
                   confirmedTxn['asset-index'] ?? 
                   confirmedTxn['created-asset-index'];

    if (!assetId) {
      throw new Error('Asset index missing – creation failed. See console for full node response.');
    }

    // Convert BigInt to number if necessary
    const assetIdNumber = Number(assetId);
    
    if (!Number.isFinite(assetIdNumber)) {
      throw new Error('Invalid asset ID returned from blockchain');
    }

    console.log(`🎉 Certificate NFT created successfully! Asset ID: ${assetIdNumber}, Transaction: ${txid}`);
    return { assetId: assetIdNumber, txId: txid };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Wallet address is required') || error.message.includes('Invalid wallet address')) {
        throw error;
      } else if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction. Please ensure you have enough ALGO for fees.');
      } else if (error.message.includes('rejected')) {
        throw new Error('Transaction was rejected. Please try again.');
      } else if (error.message.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Minting failed: ${error.message}`);
      }
    }
    
    throw new Error('Failed to mint certificate NFT. Please try again.');
  }
};

// Transfer certificate NFT
export const transferCertificateNFT = async (
  senderAddress: string,
  recipientAddress: string,
  assetId: number | bigint,
  signTransaction: (signerTransactions: SignerTransaction[][]) => Promise<Uint8Array[]>
): Promise<{ txId: string }> => {
  try {
    // Debug logging
    console.log('Transfer parameters:', {
      senderAddress,
      recipientAddress,
      assetId,
      assetIdType: typeof assetId,
      senderType: typeof senderAddress,
      recipientType: typeof recipientAddress
    });

    // Convert assetId to number if it's a BigInt
    const assetIdNumber = Number(assetId);
    
    // Validate the conversion
    if (!Number.isFinite(assetIdNumber)) {
      throw new Error('Invalid asset ID - cannot convert to number');
    }

    console.log('Converted assetId:', assetIdNumber, typeof assetIdNumber);

    // Validate addresses
    if (!senderAddress || senderAddress.trim() === '') {
      throw new Error('Sender address is required');
    }

    if (!recipientAddress || recipientAddress.trim() === '') {
      throw new Error('Recipient address is required');
    }

    const trimmedSender = senderAddress.trim();
    const trimmedRecipient = recipientAddress.trim();

    // Validate address format
    try {
      algosdk.decodeAddress(trimmedSender);
      algosdk.decodeAddress(trimmedRecipient);
    } catch {
      throw new Error('Invalid Algorand address format');
    }

    if (assetIdNumber <= 0) {
      throw new Error('Invalid asset ID');
    }

    /* PRE-CHECK: has the recipient opted-in? */
    try {
      const recAssets = await indexerClient
        .lookupAccountAssets(trimmedRecipient)
        .assetId(assetIdNumber)
        .do();
      
      const optedIn = recAssets?.assets?.some((a: any) => a['asset-id'] === assetIdNumber);
      if (!optedIn) {
        throw new Error(
          'Recipient has not opted-in to this asset yet. Ask them to opt-in with a 0-amount transfer first.'
        );
      }
    } catch (optInError) {
      // If we can't check opt-in status, proceed anyway (might be a network issue)
      console.warn('Could not verify opt-in status:', optInError);
    }

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Debug the transaction parameters before creating the transaction
    console.log('Creating transfer transaction with:', {
      from: trimmedSender,
      to: trimmedRecipient,
      assetIndex: assetIdNumber,
      amount: 1,
      suggestedParams: suggestedParams
    });

    // Create asset transfer transaction with explicit parameter names
    const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: trimmedSender,
      to: trimmedRecipient,
      assetIndex: assetIdNumber, // Ensure this is a plain number
      amount: 1, // Keep as plain number
      suggestedParams: suggestedParams
    });

    console.log('Transaction created successfully:', assetTransferTxn);

    // Sign transaction
    const signerTransactions: SignerTransaction[][] = [[{ txn: assetTransferTxn }]];
    const signedTxnResult = await signTransaction(signerTransactions);
    const signedTxn = signedTxnResult[0];

    // Submit transaction
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txid, 8);

    console.log(`🎉 Certificate transferred successfully! Transaction: ${txid}`);
    return { txId: txid };
  } catch (error) {
    console.error('Transfer error details:', error);
    if (error instanceof Error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
    throw new Error('Failed to transfer certificate NFT');
  }
};

// Get asset information
export const getAssetInfo = async (assetId: number) => {
  try {
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    return assetInfo;
  } catch (error) {
    console.error('Error getting asset info:', error);
    return null;
  }
};