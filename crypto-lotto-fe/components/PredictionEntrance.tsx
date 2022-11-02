import { useWeb3Contract, useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { useNotification } from "web3uikit"
import ErrorBanner from "./ErrorBanner"

import { BigNumber } from "ethers"
import { formatEther, parseEther } from "ethers/lib/utils"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/PredictionGameABI.json"
import { useForm } from "react-hook-form"
import Pot from "./Pot"
import { ArrowLongDownIcon, ArrowLongUpIcon } from "@heroicons/react/20/solid"
import Button from "./Button"
import dynamic from "next/dynamic"
import Web3 from "web3"
import { AbiItem } from "web3-utils"
import useContract from "../utils/useContract"

const DynamicTradingView = dynamic(() => import("react-tradingview-widget"), { ssr: false })
const web3 = new Web3("wss://goerli.infura.io/ws/v3/4c1b5e9f813e49a2b999153e01991e7a")
const address = contractAddresses.PredictionGame[0]
const myContract = new web3.eth.Contract(abi as AbiItem[], address)

let options = {
    filter: {
        value: [],
    },
    fromBlock: 0,
}

export type BuyTicketFormData = {
    ticketBid: number
}

export default function PredictionGameEntrance() {
    const { account, chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const dispatch = useNotification()

    // TODO: Need to display error messages in a good way

    // Interaction with the smart contract
    const [direction, setDirection] = useState<boolean>(false)

    const [buyError, setBuyError] = useState(false)
    const [buyErrorMessage, setBuyErrorMessage] = useState("")
    useEffect(() => {
        if (isWeb3Enabled) updateUI()
    }, [isWeb3Enabled])

    // ------------------------ ROUND END BOOKKEEPING ------------------------ //

    const roundEnd = () => {
        updateUI()
        console.log("BID STATE:" + nextBidState)
    }

    useEffect(() => {
        myContract.events
            .RequestVolume(options)
            .on("data", (event) => {
                console.log("DATA: " + event)
                roundEnd()
            })
            .on("changed", (changed) => console.log("CHANGED: " + changed))
            .on("error", (err) => console.log("ERROR: " + err))
            .on("connected", (str) => console.log("CONNECTED: " + str))
    }, [])
    // For betting
    const {
        register,
        watch,
        handleSubmit,
        formState: { isDirty, isValid },
    } = useForm<BuyTicketFormData>({
        defaultValues: {
            ticketBid: 1,
        },
    })

    // For truncating BigNumber for display
    const truncate = (wei: BigNumber) => {
        return wei.div(10000).mul(10000)
    }

    const ticketBidEthRaw = watch("ticketBid")
    const ticketBidEth = Number.isNaN(ticketBidEthRaw) ? 0 : ticketBidEthRaw

    // Set up FE interaction with the smart contract
    const {
        runContractFunction: placeBet,
        data: enterTxResponse,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: address,
        functionName: "placeBet",
        msgValue: parseEther(ticketBidEth.toString()).toString(),
        params: { isVoteUp: direction },
    })

    const { runContractFunction: getRoundEndTime, data: roundStart } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "lastRoundEndTime",
        params: {},
        defaultValue: BigNumber.from(0),
    })

    const { runContractFunction: getRoundDuration, data: roundDuration } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "roundDuration",
        params: {},
        defaultValue: BigNumber.from(0),
    })

    const { runContractFunction: withdraw } = useWeb3Contract({
        abi: abi,
        contractAddress: address,
        functionName: "withdraw",
        params: {},
    })

    // 0 -> no bid, 1 -> bid up, 2 -> bid down
    const { runContractFunction: getNextBidState, data: nextBidState } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "nextVoters",
        params: { "": account },
        defaultValue: BigNumber.from(0),
    })

    const { runContractFunction: getCurrentBidState, data: currentBidState } =
        useContract<BigNumber>({
            abi: abi,
            contractAddress: address,
            functionName: "currentVoters",
            params: { "": account },
            defaultValue: BigNumber.from(0),
        })

    const { runContractFunction: getCurrentBid, data: currentBid } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "currentBids",
        params: { "": account },
        defaultValue: BigNumber.from(0),
    })

    const { runContractFunction: getNextBid, data: nextBid } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "nextBids",
        params: { "": account },
        defaultValue: BigNumber.from(0),
    })

    const { runContractFunction: getCurrentPotSize, data: currentPotSize } =
        useContract<BigNumber>({
            abi: abi,
            contractAddress: address,
            functionName: "currentPotSize",
            defaultValue: BigNumber.from(0),
        })

    const { runContractFunction: getCurrentDownPotSize, data: currentDownPotSize } =
        useContract<BigNumber>({
            abi: abi,
            contractAddress: address,
            functionName: "currentDownPotSize",
            defaultValue: BigNumber.from(0),
        })

    const { runContractFunction: getCurrentUpPotSize, data: currentUpPotSize } =
        useContract<BigNumber>({
            abi: abi,
            contractAddress: address,
            functionName: "currentUpPotSize",
            defaultValue: BigNumber.from(0),
        })

    const { runContractFunction: getNextPotSize, data: nextPotSize } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "nextPotSize",
        defaultValue: BigNumber.from(0),
    })

    const { runContractFunction: getNextDownPotSize, data: nextDownPotSize } =
        useContract<BigNumber>({
            abi: abi,
            contractAddress: address,
            functionName: "nextDownPotSize",
            defaultValue: BigNumber.from(0),
        })

    const { runContractFunction: getNextUpPotSize, data: nextUpPotSize } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "nextUpPotSize",
        defaultValue: BigNumber.from(0),
    })

    const { runContractFunction: getMinBid, data: minBid } = useContract<BigNumber>({
        abi: abi,
        contractAddress: address,
        functionName: "minBid",
        defaultValue: BigNumber.from(1),
    })

    const { runContractFunction: checkUpkeep } = useWeb3Contract({
        abi: abi,
        contractAddress: address,
        functionName: "checkUpkeep",
        params: { performData: 0x00 },
    })

    async function updateUI() {
        // Update when someone else bets on the pot or pot ends
        await Promise.all(
            [
                getCurrentBidState,
                getCurrentBid,
                getCurrentPotSize,
                getCurrentDownPotSize,
                getCurrentUpPotSize,
                getNextBidState,
                getNextBid,
                getNextPotSize,
                getNextDownPotSize,
                getNextUpPotSize,
                getMinBid,
                getRoundEndTime,
                getRoundDuration,
            ].map((fn) => fn())
        )
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

    const handlePlaceBetSuccess = async (tx) => {
        await tx.wait(1)
        handleNewNotification()
        updateUI()
    }
    // Upkeep -> New round
    const makeStonks = async () => {
        setDirection(true)
        await placeBet()
    }

    const makeNotStonks = async () => {
        setDirection(false)
        await placeBet()
    }

    const handlePlaceBet = async () => {
        await placeBet({
            // onComplete:
            onSuccess: handlePlaceBetSuccess, // When function is successful
            onError: (err) => {
                console.log(err)
                setBuyError(true)
                setBuyErrorMessage(err.message)
            },
        })
    }

    const [dummyState, setDummyState] = useState(false)
    const countdown =
        (roundStart?.toNumber() ?? 0) +
        (roundDuration?.toNumber() ?? 0) -
        Math.floor(Date.now() / 1000) // DOES NOT UPDATE AFTER 18 TIMES

    console.log("currentBid", currentBid?.toNumber())
    console.log("nextBid", nextBid?.toNumber())
    useEffect(() => {
        // Create one second timer
        const timer = setInterval(() => {
            setDummyState((dummyState) => !dummyState)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    if (!address) return <div>No Raffle Address detected</div>

    return (
        <div className="w-full flex justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col max-w-xl">
                    <div className="flex flex-1 flex-col justify-center max-w-xl m-4 space-y-4">
                        <h1 className="text-4xl">Prediction Game {countdown}</h1>
                        <p className="font-semibold text-ellipsis overflow-hidden">
                            {countdown < 0
                                ? "Round has ended. Calculating results and starting next round..."
                                : "Round ends in " + countdown + "seconds."}
                        </p>
                        <div className="flex gap-4">
                            <Pot
                                label={"Current Pot"}
                                currentBid={currentBid ?? BigNumber.from(0)}
                                prizePool={currentPotSize ?? BigNumber.from(0)}
                                bidState={
                                    currentBidState !== null
                                        ? currentBidState.eq(2)
                                            ? "DOWN"
                                            : currentBidState.eq(1)
                                            ? "UP"
                                            : ""
                                        : ""
                                }
                            ></Pot>
                            <Pot
                                label={"Next Pot"}
                                currentBid={nextBid ?? BigNumber.from(0)}
                                prizePool={nextPotSize ?? BigNumber.from(0)}
                                bidState={
                                    nextBidState !== null
                                        ? nextBidState.eq(2)
                                            ? "DOWN"
                                            : nextBidState.eq(1)
                                            ? "UP"
                                            : ""
                                        : ""
                                }
                            ></Pot>
                        </div>
                    </div>
                    {(nextBidState === null || nextBidState.isZero()) && countdown > 0 && (
                        <>
                            <p>Your bid for the next round</p>
                            <form
                                onSubmit={handleSubmit(async (data) => {
                                    await placeBet()
                                })}
                                className="flex flex-col gap-2 flex-wrap item-center"
                            >
                                <div className="flex item-center">
                                    {buyError && (
                                        <ErrorBanner
                                            error={buyErrorMessage}
                                            closeCB={() => {
                                                setBuyError(false)
                                            }}
                                        ></ErrorBanner>
                                    )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <input
                                        className="border-2 flex-1 border-gray-300 bg-white p-2 rounded text-sm focus:outline-none"
                                        type="number"
                                        placeholder="Number of tickets to buy"
                                        min={1}
                                        max={100000000000000000000}
                                        required={true}
                                        {...register("ticketBid", {
                                            required: true,
                                            valueAsNumber: true,
                                            min: Number(formatEther(minBid)),
                                            validate: (value) => {
                                                return (
                                                    Number(formatEther(minBid)) <= value &&
                                                    value <= 100000000000000000000
                                                )
                                            },
                                        })}
                                    />
                                </div>
                            </form>
                            <p>Minimum bid: {formatEther(minBid)} ETH</p>
                            <div className="flex gap-4">
                                <Button
                                    color="success"
                                    icon={<ArrowLongUpIcon className="w-8 h-8" />}
                                    onClick={makeStonks}
                                    disabled={
                                        !isValid || Number(formatEther(minBid)) > ticketBidEth
                                    }
                                >
                                    <div className="flex flex-col items-start text-start">
                                        <p className="font-semibold">
                                            Long (~
                                            {currentPotSize
                                                .div(currentUpPotSize.add(minBid).add(1))
                                                .toNumber()}
                                            x)
                                        </p>
                                        <p>{ticketBidEth} ETH</p>
                                    </div>
                                </Button>
                                <Button
                                    color="danger"
                                    icon={<ArrowLongDownIcon className="w-8 h-8" />}
                                    onClick={makeNotStonks}
                                    disabled={
                                        !isValid || Number(formatEther(minBid)) > ticketBidEth
                                    }
                                >
                                    <div className="flex flex-col items-start text-start">
                                        <p className="font-semibold">
                                            Short (~
                                            {currentPotSize
                                                .div(currentDownPotSize.add(minBid).add(1))
                                                .toNumber()}
                                            x)
                                        </p>
                                        <p>{ticketBidEth} ETH</p>
                                    </div>
                                </Button>
                            </div>
                        </>
                    )}
                </div>
                <DynamicTradingView
                    {...({ symbol: "BINANCE:ETHUSDT" } as any)}
                    theme="light"
                    range="1d"
                />
            </div>
        </div>
    )
}
