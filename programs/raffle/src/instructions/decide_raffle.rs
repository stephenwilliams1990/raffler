use crate::*;

/// Accounts for the [raffle::init_state] function
#[derive(Accounts)]
pub struct DecideRaffle<'info> {
    // The wallet running this function - should be the authority of the Raffle account
    #[account(mut)]
    pub authority: Signer<'info>,

    // The Raffle Account that is being drawn
    #[account(mut, has_one = authority)]
    pub raffle_account: Box<Account<'info, RaffleAccount>>,

    #[account(constraint = recent_slothashes.key() == sysvar::slot_hashes::ID @ MyError::IncorrectSlotHashesPubkey)]
    /// CHECK: We are checking in the constraint above that this is the right pubkey
    pub recent_slothashes: UncheckedAccount<'info>,

}   

pub fn handler(ctx: Context<DecideRaffle>) -> Result<()> {
    let raffle_account = &mut ctx.accounts.raffle_account;
    
    // get slothashes data
    let recent_slothashes = &ctx.accounts.recent_slothashes;

    let hash = recent_slothashes.data.borrow();
    let most_recent = array_ref![hash, 12, 8];
    let index = u64::from_le_bytes(*most_recent);

    if raffle_account.no_winners == 0 {
        let modded: u64 = index
        .checked_rem(raffle_account.ticket_count)
        .ok_or(MyError::NumericalOverflowError)? as u64;
    
        raffle_account.winner_index = modded;
    } else {
        let mut remaining_winners = raffle_account.no_winners;
        let mut offset = 0;
        while remaining_winners > 0 {
            let most_recent = array_ref![hash, 12 + 12 * offset, 8];
            let index = u64::from_le_bytes(*most_recent);
            let modded: u64 = index
            .checked_rem(raffle_account.ticket_count)
            .ok_or(MyError::NumericalOverflowError)? as u64;
            if !raffle_account.winner_indexes.contains(&modded) {
                raffle_account.winner_indexes.push(modded);
                remaining_winners -= 1;
                msg!("Added winner {:?}", offset);
            }
            offset += 1;
        }
    }
    Ok(())
}