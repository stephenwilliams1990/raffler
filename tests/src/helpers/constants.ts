import { PublicKey } from '@solana/web3.js';
import { AnchorTypes } from '@saberhq/anchor-contrib';
import { Raffle as RaffleIDL } from '../idl/raffle';

export const STATE = Buffer.from('state');
export const RAFFLE = Buffer.from('raffle');
export const TICKET = Buffer.from('ticket');
export const PROGRAM_ID = new PublicKey('rafLqgkRoSGQWSsyBYh65BvNSCRYfxp7mDtEmW8CqK1');

export type RaffleTypes = AnchorTypes<RaffleIDL>;

// Accounts
export type RaffleIDLAccounts = RaffleTypes['Accounts'];
export type TicketAccount = RaffleIDLAccounts['ticketAccount'];
