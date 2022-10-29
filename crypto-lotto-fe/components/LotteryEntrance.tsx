import { useWeb3Contract, useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { useNotification } from "web3uikit"
import PrizePool from "./PrizePool"

import { BigNumber } from "ethers"
import { formatEther } from "ethers/lib/utils"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"

export default function LotteryEntrance() {
    // TODO: Check if other networks are being used, and reject/show diff page
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const dispatch = useNotification()

    const [ticketCost, setTicketCost] = useState<BigNumber>(BigNumber.from(0))
    const [totalTicketCount, setTotalTicketCount] = useState<BigNumber>(BigNumber.from(0))
    const [ownedTicketCount, setOwnedTicketCount] = useState<BigNumber>(BigNumber.from(0))
    const [toBuyCount, setToBuyCount] = useState(0)
    const [recentWinner, setRecentWinner] = useState("0")
    const [isAdmin, setIsAdmin] = useState(false)
    const [isAdminPage, setIsAdminPage] = useState(false)
    const [newAdminAddr, setNewAdminAddr] = useState("")

    useEffect(() => {
        if (isWeb3Enabled) updateUI()
    }, [isWeb3Enabled])

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
        msgValue: ticketCost.mul(toBuyCount).toString(),
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

    const { runContractFunction: performUpkeep } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "performUpkeep",
        params: { performData: 0x0 },
    })

    const { runContractFunction: addAdmin } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "addAdmin",
        params: { _newAdmin: newAdminAddr },
    })

    async function updateUI() {
        const ticketCost = (await getTicketCost()) as BigNumber
        setTicketCost(ticketCost)

        const numTicketsFromCall = (await getNumTickets()) as BigNumber
        setTotalTicketCount(numTicketsFromCall)

        const ownedTickets = (await getUserTickets()) as BigNumber
        setOwnedTicketCount(ownedTickets)

        const recentWinnerFromCall = (await getRecentWinner()) as string
        setRecentWinner(recentWinnerFromCall)

        const userStatus = (await isUserAdmin()) as boolean
        setIsAdmin(userStatus)
    }

    const handleNewNotification = async () => {
        // Can read up on these on "web3ui.github"
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Transaction Notification",
            position: "topR",
            icon: "bell",
        })
    }

    const handleBuyTicketSuccess = async (tx) => {
        await tx.wait(1)
        handleNewNotification()
        updateUI()
    }

    const handleBuyTicket = async () => {
        await buyTickets({
            // onComplete:
            onSuccess: handleBuyTicketSuccess, // When function is successful
            onError: (err) => console.log(err),
        })
    }

    const handleSelectWinnerSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Winner Selected!",
            title: "Winner Selected",
            position: "topR",
            icon: "bell",
        })
    }

    const selectWinnerBtn = async () => {
        await performUpkeep({
            onSuccess: handleSelectWinnerSuccess,
            onError: (err) => console.log(err),
        })
    }

    const changeAdminPage = () => {
        setIsAdminPage(!isAdminPage)
    }

    const handleAddAdminSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Admin Added!",
            title: "Admin Added",
            position: "topR",
            icon: "bell",
        })
    }

    const addNewAdmin = async () => {
        await addAdmin({
            onSuccess: handleAddAdminSuccess,
            onError: (err) => console.log(err),
        })
    }

    const showUserInterface = () => {
        const prizePool = totalTicketCount.mul(ticketCost)
        return (
            <div className="flex flex-col justify-center items-center m-8">
                <div className="flex flex-col justify-center items-center">
                    <h1 className="text-base">
                        <b>Recent Winner:</b> {recentWinner}
                    </h1>
                    <PrizePool pool={Number(formatEther(prizePool))}></PrizePool>
                </div>

                <div className="flex flex-col items-center p-4">
                    <p>Ticket cost: {formatEther(ticketCost)} ETH</p>
                    <p>Tickets in pool: {totalTicketCount.toNumber()}</p>
                    <p>You have: {ownedTicketCount.toNumber()} tickets</p>
                </div>

                <div className="p-4 flex gap-2">
                    <input
                        className="border-2 border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none"
                        type="number"
                        name="toBuyCount"
                        placeholder="Number of tickets to buy"
                        min={1}
                        onChange={(e) => setToBuyCount(Number(e.target.value))}
                    />
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto disabled:opacity-50"
                        onClick={handleBuyTicket}
                        disabled={isLoading || isFetching || toBuyCount <= 0}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            `Buy ${toBuyCount} tickets for ${formatEther(
                                ticketCost.mul(toBuyCount)
                            )} ETH`
                        )}
                    </button>
                </div>

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

    const showAdminInterface = () => {
        return (
            <div>
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
                    <b>Add New Admin: </b>
                    <input
                        type="text"
                        placeholder="0x00000000..."
                        onChange={(e) => setNewAdminAddr(e.target.value)}
                        required
                    />
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={addNewAdmin}
                    >
                        Submit
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

    return <div>{showInterfaces()}</div>
}
