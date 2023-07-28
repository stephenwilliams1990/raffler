/**
 * This command creates a new NFT Raffle
 *
 * TO RUN:
 *      npm run create-nft-raffle --config=examples/new-raffle.json
 */

import { AnchorProvider, web3 } from '@project-serum/anchor';
import fs from 'fs';
import * as anchor from '@project-serum/anchor';
import { program, keypair } from '../config';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { printRaffleConfig } from '../output/raffleConfig';
import { getAssociatedTokenAddress } from '../../src/utils';
import { findRaffleProgramAuthority } from '../../src/pda';

const inputFilePath = process.env.npm_config_config;
if (inputFilePath === undefined) {
  throw new Error('The input config is not defined');
}

const inputFile = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

const runInstruction = async () => {
  const raffleAccount = web3.Keypair.generate();
  let price;
  const remainingAccounts = [];
  if (inputFile.treasuryMint === '') {
    price = inputFile.price * LAMPORTS_PER_SOL;
  } else {
    const mint = new Token(
      program.provider.connection,
      new web3.PublicKey(inputFile.treasuryMint),
      TOKEN_PROGRAM_ID,
      keypair,
    );
    const mintInfo = await mint.getMintInfo();
    price = inputFile.price * Math.pow(10, mintInfo.decimals);
    remainingAccounts.push({
      pubkey: new PublicKey(inputFile.treasuryMint),
      isWritable: false,
      isSigner: false,
    });
  }
  const nftMint = new PublicKey(inputFile.nftMint);
  const nftTokenAccount = await getAssociatedTokenAddress(
    (program.provider as AnchorProvider).wallet.publicKey,
    nftMint,
  );
  const [programAuthority] = await findRaffleProgramAuthority(raffleAccount.publicKey, program.programId);
  const escrowAccount = await getAssociatedTokenAddress(programAuthority, nftMint);
  try {
    const txId = await program.methods
      .createNftRaffle(new anchor.BN(price))
      .accounts({
        caller: (program.provider as AnchorProvider).wallet.publicKey,
        admin: new PublicKey(inputFile.admin),
        raffleAccount: raffleAccount.publicKey,
        nftTokenAccount,
        nftMint,
        escrowAccount,
        programAuthority,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([raffleAccount])
      .remainingAccounts(remainingAccounts.length > 0 ? remainingAccounts : [])
      .rpc();

    const raffleAccountInfo = await program.account.raffleAccount.fetch(raffleAccount.publicKey);

    return {
      txId,
      raffleAccount,
      raffleAccountInfo,
    };
  } catch (e) {
    console.log('Error creating NFT raffle', e);
  }
};

runInstruction()
  .catch((error) => console.log(`Error: ${error}`))
  .then((result) => {
    if (result) {
      console.log('TxId', result.txId, '\n');
      printRaffleConfig(result.raffleAccountInfo, result.raffleAccount.publicKey).then(() =>
        console.log('Solana network:', process.env.ANCHOR_PROVIDER_URL),
      );
    } else {
      console.log('\nSeomthing went wrong');
    }
  });
