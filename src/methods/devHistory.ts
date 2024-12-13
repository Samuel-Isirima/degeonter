/**
 * 
The way to find the tokens created by a particular dev wallet is to look for transactions on the 
solana network where the dev's address is the signer. Now, regular buy and sell transactions from the dev's wallet 
could also have the dev's wallet as a signer. So we filter these by making sure the transaction was one with at least
one of the methods of/for creating tokens on the solana network.
These include initializeMint1,  initializeMint2,  initializeMint3, create, pump
Adding this filter results in transactions involving the dev's wallet address that have these methods.

Now, event with these filters, when the query returns the transaction details, it returns all the addresses that are associated with
that particular transacion, hence making it difficult to find the actual mint address of the token

However, as postulated by an article, whenver a token is minted, the mint address is usually the first in the list of addresses
associated with that mint transaction. Hence, No matter how many addresses that are returned by the query, the actual mint address is the
first one in the array.

So we'd get them by using the function below;
 */

function getFirstAddressInEachBlock(response) {
    const firstAddresses = [];
  
    // Check if Solana and Instructions exist
    if (response.Solana && response.Solana.Instructions) {
      response.Solana.Instructions.forEach(instruction => {
        if (instruction.Instruction && instruction.Instruction.Accounts) {
          // Add the first address if the Accounts array exists and is not empty
          const firstAccount = instruction.Instruction.Accounts[0];
          if (firstAccount && firstAccount.Address) {
            firstAddresses.push(firstAccount.Address);
          }
        }
      });
    }
  
    return firstAddresses;
  }