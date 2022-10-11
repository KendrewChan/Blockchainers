import { useWeb3Contract } from "react-moralis"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const dispatch = useNotification()

    const [ticketCost, setTicketCost] = useState("0")
    // const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    // const [recentWinner, setRecentWinner] = useState("0")

    const {
        runContractFunction: buyTickets,
        data: enterTxResponse,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "buyTickets",
        msgValue: ticketCost,
        params: {},
    })

    const { runContractFunction: getTicketCost } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getTicketCost",
        params: {},
    })

    async function updateUI() {
        const ticketCost = await getTicketCost()
        setTicketCost(ticketCost.toString())

        // const numPlayersFromCall = (await getPlayersNumber()).toString()
        // setNumberOfPlayers(numPlayersFromCall)

        // const recentWinnerFromCall = await getRecentWinner()
        // setRecentWinner(recentWinnerFromCall)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled]) // Run this function whenever `isWeb3Enabled` changes

    let handleNewNotifcation = async () => {
        // Can read up on these on "web3ui.github"
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Transaction Notification",
            position: "topR",
            icon: "bell",
        })
    }

    let handleSuccess = async (transaction) => {
        await transaction.wait(1)
        handleNewNotifcation(transaction)
    }

    let buyTicketBtn = async () => {
        await buyTickets({
            // onComplete:
            onSuccess: handleSuccess, // When function is successful
            onError: (err) => console.log(err),
        })
    }

    return (
        <div>
            {" "}
            {raffleAddress ? (
                <div>
                    <button onClick={buyTicketBtn}>Enter lottery</button>
                    Ticket cost is {ticketCost / 1e18} ETH
                </div>
            ) : (
                <div>No Raffle Address detected</div>
            )}
        </div>
    )
}
