use crate::*;

// Accounts for the [raffle::create_raffle] function
#[derive(Accounts)]
pub struct CreateRaffle<'info> {
    // The account calling the transaction to create a new raffle
    #[account(mut)]
    pub caller: Signer<'info>,

    // The admin wallet that will receive fees from Raffle ticket sales for this Raffle Account
    /// CHECK: This account is only used to be saved to the Raffle Account. 
    pub admin: AccountInfo<'info>,

    // The Raffle Account being created
    #[account(
        init,
        payer = caller,
        space = RAFFLE_ACCOUNT_SIZE
    )]
    pub raffle_account: Box<Account<'info, RaffleAccount>>,

    // The System program
    pub system_program: Program<'info, System>,

    // The Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<CreateRaffle>, price: u64, no_winners: u8) -> Result<()> {
    let raffle_account = &mut ctx.accounts.raffle_account;

    raffle_account.authority = ctx.accounts.caller.key();
    raffle_account.admin = *ctx.accounts.admin.key;
    raffle_account.raffle_price = price;
    raffle_account.ticket_count = 0;
    raffle_account.winner_indexes = [].to_vec();
    raffle_account.no_winners = no_winners;

    save_treasury_mint(raffle_account, &ctx.remaining_accounts)?;

    Ok(())
}
