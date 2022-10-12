import { useWeb3Contract, useMoralis, useWeb3ExecuteFunction } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"

export default function LotteryEntrance() {
    // TODO: Check if other networks are being used, and reject/show diff page
    // TODO: Reactively update account's ETH (currently it's not updated after buyTickets())
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const dispatch = useNotification()

    const [ticketCost, setTicketCost] = useState("0")
    const [numberOfTickets, setNumberOfTickets] = useState("0")
    // const [numberOfTicketsUser, setNumberOfTicketsUser] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

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

    const { runContractFunction: getNumTickets } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumTickets",
        params: {},
    })

    // TODO: Fix this
    // const { runContractFunction: tickets } = useWeb3Contract({
    //     abi: abi,
    //     contractAddress: raffleAddress,
    //     functionName: "tickets",
    //     params: {},
    // })

    // TODO: Check for when recentWinner is empty, aka 0x0000000000000000000000000000000000000000
    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        const ticketCost = await getTicketCost()
        setTicketCost(ticketCost.toString())

        const numTicketsFromCall = (await getNumTickets()).toString()
        setNumberOfTickets(numTicketsFromCall)

        const numTicketsUserFromCall = (await fetch()).toString()
        setNumberOfTicketsUser(numTicketsUserFromCall)

        const recentWinnerFromCall = await getRecentWinner()
        setRecentWinner(recentWinnerFromCall)
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
        updateUI()
    }

    let buyTicketBtn = async () => {
        await buyTickets({
            // onComplete:
            onSuccess: handleSuccess, // When function is successful
            onError: (err) => console.log(err),
        })
    }

    // TODO: Change these ternary operators into functions
    // TODO: Show number of tickets the user currently holds
    return (
        <div className="p-5">
            {raffleAddress ? (
                <div>
                    <p>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                            onClick={buyTicketBtn}
                            disabled={isLoading || isFetching}
                        >
                            {isLoading || isFetching ? (
                                <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                            ) : (
                                "Enter Lottery"
                            )}
                        </button>
                    </p>
                    <p>Ticket cost: {ticketCost / 1e18} ETH</p>
                    <p>Number of tickets in pool: {numberOfTickets}</p>
                    <p>RecentWinner: {recentWinner}</p>
                    {/* <p>Number of tickets you bought (in-progress): {numberOfTicketsUser}</p> */}
                </div>
            ) : (
                <div>No Raffle Address detected</div>
            )}
        </div>
    )
}
