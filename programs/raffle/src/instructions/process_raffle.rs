use crate::*;

/// Accounts used in [raffle:process_raffle]
#[derive(Accounts)]
pub struct ProcessRaffle<'info> {
    // The address calling the function - should be the authority of the Raffle account
    #[account(mut)]
    pub authority: Signer<'info>,

    // The Raffle Account that is being drawn
    #[account(
        mut, 
        has_one = authority,
        constraint = raffle_account.nft_mint == nft_mint.key()
    )]
    pub raffle_account: Box<Account<'info, RaffleAccount>>,

    // The winner of the raffle
    #[account(
        constraint = *winner.key == winning_ticket_account.holder
    )]
    /// CHECK: We run a check on this account in the constraint above
    pub winner: AccountInfo<'info>,

    /// The ATA of the NFT to be transferred, owned by the winner
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::authority = winner,
        associated_token::mint = nft_mint,
    )]
    pub winner_token_account: Account<'info, TokenAccount>,

    // The mint of the NFT that is to be raffled
    pub nft_mint: Account<'info, Mint>,

    // Remove the constraints and do checks below
    #[account(
        // seeds = [
        //     TICKET.as_bytes(),
        //     raffle_account.key().as_ref(),
        //     raffle_account.winner_index.to_le_bytes().as_ref(),
        // ],
        // bump = winning_ticket_account.bump,
    )]
    pub winning_ticket_account: Account<'info, TicketAccount>,

    // The Escrow account that will hold the NFT for the duration of the raffle
    #[account(
        mut,
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

    // The rent sysvar
    pub rent: Sysvar<'info, Rent>,

    // The token program
    pub token_program: Program<'info, Token>,

    // The Associated Token program
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<ProcessRaffle>) -> Result<()> {

    // update the Raffle Account with the winner
    let raffle_account = &mut ctx.accounts.raffle_account;
    raffle_account.winner = *ctx.accounts.winner.key;

    // send the NFT to the winner
    let authority_seeds = [
        RAFFLE.as_bytes(), 
        ctx.accounts.raffle_account.to_account_info().key.as_ref(), 
        &[ctx.accounts.raffle_account.bump]
    ];

    token::transfer(
        ctx.accounts
            .into_transfer_to_user_context()
            .with_signer(&[&authority_seeds[..]]),
        ctx.accounts.nft_mint.supply, 
    )?;

    // Close the escrow account
    token::close_account(
        ctx.accounts
            .into_close_context()
            .with_signer(&[&authority_seeds[..]]),
    )?;
    
    Ok(())
}

impl<'info> ProcessRaffle<'info> {
    fn into_transfer_to_user_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_account.to_account_info().clone(),
            to: self.winner_token_account.to_account_info().clone(),
            authority: self.program_authority.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
    
    fn into_close_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.escrow_account.to_account_info().clone(),
            destination: self.authority.to_account_info().clone(),
            authority: self.program_authority.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}