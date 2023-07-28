pub mod instructions;
pub mod state;
pub mod utils;
pub mod errors;

use anchor_lang::{
    prelude::*,
    solana_program::{
        program::{invoke},
        program_pack::{IsInitialized, Pack},
        system_instruction,
        sysvar,
    },
};

use anchor_spl::{
    token::{self, Token, Mint, TokenAccount, Transfer, CloseAccount},
    associated_token::{get_associated_token_address, AssociatedToken},
};
use arrayref::array_ref;

pub use instructions::*;
pub use state::*;
pub use utils::*;
pub use errors::*;

declare_id!("rafLqgkRoSGQWSsyBYh65BvNSCRYfxp7mDtEmW8CqK1");

pub const DEFAULT_ADMIN: &str = "HnCynU8U2ZuyJCf61HsVuMvBehckSnvhUhkmtZKE5HnG";

#[program]
pub mod raffle {
    use super::*;

    pub fn init_state(ctx: Context<InitState>) -> Result<()> {
        instructions::init_state::handler(ctx)
    }

    pub fn create_raffle(ctx: Context<CreateRaffle>, price: u64, no_winners: u8) -> Result<()> {
        instructions::create_raffle::handler(ctx, price, no_winners)
    }

    pub fn create_nft_raffle(ctx: Context<CreateNftRaffle>, price: u64) -> Result<()> {
        instructions::create_nft_raffle::handler(ctx, price)
    }

    pub fn buy_ticket<'info>(ctx: Context<'_, '_, '_, 'info, BuyTicket<'info>>, quantity: u64) -> Result<()> {
        handle_buy_ticket(ctx, quantity)
    }

    pub fn decide_raffle(ctx: Context<DecideRaffle>) -> Result<()> {
        instructions::decide_raffle::handler(ctx)
    }

    pub fn process_raffle(ctx: Context<ProcessRaffle>) -> Result<()> {
        instructions::process_raffle::handler(ctx)
    }

    pub fn close_ticket(ctx: Context<CloseTicket>, index: u64) -> Result<()> {
        instructions::close_ticket::handler(ctx, index)
    }
}

