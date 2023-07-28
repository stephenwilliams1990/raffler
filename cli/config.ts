import { web3, Wallet, Program, AnchorProvider } from '@project-serum/anchor';
import process from 'process';
import dotenv from 'dotenv';
import { PROGRAM_ID } from '../src/constants';
import { IDL as PROGRAM_IDL } from '../target/types/raffle';
import fs from 'fs';

dotenv.config();

// Address of the deployed program
const programId = PROGRAM_ID;

// RPC URL and connection
const confirmTransactionInitialTimeout =
  120 * 1000; /** time to allow for the server to initially process a transaction (in milliseconds) */
const providerUrl = process.env.ANCHOR_PROVIDER_URL;
if (providerUrl === undefined) {
  throw new Error('ANCHOR_PROVIDER_URL is not defined');
}
const providerOptions = {
  preflightCommitment: 'confirmed' as web3.Commitment,
  commitment: 'confirmed' as web3.Commitment,
};
const providerConnection = new web3.Connection(providerUrl, {
  commitment: providerOptions.commitment,
  confirmTransactionInitialTimeout,
});

// set the wallet from a local json file
const key: any = fs.readFileSync(process.env.ANCHOR_WALLET!);
const MY_SECRET_KEY = JSON.parse(key);
export const keypair = web3.Keypair.fromSecretKey(new Uint8Array(MY_SECRET_KEY));
// Set the provider
// Returns a provider read from the ANCHOR_PROVIDER_URL environment variable
export const provider = new AnchorProvider(providerConnection, Wallet.local(), providerOptions);
// Generate the program client from IDL
export const program = new Program(PROGRAM_IDL, programId, provider);
