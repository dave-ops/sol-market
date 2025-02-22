use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
    program_pack::{Pack, Sealed},
    system_instruction,
};
use crate::models::marketplace_item::MarketplaceItem;
use crate::repositories::marketplace_item_repository::MarketplaceItemRepository;

// Import or include your repository logic here (you might need to handle async in a different way
// since Solana programs run in a synchronous context on-chain)

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

// Declare the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;  // Buyer's account
    let item_account = next_account_info(account_info_iter)?;  // Item's data account
    let seller = next_account_info(account_info_iter)?;  // Seller's account
    let system_program = next_account_info(account_info_iter)?;  // System program

    // Parse instruction data (0 = list item, 1 = buy item)
    let instruction = instruction_data[0];

    match instruction {
        0 => {
            // List item
            if !payer.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            let price = u64::from_le_bytes(instruction_data[1..9].try_into().map_err(|_| {
                ProgramError::InvalidInstructionData
            })?);

            let rent = Rent::get()?;
            let space = MarketplaceItem::LEN;
            let lamports = rent.minimum_balance(space);

            // Create item account
            solana_program::program::invoke(
                &system_instruction::create_account(
                    payer.key,
                    item_account.key,
                    lamports,
                    space as u64,
                    program_id,
                ),
                &[payer.clone(), item_account.clone(), system_program.clone()],
            )?;

            // Initialize item data on-chain
            let item = MarketplaceItem {
                is_initialized: true,
                seller: *payer.key,
                price,
                is_active: true,
            };
            item.pack_into_slice(&mut item_account.data.borrow_mut());

            msg!("Item listed successfully");

            // Optionally log or persist off-chain (this would require an async runtime or external call)
            // For simplicity, we'll assume this is handled off-chain via a separate service
            // e.g., in a server or client consuming this program
        }
        1 => {
            // Buy item
            if !payer.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            let mut item = MarketplaceItem::unpack_from_slice(&item_account.data.borrow())?;
            
            if !item.is_active || !item.is_initialized {
                return Err(ProgramError::InvalidAccountData);
            }

            // Transfer SOL from buyer to seller
            let transfer_instruction = system_instruction::transfer(
                payer.key,
                &item.seller,
                item.price,
            );

            solana_program::program::invoke(
                &transfer_instruction,
                &[payer.clone(), seller.clone(), system_program.clone()],
            )?;

            // Mark item as sold on-chain
            item.is_active = false;
            item.pack_into_slice(&mut item_account.data.borrow_mut());

            msg!("Item purchased successfully");

            // Optionally log or persist off-chain (handled externally)
        }
        _ => return Err(ProgramError::InvalidInstructionData),
    }

    Ok(())
}

// Tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    #[test]
    fn test_item_size() {
        assert_eq!(MarketplaceItem::LEN, 73);
    }
}