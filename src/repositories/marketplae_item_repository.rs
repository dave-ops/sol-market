use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
};

use crate::models::marketplace_item::MarketplaceItem;

pub fn list_item(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    price: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    let item_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !payer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    solana_program::program::invoke(
        &system_instruction::create_account(
            payer.key,
            item_account.key,
            1_000_000,  // Minimum balance (adjust as needed)
            MarketplaceItem::LEN as u64,
            program_id,
        ),
        &[payer.clone(), item_account.clone(), system_program.clone()],
    )?;

    let item = MarketplaceItem {
        is_initialized: true,
        seller: *payer.key,
        price,
        is_active: true,
    };
    item.pack_into_slice(&mut item_account.data.borrow_mut());

    Ok(())
}

pub fn buy_item(
    accounts: &[AccountInfo],
    item_account: &AccountInfo,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let buyer = next_account_info(account_info_iter)?;
    let seller = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !buyer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut item = MarketplaceItem::unpack_from_slice(&item_account.data.borrow())?;
    if !item.is_active || !item.is_initialized {
        return Err(ProgramError::InvalidAccountData);
    }

    solana_program::program::invoke(
        &system_instruction::transfer(
            buyer.key,
            seller.key,
            item.price,
        ),
        &[buyer.clone(), seller.clone(), system_program.clone()],
    )?;

    item.is_active = false;
    item.pack_into_slice(&mut item_account.data.borrow_mut());

    Ok(())
}