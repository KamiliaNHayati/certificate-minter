"""
CertificateMinter - Algorand Smart Contract for issuing NFT certificates

This smart contract allows an admin to issue NFT certificates to students.
Only the admin (contract creator) can issue certificates.
"""

from algopy import (
    Account,
    ARC4Contract, 
    Txn,
    UInt64,
    arc4,
    itxn,
    subroutine,
)


class CertificateMinter(ARC4Contract):
    """Smart contract for minting certificate NFTs"""
    
    def __init__(self) -> None:
        # Global state variables
        self.admin = Account()
        self.last_nft_id = UInt64(0)
    
    @arc4.abimethod(create="require")
    def create(self) -> None:
        """
        Create method called when the app is deployed.
        Sets the admin to the contract creator.
        """
        self.admin = Txn.sender
    
    @arc4.abimethod
    def issue_certificate(
        self, 
        student: Account, 
        certificate_url: arc4.String
    ) -> arc4.UInt64:
        """
        Issue a certificate NFT to a student.
        
        Args:
            student: The account to receive the certificate NFT
            certificate_url: The URL/metadata for the certificate
            
        Returns:
            The asset ID of the newly created NFT
            
        Security:
            Only the admin can call this method
        """
        # Security check - only admin can issue certificates
        assert Txn.sender == self.admin, "Only admin can issue certificates"
        
        # Create atomic group of three inner transactions
        itxn.begin()
        
        # Transaction 1: Create NFT asset
        itxn.AssetConfig(
            config_asset_total=1,  # NFT has total supply of 1
            config_asset_decimals=0,  # NFTs have 0 decimals
            config_asset_manager=self.admin,  # Admin can manage the asset
            config_asset_freeze=self.admin,   # Admin can freeze transfers
            config_asset_clawback=self.admin, # Admin can clawback
            config_asset_url=certificate_url.native,  # Certificate metadata URL
            config_asset_name=b"Certificate NFT",  # Asset name
            config_asset_unit_name=b"CERT",  # Asset unit name
        ).submit()
        
        # Store the created asset ID
        created_asset_id = itxn.AssetConfig.created_asset_id()
        self.last_nft_id = created_asset_id
        
        # Transaction 2: Student opt-in to the new asset
        itxn.AssetTransfer(
            xfer_asset=created_asset_id,
            asset_receiver=student,
            asset_amount=0,  # 0 amount means opt-in
        ).submit()
        
        # Transaction 3: Transfer the NFT to the student
        itxn.AssetTransfer(
            xfer_asset=created_asset_id,
            asset_receiver=student,
            asset_amount=1,  # Transfer the 1 NFT
        ).submit()
        
        # Return the asset ID of the newly created NFT
        return arc4.UInt64(created_asset_id)
    
    @arc4.abimethod(readonly=True)
    def get_admin(self) -> Account:
        """Get the admin address"""
        return self.admin
    
    @arc4.abimethod(readonly=True) 
    def get_last_nft_id(self) -> arc4.UInt64:
        """Get the last issued NFT asset ID"""
        return arc4.UInt64(self.last_nft_id)