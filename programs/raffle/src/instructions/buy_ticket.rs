use crate::*;

// Accounts for the [raffle::buy_ticket] function
#[derive(Accounts)]
pub struct BuyTicket<'info> {
    // Account purchasing the ticket
    #[account(mut)]
    pub payer: Signer<'info>,

    // RaffleAccount that the user is purchasing from
    #[account(mut, has_one = admin)]
    pub raffle_account: Box<Account<'info, RaffleAccount>>,

    // The admin of the RaffleAccount that will receive the fee for ticket purchase
    #[account(mut)]
    /// CHECK: Check main in the constraint in the raffle_account above
    pub admin: UncheckedAccount<'info>,

    // TicketAccount that is created
    #[account(
        init,
        payer = payer,
        seeds = [
            TICKET.as_bytes(),
            raffle_account.key().as_ref(),
            raffle_account.ticket_count.to_le_bytes().as_ref(),
        ],
        bump,
        space = TICKET_ACCOUNT_SIZE,
    )]
    pub ticket_account: Box<Account<'info, TicketAccount>>,

    // The Global State Account
    #[account(constraint = global_state.admin == global_admin.key())]
    pub global_state: Account<'info, GlobalState>,

    // The admin of the Global State account
    #[account(mut)]
    /// CHECK: This value is checked in the global_state constraint above
    pub global_admin: UncheckedAccount<'info>,

    // The System program
    pub system_program: Program<'info, System>,

    // The Token program
    pub token_program: Program<'info, Token>,

    // The Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

pub(crate) fn handle_buy_ticket<'info>(ctx: Context<'_, '_, '_, 'info, BuyTicket<'info>>, quantity: u64) -> Result<()> {
    let ticket_account = &mut ctx.accounts.ticket_account;
    ticket_account.holder = ctx.accounts.payer.key();
    ticket_account.bump = *ctx.bumps.get("ticket_account").unwrap();

    // Increment the ticket_count of the RaffleAccount
    let raffle_account = &mut ctx.accounts.raffle_account;
    raffle_account.ticket_count += quantity;

    let global_state = &ctx.accounts.global_state;

    // Charge the fee
    let is_native = raffle_account.treasury_mint == Some(spl_token::native_mint::id());
    let admin_fee = raffle_account.raffle_price
        .checked_mul(global_state.share.into())
        .unwrap()
        .checked_div(100)
        .unwrap().into();
    // check whether a treasury mint exists. If so, pay with that SPL token. If not transfer SOL
    if is_native {
        // Transfer price in SOL to the Raffle admin
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &ctx.accounts.admin.key(),
                raffle_account.raffle_price.checked_sub(admin_fee).unwrap() * quantity,
            ),
            &[
                ctx.accounts.payer.to_account_info().clone(),
                ctx.accounts.admin.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
            ]
        )?;
        // Transfer share to global admin
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &ctx.accounts.global_admin.key(),
                admin_fee * quantity,
            ),
            &[
                ctx.accounts.payer.to_account_info().clone(),
                ctx.accounts.global_admin.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
            ]
        )?;
    } else {
        // transfer price in SPL transfer
        // pass in remaining accounts that hold the token account for the payer and the authority
        pay_with_treasury_mint(
            raffle_account, 
            global_state,
            &ctx.remaining_accounts,
            &ctx.accounts.payer.to_account_info(), 
            &ctx.accounts.admin.to_account_info(), 
            &ctx.accounts.global_admin.to_account_info(), 
            ctx.accounts.token_program.clone(),
            quantity
        )?;
    }
    Ok(())
}