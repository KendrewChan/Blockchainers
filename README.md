# Blockchainers

# References:
https://www.youtube.com/watch?v=gyMwXuJrbJQ&t=64669s between 13:41:00 to 18:50:00

## Initialising project (for both contracts & FE directories)
- Run `yarn add` for node_modules
- Add the respective `.env` variables under the contract folder (can use my api keys below, just add your own private key)

## Running the project (localhost):
Make sure to use version 16.17.1 of Node

- Under the FE folder: run `yarn dev`
  - For `goerli` testnet, `hh node` is not needed
  - Current deployed contract: https://goerli.etherscan.io/address/0x5d0dd1CcEbb636b66Fe7B8b321ddEF3966ed5A82#code
  - Get goerli faucet from https://faucets.chain.link/

## Testing
### Unit Tests
Run `hh test`

### Staging Tests
Run `hh test --network goerli`
- 3 things to take note before running the above command:
  1. Contract should be deployed to goerli testnet
  2. Contract address should be added to Chainlink VRF (value randomiser) & subscriptionId in helper-hard-config needs to be changed
  3. Contract address should be added to Chainlink Upkeep (cronjob)
