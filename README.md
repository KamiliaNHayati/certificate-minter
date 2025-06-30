# 🏆 Certificate Minter - Algorand NFT Platform

A production-ready decentralized application (dApp) for creating and managing verifiable certificate NFTs on the Algorand blockchain. Issue tamper-proof digital certificates that can be verified, transferred, and permanently stored on-chain.

## ✨ Features

### 🎯 Core Functionality
- **NFT Certificate Creation**: Mint unique certificate NFTs with custom metadata
- **Blockchain Verification**: All certificates are verifiable on Algorand Testnet
- **Certificate Transfer**: Transfer certificates between Algorand addresses
- **Real-time Updates**: Live balance updates and transaction confirmations
- **Transaction History**: View all minted certificates with asset IDs and transaction links

### 🛡️ Security & Reliability
- **Pera Wallet Integration**: Secure wallet connection and transaction signing
- **Error Boundary**: Comprehensive error handling with user-friendly messages
- **Input Validation**: Form validation and address verification
- **Network Verification**: Ensures connection to correct Algorand network

### 🎨 User Experience
- **Modern React UI**: Clean, responsive interface built with React + TypeScript
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Toast Notifications**: Real-time feedback for all user actions
- **Copy-to-Clipboard**: Easy copying of asset IDs and transaction hashes
- **AlgoExplorer Integration**: Direct links to view transactions and assets

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Pera Wallet mobile app or browser extension
- Algorand Testnet account with test ALGO tokens

### Installation & Setup

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:3000`

### Getting Testnet Tokens

1. **Install Pera Wallet:**
   - Mobile: Download from App Store or Google Play
   - Browser: Install Pera Wallet extension

2. **Create/Import Account:**
   - Create a new account or import existing one
   - Switch to Testnet in wallet settings

3. **Get Test Tokens:**
   - Visit [Algorand Testnet Dispenser](https://testnet.algoexplorer.io/dispenser)
   - Enter your wallet address
   - Request test ALGO tokens

## 📱 How to Use

### Step 1: Connect Wallet
- Click "Connect Pera Wallet" button
- Approve connection in your Pera Wallet
- Ensure you're on Algorand Testnet

### Step 2: Create Certificate
- Fill in certificate details:
  - **Recipient Name**: Full name of certificate recipient
  - **Course Name**: Name of course or program
  - **Issue Date**: Date of certificate issuance
  - **Description**: Details about the achievement
  - **Image URL**: (Optional) Custom certificate image

### Step 3: Mint Certificate
- Click "Mint Certificate NFT"
- Review transaction in Pera Wallet
- Approve the transaction
- Wait for blockchain confirmation

### Step 4: Manage Certificates
- View minted certificates in the right panel
- Copy Asset ID or Transaction ID
- View transactions on AlgoExplorer
- Transfer certificates to other addresses

## 🔧 Environment Variables

Create a `.env` file in the root directory (optional):

```env
VITE_ALGORAND_SERVER=https://testnet-api.algonode.cloud
VITE_ALGORAND_PORT=443
VITE_NETWORK=testnet
```

## 🏗️ Build & Deploy

### Build for Production
```bash
npm run build
```

### Lint Code
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Deploy to Vercel
1. Connect your repository to Vercel
2. Configure build settings:
   - Framework Preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

## 🏛️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Blockchain Integration
- **Algorand SDK v3+** for blockchain interactions
- **Pera Wallet Connect** for wallet integration
- **Algorand Testnet** for development and testing

### Project Structure
```
src/
├── components/           # React components
│   ├── ErrorBoundary.tsx    # Error handling
│   ├── Header.tsx           # App header
│   ├── WalletConnection.tsx # Wallet UI
│   ├── CertificateForm.tsx  # Certificate creation
│   ├── MintedCertificates.tsx # Certificate history
│   └── TransferDialog.tsx   # Transfer functionality
├── hooks/               # Custom React hooks
│   └── useWallet.ts     # Wallet management
├── types/               # TypeScript definitions
│   └── certificate.ts   # Certificate interfaces
├── utils/               # Utility functions
│   └── algorand.ts      # Blockchain interactions
├── App.tsx              # Main application
└── main.tsx             # Application entry point
```

### Certificate NFT Structure
```json
{
  "name": "Certificate - Course Name",
  "description": "Certificate description",
  "image": "https://example.com/image.jpg",
  "properties": {
    "recipient": "John Doe",
    "course": "Blockchain Development",
    "issueDate": "2024-01-15",
    "type": "Certificate NFT",
    "issuer": "Certificate Authority"
  },
  "attributes": [
    {
      "trait_type": "Course",
      "value": "Blockchain Development"
    }
  ]
}
```

## 🔐 Security Features

- **Secure Wallet Integration**: All transactions signed through Pera Wallet
- **Input Validation**: Comprehensive form and address validation
- **Error Handling**: Graceful error handling with user feedback
- **Network Verification**: Ensures connection to correct Algorand network
- **Transaction Confirmation**: Waits for blockchain confirmation before updating UI

## 🧪 Testing

The application is configured for Algorand Testnet. For production use:

1. **Update Network Configuration:**
   - Change server to MainNet endpoint
   - Update network references in `src/utils/algorand.ts`
   - Test thoroughly on TestNet first

2. **Security Considerations:**
   - Implement additional access controls if needed
   - Consider multi-signature requirements for high-value certificates
   - Add certificate revocation mechanisms if required

## 📚 Resources

- [Algorand Developer Portal](https://developer.algorand.org/)
- [Algorand SDK Documentation](https://algorand.github.io/js-algorand-sdk/)
- [Pera Wallet Documentation](https://perawallet.app/developers)
- [AlgoExplorer Testnet](https://testnet.algoexplorer.io/)
- [Algorand Testnet Dispenser](https://testnet.algoexplorer.io/dispenser)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly on Testnet
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

## 🆘 Troubleshooting

### Common Issues

**Wallet Connection Issues:**
- Ensure Pera Wallet is installed and set to Testnet
- Try disconnecting and reconnecting your wallet
- Check that you have sufficient ALGO for transaction fees

**Transaction Failures:**
- Verify you have enough ALGO balance (minimum 0.1 ALGO recommended)
- Check network connectivity
- Ensure you're connected to Algorand Testnet

**Build Issues:**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Ensure Node.js version is 18 or higher
- Check for TypeScript errors: `npm run lint`

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your wallet connection and balance
3. Ensure you're on Algorand Testnet
4. Refer to the Algorand Developer documentation

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for the Algorand ecosystem**

*Demo Application - Use Algorand Testnet tokens only*