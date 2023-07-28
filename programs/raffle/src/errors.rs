use crate::*;

#[error_code]
pub enum MyError {
    #[msg("Account passed is uninitialized")]
    UninitializedAccount,
    #[msg("Incorrect owner")]
    IncorrectOwner,
    #[msg("Incorrect Slothashes Pubkey passed to the program")]
    IncorrectSlotHashesPubkey,
    #[msg("Numerical overflow error!")]
    NumericalOverflowError,
    #[msg("Incorrect winner account entered!")]
    IncorrectWinnerAccount,
}