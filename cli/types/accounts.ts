import type { AnchorTypes } from '@saberhq/anchor-contrib';
import { IDL as PROGRAM_IDL } from '../../target/types/raffle';

export type RaffleTypes = AnchorTypes<typeof PROGRAM_IDL>;
type Accounts = RaffleTypes['Accounts'];

export type RaffleConfig = Accounts['raffleAccount'];
