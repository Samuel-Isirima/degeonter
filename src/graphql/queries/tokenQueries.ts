
export const GET_LATEST_TOKENS_CREATED = `
  query MyQuery {
    Solana(dataset: realtime, network: solana) {
      Instructions(
        where: {
          Instruction: {
            Program: {
              Address: { is: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
              Method: { in: ["initializeMint", "initializeMint2", "initializeMint3"] }
            }
          }
        }
        orderBy: { ascending: Block_Time }
        limit: { count: 10 }
      ) {
        Block {
          Date
        }
        Instruction {
          Accounts {
            Token {
              Mint
              Owner
            }
            Address
          }
          Program {
            AccountNames
          }
        }
        Transaction {
          Signature
          Signer
        }
      }
    }
  }
`;