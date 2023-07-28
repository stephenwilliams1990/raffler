import { PublicKey } from '@solana/web3.js';
import { RaffleConfig } from '../types/accounts';

export const printRaffleConfig = async (account: RaffleConfig, key?: PublicKey) => {
  console.log('Raffle Config');
  console.log('==========================');
  console.log('address', key?.toBase58());
  console.log('Authority', account.authority.toBase58());
  console.log('Admin', account.admin.toBase58());
  console.log('Ticket price', account.rafflePrice.toNumber());
  console.log('Number of winners', account.noWinners);
  if (account.treasuryMint!.toBase58() != 'So11111111111111111111111111111111111111112') {
    console.log('Custom SPL token set for ticket purchases');
    console.log('Custom SPL token mint address', account.treasuryMint!.toBase58());
  } else {
    console.log('Tickets to be paid for in SOL');
  }
  if (account.nftMint.toBase58() === '11111111111111111111111111111111') {
    console.log('No NFT is to be raffled');
  } else {
    console.log('NFT mint', account.nftMint.toBase58());
  }
  if (account.programAuthority.toBase58() !== '11111111111111111111111111111111') {
    console.log('Program Authority address', account.programAuthority.toBase58());
  }
};
