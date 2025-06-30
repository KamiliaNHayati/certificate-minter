export interface CertificateData {
  recipientName: string;
  courseName: string;
  issueDate: string;
  description: string;
  imageUrl?: string;
}

export interface MintedCertificate {
  assetId: number;
  txId: string;
  certificateData: CertificateData;
  timestamp: number;
  isTransferred: boolean;          // NEW – used by the UI
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
}