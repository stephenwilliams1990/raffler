use crate::*;

/// Accounts for the [raffle::init_state] function
#[derive(Accounts)]
pub struct InitState<'info> {
    // The account calling the tx 
    #[account(mut)]
    pub payer: Signer<'info>,

    // The admin address for the global state 
    #[account(constraint = *admin.key.to_string() == *DEFAULT_ADMIN)]
    /// CHECK: Constraint ensures the right address is passed
    pub admin: AccountInfo<'info>,

    // The GlobalState Account
    #[account(
        init,
        payer = payer,
        seeds = [b"state".as_ref()],
        bump,
        space = GLOBAL_STATE_SIZE,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    // The System program
    pub system_program: Program<'info, System>,

    // The Rent sysvar:
    pub rent: Sysvar<'info, Rent>,
}

// Initialise a Global State Account and set it's initial parameters
pub fn handler(ctx: Context<InitState>) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    global_state.admin = *ctx.accounts.admin.key;
    global_state.share = 3;
    global_state.bump = *ctx.bumps.get("global_state").unwrap();

    Ok(())
}