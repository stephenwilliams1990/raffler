/**
 * This command creates a new NFT Raffle
 *
 * TO RUN:
 *      npm run decide-nft-raffle --raffle-key=4D8LLVX9vf9wimZNPkjU1CwHrcDmXPiqHWy5dhqZZmFn
 */

// import { AnchorProvider, web3 } from '@project-serum/anchor';
// import fs from 'fs';
import * as anchor from '@project-serum/anchor';
import { program /**keypair*/ } from '../config';
import { /**LAMPORTS_PER_SOL,*/ PublicKey } from '@solana/web3.js';
import { findTicketAccountKey, getAssociatedTokenAddress, findRaffleProgramAuthority } from '../helpers';
import { /**Token,*/ TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import { printRaffleConfig } from '../output/raffleConfig';
// import { getAssociatedTokenAddress } from '../../src/utils';
// import { findRaffleProgramAuthority } from '../../src/pda';

if (!process.env.npm_config_raffle_key) {
  throw new Error('Please provide a raffle key');
}
const raffleAccountKey = new PublicKey(process.env.npm_config_raffle_key);

const runInstruction = async () => {
  //   const additionalComputeBudgetInstruction = ComputeBudgetProgram.requestUnits({
  //     units: 600000,
  //     additionalFee: 0,
  //   });

  let raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
  console.log('raffleAccount', raffleAccount);
  //   if (raffleAccount.noWinners === 0) {
  //     console.log('Winning index:', raffleAccount.winnerIndex.toNumber());
  //   } else {
  //     console.log('Winning indices:', raffleAccount.winnerIndexes);
  //   }

  const decideRaffleTx = await program.methods
    .decideRaffle()
    .accounts({
      authority: raffleAccount.authority,
      raffleAccount: raffleAccountKey,
      recentSlothashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
    })
    //   .preInstructions([additionalComputeBudgetInstruction])
    .signers([])
    .transaction();

  const txId = await program.provider.sendAndConfirm?.(decideRaffleTx, []);
  console.log('Successfully decided raffle, txId:', txId);

  raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
  console.log(
    ` winner index ${raffleAccount.winnerIndex.toNumber()}, ticket count: ${raffleAccount.ticketCount.toNumber()}`,
  );
  let winningIndex = raffleAccount.winnerIndex;
  let winningTicketKey: anchor.web3.PublicKey = PublicKey.default;
  let winningTicket;
  while (winningTicketKey === PublicKey.default) {
    const possiblyWinningKey = (await findTicketAccountKey(raffleAccountKey, winningIndex, program.programId))[0];
    try {
      const accountData = await program.account.ticketAccount.fetch(possiblyWinningKey);
      if (accountData) {
        winningTicketKey = possiblyWinningKey;
        winningTicket = accountData;
      }
    } catch (e) {
      winningIndex = winningIndex.sub(new anchor.BN(1));
    }
  }
  if (!winningTicket) {
    throw new Error('No winning ticket found');
  }
  const winner = winningTicket.holder;
  const nftMint = raffleAccount.nftMint;
  const winnerTokenAccount = await getAssociatedTokenAddress(winner, nftMint);
  const [programAuthority] = await findRaffleProgramAuthority(raffleAccountKey, program.programId);
  const escrowAccount = await getAssociatedTokenAddress(programAuthority, nftMint);

  const processRaffleTx = await program.methods
    .processRaffle()
    .accounts({
      authority: raffleAccount.authority,
      raffleAccount: raffleAccountKey,
      winner,
      winnerTokenAccount,
      nftMint,
      winningTicketAccount: winningTicketKey,
      escrowAccount,
      programAuthority,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([])
    .transaction();
  const processRaffleTxId = await program.provider.sendAndConfirm?.(processRaffleTx, []);
  console.log('Successfully processed raffle, txId:', processRaffleTxId);

  let ticketAccounts = raffleAccount.ticketCount.toNumber();
  while (ticketAccounts > 0) {
    const [ticketAccountKey] = await findTicketAccountKey(
      raffleAccountKey,
      new anchor.BN(ticketAccounts - 1),
      program.programId,
    );
    // const [globalState] = await findGlobalStateKey(program.programId)
    const ticketAccountInfo = await program.provider.connection.getAccountInfo(ticketAccountKey);
    if (ticketAccountInfo === null) {
      return;
    }
    const ticketAccount = await program.account.ticketAccount.fetch(ticketAccountKey);

    await program.methods
      .closeTicket(new anchor.BN(ticketAccounts - 1))
      .accounts({
        authority: raffleAccount.authority,
        raffleAccount: raffleAccountKey,
        ticketAccount: ticketAccountKey,
        ticketHolder: ticketAccount.holder,
      })
      .signers([])
      .transaction();

    console.log('Closed ticket account ', ticketAccounts - 1);
  }
  ticketAccounts--;

  const raffleAccountInfo = await program.account.raffleAccount.fetch(raffleAccountKey);

  return {
    txId,
    processRaffleTx,
    raffleAccountInfo,
  };
};

runInstruction()
  .catch((error) => console.log(`Error: ${error}`))
  .then((result) => {
    if (result) {
      console.log('TxId', result.txId, '\n');
      console.log('ProcessRaffleTx', result.processRaffleTx, '\n');
      //   console.log('RaffleAccountInfo', result.raffleAccountInfo, '\n');
    } else {
      console.log('\nSeomthing went wrong');
    }
  });
