use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("The signature provided to verify the metadata is invalid")]
    SignatureVerificationFailed,

    #[msg("You don't have enough SOL to mint this NFT")]
    NotEnoughSOL,

    #[msg("The launch date has not come yet")]
    CandyMachineNotLiveYet,

    #[msg("There are no more NFTs to mint in this collection")]
    CandyMachineEmpty,
}
