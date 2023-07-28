
// Struct definitions for accounts that hold state
use crate::*;

pub const STATE: &str = "state";
pub const RAFFLE: &str = "raffle";
pub const TICKET: &str = "ticket";

#[account] 
pub struct GlobalState {
    pub admin: Pubkey,
    pub share: u8,
    pub bump: u8,
}

#[account]
pub struct RaffleAccount {
    pub authority: Pubkey,
    pub admin: Pubkey,
    pub program_authority: Pubkey,
    pub treasury_mint: Option<Pubkey>,
    pub nft_mint: Pubkey,
    pub raffle_price: u64,
    pub ticket_count: u64,
    pub winner_index: u64,
    pub winner: Pubkey,
    pub winner_indexes: Vec<u64>,
    pub no_winners: u8,
    pub bump: u8,
}

#[account]
pub struct TicketAccount {
    pub holder: Pubkey,
    pub bump: u8
}

pub const GLOBAL_STATE_SIZE: usize = 8 + // discriminator
    std::mem::size_of::<Pubkey>() + // admin pubkey
    1 + // share
    1; // bump

pub const RAFFLE_ACCOUNT_SIZE: usize = 8 + // discriminator
    32 + // authority pubkey
    32 + // admin pubkey
    32 + // program_authority pubkey
    32 + 1 + // treasury mint pubkey
    32 + // nft_mint pubkey
    8 + // raffle price
    8 + // ticket count
    8 + // winner index
    32 + // winner
    4 + 8 * 50 + // vector holding a maximum of 50 indexes (winner_indexes)
    1 + // no_winners
    1; // bump

pub const TICKET_ACCOUNT_SIZE: usize = 8 + // discriminator
    std::mem::size_of::<Pubkey>() + // holder pubkey
    1; // bump