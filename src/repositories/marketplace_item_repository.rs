use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    program::invoke,
    rent::Rent,
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

    // Calculate proper rent exemption
    let rent = Rent::default();
    let rent_exemption = rent.minimum_balance(MarketplaceItem::LEN);

    invoke(
        &system_instruction::create_account(
            payer.key,
            item_account.key,
            rent_exemption,  // Use calculated rent instead of hardcoded value
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

    invoke(
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

pub fn transfer_sol(
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let from = next_account_info(account_info_iter)?;  // Sender (payer)
    let to = next_account_info(account_info_iter)?;    // Receiver (seller)
    let system_program = next_account_info(account_info_iter)?;

    if !from.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Ensure the sender has enough funds (you can add balance checking if needed)
    let sender_balance = from.lamports();
    if sender_balance < amount {
        return Err(ProgramError::InsufficientFunds);
    }

    invoke(
        &system_instruction::transfer(
            from.key,
            to.key,
            amount,
        ),
        &[from.clone(), to.clone(), system_program.clone()],
    )?;

    Ok(())
}