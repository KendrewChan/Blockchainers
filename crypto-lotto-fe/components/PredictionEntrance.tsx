import {useWeb3Contract, useMoralis} from "react-moralis"
import {useEffect, useState} from "react"
import {useNotification} from "web3uikit"
import PrizePool from "./PrizePool"
import ErrorBanner from "./ErrorBanner"

import {BigNumber} from "ethers"
import {formatEther, parseEther} from "ethers/lib/utils"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"
import {useForm} from "react-hook-form"
import Moralis from "moralis"
import web3 = Moralis.web3
import Pot from "./Pot"
import {ArrowLongDownIcon, ArrowLongUpIcon} from "@heroicons/react/20/solid"
import ArrowCircleDown from "web3uikit/src/components/Icon/icons/arrow-circle-down"
import Button from "./Button"
import TradingViewWidget from 'react-tradingview-widget';
import {Simulate} from "react-dom/test-utils";
import load = Simulate.load;
import dynamic from 'next/dynamic'

const DynamicTradingView = dynamic(
    () => import('react-tradingview-widget'),
    {ssr: false}
)

export type BuyTicketFormData = {
    ticketBid: number
}

export default function PredictionGameEntrance() {
    const {account, chainId: chainIdHex, isWeb3Enabled} = useMoralis()
    const chainId = parseInt(chainIdHex)
    console.log(account);
    useEffect(() => {
        account && console.log(account);
    }, [account]);

    // const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const raffleAddress = "0x0CE93bDd0f47F5ee8fAd04F8cb9E38Ee54F1aF80"

    const dispatch = useNotification()

    // Upkeep -> Set the hasBidded back to False

    // Interaction with the smart contract
    const [ticketBid, setTicketBid] = useState<BigNumber>(BigNumber.from(0))
    const [lastPrice, setLastPrice] = useState<BigNumber>(BigNumber.from(0))
    const [currentPrice, setCurrentPrice] = useState<BigNumber>(BigNumber.from(0))
    const [direction, setDirection] = useState<boolean>(false)
    const [hasBidded, setHasBidded] = useState<boolean>(false)
    const [pricePool, setPricePool] = useState<BigNumber>(BigNumber.from(0))
    const [minBid, setMinBid] = useState<BigNumber>(BigNumber.from(0))
    const [roundDuration, setRoundDuration] = useState<BigNumber>(BigNumber.from(0))
    const [currentPotsize, setCurrentPotsize] = useState<BigNumber>(BigNumber.from(0))
    const [currentUpPotsize, setCurrentUpPotsize] = useState<BigNumber>(BigNumber.from(0))
    const [currentDownPotsize, setCurrentDownPotsize] = useState<BigNumber>(BigNumber.from(0))
    const [nextPotsize, setNextPotsize] = useState<BigNumber>(BigNumber.from(0))
    const [nextUpPotsize, setNextUpPotsize] = useState<BigNumber>(BigNumber.from(0))
    const [nextDownPotsize, setNextDownPotsize] = useState<BigNumber>(BigNumber.from(0))
    const [buyError, setBuyError] = useState(false)
    const [buyErrorMessage, setBuyErrorMessage] = useState("")

    useEffect(() => {
        if (isWeb3Enabled) updateUI()
    }, [isWeb3Enabled])

    // For betting
    const {
        register,
        watch,
        handleSubmit,
        formState: {isDirty, isValid},
    } = useForm<BuyTicketFormData>({
        defaultValues: {
            ticketBid: 1,
        },
    })

    // For truncating BigNumber for display
    const truncate = (wei: BigNumber) => {
        return wei.div(10000).mul(10000)
    }

    const toBetRaw = watch("ticketBid")
    const toBet = Number.isNaN(toBetRaw) ? 0 : toBetRaw

    // Set up FE interaction with the smart contract
    const {
        runContractFunction: placeBet,
        data: enterTxResponse,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "placeBet",
        msgValue: parseEther(toBet.toString()).toString(),
        params: {isVoteUp: direction},
    })

    const {runContractFunction: withdraw} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "withdraw",
        params: {},
    })

    const {runContractFunction: getCurrentBid} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "currentBids",
        params: { "": account },
    })

    const {runContractFunction: getCurrentPrice} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "currentRoundPrice",
    })

    const {runContractFunction: getCurrentPotsize} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "currentPotSize",
    })

    const {runContractFunction: getCurrentDownPotsize} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "currentDownPotSize",
    })

    const {runContractFunction: getCurrentUpPotsize} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "currentUpPotSize",
    })

    const {runContractFunction: getNextPotsize} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "nextPotSize",
    })

    const {runContractFunction: getNextDownPotsize} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "nextDownPotSize",
    })

    const {runContractFunction: getNextUpPotsize} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "nextUpPotSize",
    })

    const {runContractFunction: getMinBid} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "minBid",
    })

    const {runContractFunction: checkUpkeep} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "checkUpkeep",
        params: {performData: 0x00},
    })

    async function updateUI() {
        // Update when someone else bets on the pot or pot ends
        setLastPrice(currentPrice);

        const newCurrentPrice = (await getCurrentPrice()) as BigNumber
        setCurrentPrice(newCurrentPrice)

        const currentPotSize = (await getCurrentPotsize()) as BigNumber
        setCurrentPotsize(currentPotSize);

        const currentDownPotSize = (await getCurrentDownPotsize()) as BigNumber
        setCurrentDownPotsize(currentDownPotSize);

        const currentUpPotSize = (await getCurrentUpPotsize()) as BigNumber
        setCurrentUpPotsize(currentUpPotSize);

        const nextPoolSize = (await getNextPotsize()) as BigNumber
        setNextPotsize(nextPoolSize);

        const nextDownPotSize = (await getNextDownPotsize()) as BigNumber
        setNextDownPotsize(nextDownPotSize);

        const nextUpPotSize = (await getNextUpPotsize()) as BigNumber
        setNextUpPotsize(nextUpPotSize);

        const minBid = (await getMinBid()) as BigNumber
        console.log("minBid " + formatEther(minBid.toString()));
        setMinBid(minBid)
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
    const showCurrentPot = () => {
        return (
            <Pot
                label={"Previous Pot"}
                currentPrice={formatEther(truncate(currentPotsize)).toString()}
                prizePool={BigNumber.from(1000)}
            ></Pot>
        )
    }

    const showNextPot = () => {
        return (
            <Pot
                label={"Next Pot"}
                currentPrice={formatEther(truncate(nextPotsize)).toString()}
                prizePool={BigNumber.from(1000)}
            ></Pot>
        )
    }

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

    const showUserInterface = () => {
        return (
            <div className="w-full flex justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-col max-w-xl">
                        <div
                            className="flex flex-1 flex-col justify-center max-w-xl m-4 space-y-4"
                            style={{
                                display: "flex",
                            }}
                        >
                            <h1 className="text-4xl">Prediction Game</h1>
                            <p className="font-semibold text-ellipsis overflow-hidden">
                                Current Pot Size: {currentPotsize.toString()}
                            </p>
                            <div
                                className={"container"}
                                style={{
                                    display: "flex",
                                }}
                            >
                                {showCurrentPot()}
                                {showNextPot()}
                            </div>
                        </div>
                        <p>
                            Your bid for the next round
                        </p>
                        <form
                            onSubmit={handleSubmit(async (data) => {
                                console.log("hi", data)
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
                                        min: 1,
                                        validate: (value) => {
                                            return 1 <= value && value <= 100000000000000000000
                                        },
                                    })}
                                />
                            </div>
                        </form>
                        <p>Minimum bid: {formatEther(minBid)} ETH</p>
                        <div className="flex gap-4">
                            <Button
                                color="success"
                                icon={<ArrowLongUpIcon className="w-8 h-8"/>}
                                onClick={makeStonks}
                                disabled={!isValid}
                            >
                                <div className="flex flex-col items-start text-start">
                                    <p className="font-semibold">Long</p>
                                    <p>{toBet} ETH</p>
                                </div>
                            </Button>
                            <Button
                                color="danger"
                                icon={<ArrowLongDownIcon className="w-8 h-8"/>}
                                onClick={makeNotStonks}
                                disabled={!isValid}
                            >
                                <div className="flex flex-col items-start text-start">
                                    <p className="font-semibold">Short</p>
                                    <p>{toBet} ETH</p>
                                </div>
                            </Button>
                        </div>
                    </div>
                    <DynamicTradingView/>
                </div>
            </div>
        )
    }

    if (!raffleAddress) return <div>No Raffle Address detected</div>
    return showUserInterface()
}
