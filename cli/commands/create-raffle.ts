/**
 * This command creates a new Raffle
 *
 * TO RUN:
 *      npm run create-raffle --config=examples/new-raffle.json
 */

import { AnchorProvider, web3 } from '@project-serum/anchor';
import fs from 'fs';
import * as anchor from '@project-serum/anchor';
import { program, keypair } from '../config';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { printRaffleConfig } from '../output/raffleConfig';

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
  const txId = await program.methods
    .createRaffle(new anchor.BN(price), inputFile.winners)
    .accounts({
      caller: (program.provider as AnchorProvider).wallet.publicKey,
      admin: new PublicKey(inputFile.admin),
      raffleAccount: raffleAccount.publicKey,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
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
