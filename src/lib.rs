use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};

mod models {
    pub mod marketplace_item;
}

mod repositories {
    pub mod marketplace_item_repository;
}

use repositories::marketplace_item_repository::{buy_item, list_item, transfer_sol};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    let item_account = next_account_info(account_info_iter)?;
    let seller = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

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

            list_item(program_id, &[payer.clone(), item_account.clone(), system_program.clone()], price)
        }
        1 => {
            // Buy item
            if !payer.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            buy_item(&[payer.clone(), seller.clone(), system_program.clone(), item_account.clone()], item_account)
        }
        2 => {
            // Transfer SOL
            if !payer.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            // Expect amount in lamports (8 bytes after instruction byte)
            if instruction_data.len() < 9 {
                return Err(ProgramError::InvalidInstructionData);
            }
            let amount = u64::from_le_bytes(instruction_data[1..9].try_into().map_err(|_| {
                ProgramError::InvalidInstructionData
            })?);

            transfer_sol(&[payer.clone(), seller.clone(), system_program.clone()], amount)
        }
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::marketplace_item::MarketplaceItem;
    use solana_program::clock::Epoch;

    #[test]
    fn test_item_size() {
        assert_eq!(MarketplaceItem::LEN, 73);
    }
}