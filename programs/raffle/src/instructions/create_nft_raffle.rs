use crate::*;

// Accounts for the [raffle::create_nft_raffle] function
#[derive(Accounts)]
pub struct CreateNftRaffle<'info> {
    // The account calling the transaction 
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
    
    // The token account of the NFT that is to be raffled
    #[account(
        mut,
        constraint = nft_token_account.owner == caller.key(),
        constraint = nft_token_account.amount == 1,
        constraint = nft_token_account.mint == nft_mint.key(),
    )]
    pub nft_token_account: Account<'info, TokenAccount>,

    // The mint of the NFT that is to be raffled
    pub nft_mint: Account<'info, Mint>,

    // The Escrow account that will hold the NFT for the duration of the raffle
    #[account(
        init,
        payer = caller,
        associated_token::mint = nft_mint,
        associated_token::authority = program_authority,
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    // The Program Authority that will have control of the escrow account holding the NFT to be raffled
    #[account(
        seeds = [
            RAFFLE.as_bytes(), 
            raffle_account.key().as_ref()
        ],
        bump,
    )]
    /// CHECK: This isn't dangerous as we don't read or write from this account
    pub program_authority: UncheckedAccount<'info>,

    // The System program
    pub system_program: Program<'info, System>,

    // The Rent sysvar
    pub rent: Sysvar<'info, Rent>,

    // The Token program
    pub token_program: Program<'info, Token>,

    // The Associated Token program
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<CreateNftRaffle>, price: u64) -> Result<()> {
    let raffle_account = &mut ctx.accounts.raffle_account;

    raffle_account.authority = ctx.accounts.caller.key();
    raffle_account.admin = *ctx.accounts.admin.key;
    raffle_account.program_authority = ctx.accounts.program_authority.key();
    raffle_account.raffle_price = price;
    raffle_account.ticket_count = 0;
    raffle_account.winner_index = 0;
    raffle_account.winner = spl_token::native_mint::id();
    raffle_account.bump = *ctx.bumps.get("program_authority").unwrap();
    raffle_account.nft_mint = ctx.accounts.nft_mint.key();
    
    save_treasury_mint(raffle_account, &ctx.remaining_accounts)?;

    // Send nft to escrow account
    assert_eq!(ctx.accounts.nft_mint.supply, 1);
    assert_eq!(ctx.accounts.nft_mint.decimals, 0);

    token::transfer(
        ctx.accounts.into_transfer_to_escrow_context(),
        ctx.accounts.nft_mint.supply, 
    )?;
    Ok(())
}

impl<'info> CreateNftRaffle<'info> {
    fn into_transfer_to_escrow_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.nft_token_account.to_account_info(),
            to: self.escrow_account.to_account_info(),
            authority: self.caller.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}