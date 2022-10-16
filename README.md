# Blockchainers

# References:
https://www.youtube.com/watch?v=gyMwXuJrbJQ&t=64669s between 13:41:00 to 18:50:00

## Initialising project (for both contracts & FE directories)
- Run `yarn add` for node_modules
- Add the respective `.env` variables under the contract folder (can use my api keys below, just add your own private key)
```
GOERLI_RPC_URL=https://eth-goerli.g.alchemy.com/v2/4minTa6t2tVNTyrGsvDxYobj9Yxwc6m0
PRIVATE_KEY= // Metamask private-key
ETHERSCAN_API_KEY=4GYKJ3GHU1QENUX2FMFE6USEZ8GV94MN2K
COINMARKETCAP_API_KEY=846d7069-54d9-4931-86fa-7dbd3938cd40
UPDATE_FRONT_END=true
```

## Running the project (localhost):
Add hardhat network to metamask:
- Go to your wallet and add a new network. See instructions here.
  - Network Name: Hardhat-Localhost
  - New RPC URL: http://127.0.0.1:8545/
  - Chain ID: 31337
  - Currency Symbol: ETH (or GO)
  - Block Explorer URL: None
  
- Under the contracts folder: run `hh node`
  - Copy the private keys from console and import account in metamask to use
- Under the FE folder: run `yarn dev`
  - For `goerli` testnet, `hh node` is not needed
  - Current deployed contract: https://goerli.etherscan.io/address/0x72b5F7ce2E526C98f48d74B02E6FA4A9f4e2F3D6#writeContract
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
