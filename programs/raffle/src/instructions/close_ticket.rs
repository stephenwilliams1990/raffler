use crate::*;

/// Accounts used in the [raffle::close_ticket] function
#[derive(Accounts)]
#[instruction(index: u64)]
pub struct CloseTicket<'info> {

    // The address making the call - should be the authority of the Raffle account
    #[account(mut)]
    pub authority: Signer<'info>,

    // The Raffle Account associated with this raffle
    #[account(mut, has_one = authority)]
    pub raffle_account: Account<'info, RaffleAccount>,
    
    // The ticket account to be closed
    #[account(
        mut,
        seeds = [
            TICKET.as_bytes(),
            raffle_account.key().as_ref(),
            index.to_le_bytes().as_ref(),
        ],
        bump = ticket_account.bump,
        close = ticket_holder
    )]
    pub ticket_account: Account<'info, TicketAccount>, 

    #[account(mut, constraint = ticket_holder.key() == ticket_account.holder)]
    /// CHECK: Constraint above makes sure that this is the correct account
    pub ticket_holder: UncheckedAccount<'info>,
}

pub fn handler(_ctx: Context<CloseTicket>, _index: u64) -> Result<()> {
    Ok(())
}