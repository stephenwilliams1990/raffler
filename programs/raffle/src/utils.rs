use crate::*;

// Check if the account is owned by the given owner
pub fn assert_owned_by(account: &AccountInfo, owner: &Pubkey) -> Result<()> {
    if account.owner != owner {
        return err!(MyError::IncorrectOwner)
    } else {
        Ok(())
    }
}

// Check if a token program-owned account is initialized
pub fn assert_initialized<T: Pack + IsInitialized>(account_info: &AccountInfo) -> Result<T> {
    let account: T = T::unpack_unchecked(&account_info.data.borrow())?;
    if !account.is_initialized() {
        return err!(MyError::UninitializedAccount)
    } else {
        Ok(account)
    }
}

pub fn assert_is_ata(ata: &AccountInfo, wallet: &Pubkey, mint: &Pubkey) -> Result<spl_token::state::Account> {
    assert_owned_by(ata, &spl_token::id())?;
    let ata_account: spl_token::state::Account = assert_initialized(ata)?;
    require_keys_eq!(ata_account.owner, *wallet);
    require_keys_eq!(ata_account.mint, *mint);
    require_keys_eq!(get_associated_token_address(wallet, mint), *ata.key);
    Ok(ata_account)
}

// Check that the account is an initialized mint account
pub fn assert_mint(account_info: &AccountInfo) -> Result<spl_token::state::Mint> {
    assert_owned_by(account_info, &spl_token::id())?;
    let mint_account: spl_token::state::Mint = assert_initialized(account_info)?;
    Ok(mint_account)
}

// Save Treasury mint if provided
pub fn save_treasury_mint<'a>(
    raffle_account: &mut Account<RaffleAccount>,
    remaining_accounts: &[AccountInfo<'a>],
) -> Result<()> {
    if remaining_accounts.len() > 0 {
        let possible_mint = &remaining_accounts[0];
        assert_mint(&possible_mint.to_account_info())?;
        raffle_account.treasury_mint = Some(possible_mint.key());
    } else {
        raffle_account.treasury_mint = Some(spl_token::native_mint::id());
    }

    Ok(())
}

// Pay with treasury mint if provided
pub fn pay_with_treasury_mint<'a>(
    raffle_account: &mut Account<RaffleAccount>,
    global_state: &Account<GlobalState>,
    remaining_accounts: &[AccountInfo<'a>],
    payer: &AccountInfo<'a>,
    authority: &AccountInfo,
    global_admin: &AccountInfo,
    token_program: Program<'a, Token>,
    quantity: u64,
) -> Result<()> {
    if remaining_accounts.len() > 0 {
        let possible_payer_treasury_account = &remaining_accounts[0];
        assert_is_ata(
            &possible_payer_treasury_account.to_account_info(),
            payer.key,
            &raffle_account.treasury_mint.unwrap(),
        )?;
        let possible_authority_treasury_account = &remaining_accounts[1];
        assert_is_ata(
            &possible_authority_treasury_account.to_account_info(),
            authority.key,
            &raffle_account.treasury_mint.unwrap(),
        )?;
        let possible_global_admin_treasury_account = &remaining_accounts[2];
        assert_is_ata(
            &possible_global_admin_treasury_account.to_account_info(),
            global_admin.key,
            &raffle_account.treasury_mint.unwrap(),
        )?;
        let admin_fee = raffle_account.raffle_price
            .checked_mul(global_state.share.into())
            .unwrap()
            .checked_div(100)
            .unwrap().into();
        invoke(
            &spl_token::instruction::transfer(
                token_program.key,
                &possible_payer_treasury_account.key(),
                &possible_authority_treasury_account.key(),
                payer.key,
                &[],
                raffle_account.raffle_price.checked_sub(admin_fee).unwrap() * quantity as u64,
            )?,
            &[
                possible_payer_treasury_account.to_account_info().clone(),
                possible_authority_treasury_account.to_account_info().clone(),
                token_program.to_account_info().clone(),
                payer.clone(),
            ],
        )?;
        invoke(
            &spl_token::instruction::transfer(
                token_program.key,
                &possible_payer_treasury_account.key(),
                &possible_global_admin_treasury_account.key(),
                payer.key,
                &[],
                admin_fee * quantity as u64,
            )?,
            &[
                possible_payer_treasury_account.to_account_info().clone(),
                possible_global_admin_treasury_account.to_account_info().clone(),
                token_program.to_account_info().clone(),
                payer.clone(),
            ],
        )?;
    } 

    Ok(())
}
