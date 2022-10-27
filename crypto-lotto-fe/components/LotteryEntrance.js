import { useWeb3Contract, useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { useNotification } from "web3uikit"
import PrizePool from "./PrizePool"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"

export default function LotteryEntrance() {
    // TODO: Check if other networks are being used, and reject/show diff page
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const dispatch = useNotification()

    const [ticketCost, setTicketCost] = useState("0")
    const [numberOfTickets, setNumberOfTickets] = useState("0")
    const [numberOfOwnedTickets, setOwnedTickets] = useState("0")
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
        const ticketCost = await getTicketCost()
        setTicketCost(ticketCost)

        const numTicketsFromCall = (await getNumTickets()).toString()
        setNumberOfTickets(numTicketsFromCall)

        const ownedTickets = (await getUserTickets()).toString()
        setOwnedTickets(ownedTickets)

        const recentWinnerFromCall = await getRecentWinner()
        setRecentWinner(recentWinnerFromCall)

        const userStatus = await isUserAdmin()
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

    const buyTicketBtn = async () => {
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
        const prizePool = (parseInt(numberOfTickets) * parseInt(ticketCost)) / 1e18
        return (
            <div className="flex flex-col justify-center items-center m-8">
                <div className="flex flex-col justify-center items-center">
                    <h1 className="text-base">
                        <b>Recent Winner:</b> {recentWinner}
                    </h1>
                    <PrizePool pool={prizePool}></PrizePool>
                </div>

                <div className="flex flex-col items-center p-4">
                    <p>Ticket cost: {ticketCost / 1e18} ETH</p>
                    <p>Total Ticket pool: {numberOfTickets}</p>
                    <p>Owned tickets: {numberOfOwnedTickets}</p>
                </div>

                <div className="p-4">
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
