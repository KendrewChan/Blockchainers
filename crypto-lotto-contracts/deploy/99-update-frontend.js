const { ethers, network } = require("hardhat")
const fs = require("fs")
const { isModuleNamespaceObject } = require("util/types")

// This script is used to update FE constants files
const FRONT_END_ADDRESSES_FILE = "../crypto-lotto-fe/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../crypto-lotto-fe/constants/abi.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        updateContractAddresses()
        updateAbi()
    }
}

updateAbi = async () => {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json))
}

updateContractAddresses = async () => {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId.toString()
    const currAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))
    if (chainId in currAddresses) {
        if (!currAddresses[chainId].includes(raffle.address)) {
            currAddresses[chainId].push(raffle.address)
        }
    } else {
        currAddresses[chainId] = [raffle.address]
    }
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currAddresses))
}

module.exports.tags = ["all", "frontend"]
