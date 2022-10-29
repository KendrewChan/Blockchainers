import { useWeb3Contract, useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { useNotification } from "web3uikit"
import PrizePool from "./PrizePool"

import { BigNumber } from "ethers"
import { formatEther } from "ethers/lib/utils"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"
import { useForm } from "react-hook-form"

export type BuyTicketFormData = {
    ticketCount: number
}

export default function LotteryEntrance() {
    // TODO: Check if other networks are being used, and reject/show diff page
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const dispatch = useNotification()

    const [ticketCost, setTicketCost] = useState<BigNumber>(BigNumber.from(0))
    const [totalTicketCount, setTotalTicketCount] = useState<BigNumber>(BigNumber.from(0))
    const [ownedTicketCount, setOwnedTicketCount] = useState<BigNumber>(BigNumber.from(0))
    const [recentWinner, setRecentWinner] = useState("0")
    const [isAdmin, setIsAdmin] = useState(false)
    const [isAdminPage, setIsAdminPage] = useState(false)
    const [newAdminAddr, setNewAdminAddr] = useState("")

    const { register, watch, handleSubmit } = useForm<BuyTicketFormData>({
        defaultValues: {
            ticketCount: 1,
        },
    })

    const toBuyCount = watch("ticketCount")

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
            <div className="flex justify-center w-full">
                <div className="flex flex-1 flex-col justify-center max-w-xl m-4 space-y-4">
                    <h1 className="text-4xl">Lottery</h1>
                    <p className="font-semibold text-ellipsis overflow-hidden">
                        Recent Winner: <p>{recentWinner}</p>
                    </p>
                    <section>
                        <h2 className="text-2xl mb-1">Current pool</h2>
                        <div className="border border-blue-700 p-4 rounded-lg">
                            <p className="text-4xl font-light font-mono">{`${formatEther(
                                prizePool
                            )} ETH`}</p>
                            <p className="text-xl">
                                {totalTicketCount.toNumber()} tickets in pool
                            </p>
                        </div>
                    </section>
                    <section>
                        <h2 className="text-2xl mb-1 border-b border-slate-700 pb-1 mt-4">
                            Buy tickets
                        </h2>
                        <p className="font-semibold">
                            You have: {ownedTicketCount.toNumber()} tickets
                        </p>
                        <p>Cost: {formatEther(ticketCost)} ETH/ticket</p>
                        <form
                            onSubmit={handleSubmit(async (data) => {
                                console.log("hi", data)

                                await buyTickets()
                            })}
                            className="flex gap-2 flex-wrap"
                        >
                            <input
                                className="border-2 flex-1 border-gray-300 bg-white p-2 rounded text-sm focus:outline-none"
                                type="number"
                                placeholder="Number of tickets to buy"
                                min={1}
                                required={true}
                                {...register("ticketCount", { required: true })}
                            />
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                onClick={handleBuyTicket}
                                disabled={isLoading || isFetching || toBuyCount <= 0}
                                type="submit"
                            >
                                {isLoading || isFetching ? (
                                    <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                ) : (
                                    `Buy ${toBuyCount} tickets for ${formatEther(
                                        ticketCost.mul(toBuyCount)
                                    )} ETH`
                                )}
                            </button>
                        </form>
                    </section>
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

    if (!raffleAddress) return <div>No Raffle Address detected</div>
    if (isAdminPage) return showAdminInterface()
    return showUserInterface()
}
