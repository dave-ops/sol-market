use solana_program::program_error::ProgramError;
use solana_program::pubkey::Pubkey;

#[derive(Clone, Debug, PartialEq)]
pub struct MarketplaceItem {
    pub is_initialized: bool,
    pub seller: Pubkey,
    pub price: u64,  // Price in lamports (1 SOL = 1_000_000_000 lamports)
    pub is_active: bool,
}

impl MarketplaceItem {
    pub const LEN: usize = 73;  // Size of the struct in bytes (adjust if needed)

    pub fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        if src.len() < Self::LEN {
            return Err(ProgramError::InvalidAccountData);
        }

        let is_initialized = src[0] != 0;
        let seller = Pubkey::new_from_array(
            src[1..33].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        let price = u64::from_le_bytes(
            src[33..41].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        let is_active = src[41] != 0;

        Ok(MarketplaceItem {
            is_initialized,
            seller,
            price,
            is_active,
        })
    }

    pub fn pack_into_slice(&self, dst: &mut [u8]) {
        if dst.len() < Self::LEN {
            panic!("Destination buffer too small");
        }

        dst[0] = self.is_initialized as u8;
        dst[1..33].copy_from_slice(self.seller.as_ref());
        dst[33..41].copy_from_slice(&self.price.to_le_bytes());
        dst[41] = self.is_active as u8;
    }
}