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
    const [numberOfOwnedTickets, setOwnedTickets] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const [isAdmin, setIsAdmin] = useState(false)
    const [isAdminPage, setIsAdminPage] = useState(false)

    // TODO: Make user be able to input the number of tickets he want to buy
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

    const { runContractFunction: getUserTickets } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getUserTickets",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    const { runContractFunction: isUserAdmin } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "isUserAdmin",
        params: {},
    })

    // TODO: This function doesn't run for some reason
    const { runContractFunction: performUpkeep } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "performUpkeep",
        params: { calldata: 0x0 },
    })

    async function updateUI() {
        const ticketCost = await getTicketCost()
        setTicketCost(ticketCost.toString())

        const numTicketsFromCall = (await getNumTickets()).toString()
        setNumberOfTickets(numTicketsFromCall)

        const ownedTickets = (await getUserTickets()).toString()
        setOwnedTickets(ownedTickets)

        const recentWinnerFromCall = await getRecentWinner()
        setRecentWinner(recentWinnerFromCall)

        const userStatus = await isUserAdmin()
        setIsAdmin(userStatus)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled]) // Run this function whenever `isWeb3Enabled` changes

    let handleNewNotification = async () => {
        // Can read up on these on "web3ui.github"
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Transaction Notification",
            position: "topR",
            icon: "bell",
        })
    }

    let handleSuccess = async (tx) => {
        await tx.wait(1)
        handleNewNotification(transaction)
        updateUI()
    }

    const handleSelectWinnerSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Winner Selected!",
            title: "Winner Selected",
            position: "topR",
        })
    }

    const buyTicketBtn = async () => {
        await buyTickets({
            // onComplete:
            onSuccess: handleSuccess, // When function is successful
            onError: (err) => console.log(err),
        })
    }

    // TODO: Not sure why this ain't working. It works with contract tho
    const selectWinnerBtn = async () => {
        await performUpkeep({
            onSuccess: handleSelectWinnerSuccess,
            onError: (err) => console.log(err),
        })
    }

    const changeAdminPage = () => {
        setIsAdminPage(!isAdminPage)
    }

    const showUserInterface = () => {
        return (
            <div>
                <p>
                    RecentWinner:
                    {recentWinner == "0x0000000000000000000000000000000000000000"
                        ? "No recent winner"
                        : recentWinner}
                </p>
                <br />
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
                <p>Total Ticket pool: {numberOfTickets}</p>
                <p>Owned tickets: {numberOfOwnedTickets}</p>
                <br />
                {isAdmin ? (
                    <p>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                            onClick={changeAdminPage}
                        >
                            Go to admin page
                        </button>
                    </p>
                ) : (
                    ""
                )}
            </div>
        )
    }

    // TODO: Add admin function to change ticket cost and add other admins
    const showAdminInterface = () => {
        return (
            <div>
                <p>You are admin</p>
                <p>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={changeAdminPage}
                    >
                        Back to lottery page
                    </button>
                </p>
                <br />
                <p>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={selectWinnerBtn}
                    >
                        Select Winner
                    </button>
                </p>
            </div>
        )
    }

    const showInterfaces = () => {
        if (!raffleAddress) return <div>No Raffle Address detected</div>
        if (isAdminPage) return showAdminInterface()
        return showUserInterface()
    }

    return <div className="p-5">{showInterfaces()}</div>
}
