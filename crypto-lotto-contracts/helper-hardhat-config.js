// Deploy: yarn hardhat deploy --network goerli
// Remember to add contract address to VRF and Chainlink keepers

const networkConfig = {
    default: {
        name: "hardhat",
        interval: "30",
    },
    5: {
        name: "goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        keyHash: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subId: "3541",
        cbGasLimit: "500000",
        interval: "30",
    },
    31337: {
        name: "localhost",
        keyHash: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        cbGasLimit: "500000",
        subId: "588",
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
