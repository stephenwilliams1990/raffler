export type Raffle = {
  version: '0.1.0';
  name: 'raffle';
  instructions: [
    {
      name: 'initState';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'admin';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'globalState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: 'createRaffle';
      accounts: [
        {
          name: 'caller';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'admin';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'raffleAccount';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'price';
          type: 'u64';
        },
        {
          name: 'noWinners';
          type: 'u8';
        },
      ];
    },
    {
      name: 'createNftRaffle';
      accounts: [
        {
          name: 'caller';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'admin';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'raffleAccount';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'nftTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'nftMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'escrowAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'programAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'price';
          type: 'u64';
        },
      ];
    },
    {
      name: 'buyTicket';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'raffleAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'admin';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'ticketAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'globalState';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'globalAdmin';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'quantity';
          type: 'u64';
        },
      ];
    },
    {
      name: 'decideRaffle';
      accounts: [
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'raffleAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'recentSlothashes';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: 'processRaffle';
      accounts: [
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'raffleAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'winner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'winnerTokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['The ATA of the NFT to be transferred, owned by the winner'];
        },
        {
          name: 'nftMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'winningTicketAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'escrowAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'programAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: 'closeTicket';
      accounts: [
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'raffleAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'ticketAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'ticketHolder';
          isMut: true;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'index';
          type: 'u64';
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'globalState';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            type: 'publicKey';
          },
          {
            name: 'share';
            type: 'u8';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'raffleAccount';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authority';
            type: 'publicKey';
          },
          {
            name: 'admin';
            type: 'publicKey';
          },
          {
            name: 'programAuthority';
            type: 'publicKey';
          },
          {
            name: 'treasuryMint';
            type: {
              option: 'publicKey';
            };
          },
          {
            name: 'nftMint';
            type: 'publicKey';
          },
          {
            name: 'rafflePrice';
            type: 'u64';
          },
          {
            name: 'ticketCount';
            type: 'u64';
          },
          {
            name: 'winnerIndex';
            type: 'u64';
          },
          {
            name: 'winner';
            type: 'publicKey';
          },
          {
            name: 'winnerIndexes';
            type: {
              vec: 'u64';
            };
          },
          {
            name: 'noWinners';
            type: 'u8';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'ticketAccount';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'holder';
            type: 'publicKey';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'UninitializedAccount';
      msg: 'Account passed is uninitialized';
    },
    {
      code: 6001;
      name: 'IncorrectOwner';
      msg: 'Incorrect owner';
    },
    {
      code: 6002;
      name: 'IncorrectSlotHashesPubkey';
      msg: 'Incorrect Slothashes Pubkey passed to the program';
    },
    {
      code: 6003;
      name: 'NumericalOverflowError';
      msg: 'Numerical overflow error!';
    },
    {
      code: 6004;
      name: 'IncorrectWinnerAccount';
      msg: 'Incorrect winner account entered!';
    },
  ];
};

export const IDL: Raffle = {
  version: '0.1.0',
  name: 'raffle',
  instructions: [
    {
      name: 'initState',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'admin',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'globalState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'createRaffle',
      accounts: [
        {
          name: 'caller',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'admin',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'raffleAccount',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'price',
          type: 'u64',
        },
        {
          name: 'noWinners',
          type: 'u8',
        },
      ],
    },
    {
      name: 'createNftRaffle',
      accounts: [
        {
          name: 'caller',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'admin',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'raffleAccount',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'nftTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'nftMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'escrowAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'programAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'price',
          type: 'u64',
        },
      ],
    },
    {
      name: 'buyTicket',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'raffleAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'admin',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'ticketAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'globalState',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'globalAdmin',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'quantity',
          type: 'u64',
        },
      ],
    },
    {
      name: 'decideRaffle',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'raffleAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'recentSlothashes',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'processRaffle',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'raffleAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'winner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'winnerTokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['The ATA of the NFT to be transferred, owned by the winner'],
        },
        {
          name: 'nftMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'winningTicketAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'escrowAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'programAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'closeTicket',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'raffleAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'ticketAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'ticketHolder',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'index',
          type: 'u64',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'globalState',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'admin',
            type: 'publicKey',
          },
          {
            name: 'share',
            type: 'u8',
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
    {
      name: 'raffleAccount',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'authority',
            type: 'publicKey',
          },
          {
            name: 'admin',
            type: 'publicKey',
          },
          {
            name: 'programAuthority',
            type: 'publicKey',
          },
          {
            name: 'treasuryMint',
            type: {
              option: 'publicKey',
            },
          },
          {
            name: 'nftMint',
            type: 'publicKey',
          },
          {
            name: 'rafflePrice',
            type: 'u64',
          },
          {
            name: 'ticketCount',
            type: 'u64',
          },
          {
            name: 'winnerIndex',
            type: 'u64',
          },
          {
            name: 'winner',
            type: 'publicKey',
          },
          {
            name: 'winnerIndexes',
            type: {
              vec: 'u64',
            },
          },
          {
            name: 'noWinners',
            type: 'u8',
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
    {
      name: 'ticketAccount',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'holder',
            type: 'publicKey',
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'UninitializedAccount',
      msg: 'Account passed is uninitialized',
    },
    {
      code: 6001,
      name: 'IncorrectOwner',
      msg: 'Incorrect owner',
    },
    {
      code: 6002,
      name: 'IncorrectSlotHashesPubkey',
      msg: 'Incorrect Slothashes Pubkey passed to the program',
    },
    {
      code: 6003,
      name: 'NumericalOverflowError',
      msg: 'Numerical overflow error!',
    },
    {
      code: 6004,
      name: 'IncorrectWinnerAccount',
      msg: 'Incorrect winner account entered!',
    },
  ],
};
