import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const RAFFLE_ACCOUNT_SIZE = 631;
const getAccounts = async () => {
  const gameAccounts = await connection.getProgramAccounts(
    new PublicKey('CjyRvuKctQ9yakLp9EQCSis4LzhQgQzXmDHGHb2sQJ7B'),
    {
      filters: [
        {
          dataSize: RAFFLE_ACCOUNT_SIZE,
        },
      ],
    },
  );
};
getAccounts();
