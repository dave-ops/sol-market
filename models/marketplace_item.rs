use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
    program_pack::{Pack, Sealed},
};

#[derive(Clone, Debug, PartialEq)]
pub struct MarketplaceItem {
    pub is_initialized: bool,
    pub seller: Pubkey,
    pub price: u64,  // Price in lamports (1 SOL = 1_000_000_000 lamports)
    pub is_active: bool,
}

impl Sealed for MarketplaceItem {}

impl Pack for MarketplaceItem {
    const LEN: usize = 73;  // Size of the struct in bytes

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let mut data = src;
        let is_initialized = data[0] != 0;
        let seller = Pubkey::new_from_array(
            data[1..33].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        let price = u64::from_le_bytes(
            data[33..41].try_into().map_err(|_| ProgramError::InvalidAccountData)?
        );
        let is_active = data[41] != 0;

        Ok(MarketplaceItem {
            is_initialized,
            seller,
            price,
            is_active,
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        dst[0] = self.is_initialized as u8;
        dst[1..33].copy_from_slice(self.seller.as_ref());
        dst[33..41].copy_from_slice(&self.price.to_le_bytes());
        dst[41] = self.is_active as u8;
    }
}