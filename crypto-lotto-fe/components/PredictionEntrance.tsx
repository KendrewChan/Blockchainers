import {useWeb3Contract, useMoralis} from "react-moralis"
import {useEffect, useState} from "react"
import {useNotification} from "web3uikit"
import PrizePool from "./PrizePool"
import ErrorBanner from "./ErrorBanner"

import {BigNumber} from "ethers"
import {formatEther} from "ethers/lib/utils"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"
import {useForm} from "react-hook-form"
import Moralis from "moralis";
import web3 = Moralis.web3;
import Pot from "./Pot";
import ArrowCircleDown from "web3uikit/src/components/Icon/icons/arrow-circle-down";


export type BuyTicketFormData = {
    ticketBid: number
}

export default function PredictionGameEntrance() {
    const {chainId: chainIdHex, isWeb3Enabled} = useMoralis()
    const chainId = parseInt(chainIdHex)
    // const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const raffleAddress = "0x0CE93bDd0f47F5ee8fAd04F8cb9E38Ee54F1aF80";

    const dispatch = useNotification()

    // Interaction with the smart contract
    const [ticketBid, setTicketBid] = useState<BigNumber>(BigNumber.from(0));
    const [lastPrice, setLastPrice] = useState<BigNumber>(BigNumber.from(0));
    const [currentPrice, setCurrentPrice] = useState<BigNumber>(BigNumber.from(0));
    const [direction, setDirection] = useState<boolean>(false);
    const [hasBidded, setHasBidded] = useState<boolean>(false);
    const [pricePool, setPricePool] = useState<BigNumber>(BigNumber.from(0));
    const [minBid, setMinBid] = useState<BigNumber>(BigNumber.from(0));
    const [roundDuration, setRoundDuration] = useState<BigNumber>(BigNumber.from(0));
    const [currentPotsize, setCurrentPotsize] = useState<BigNumber>(BigNumber.from(0));
    const [buyError, setBuyError] = useState(false);
    const [buyErrorMessage, setBuyErrorMessage] = useState("");

    useEffect(() => {
        if (isWeb3Enabled) updateUI()
    }, [isWeb3Enabled]);

    // For betting
    const {register, watch, handleSubmit} = useForm<BuyTicketFormData>({
        defaultValues: {
            ticketBid: 1,
        },
    })

    const toBet = watch("ticketBid");

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
        msgValue: ticketBid.toString(),
        params: {isVoteUp: direction},
    })

    const {
        runContractFunction: withdraw,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "withdraw",
        params: {},
    })

    const {
        runContractFunction: getCurrentPrice
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "currentRoundPrice"
    })

    const {
        runContractFunction: getMinBid
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "minBid"
    })

    const {
        runContractFunction: checkUpkeep
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "checkUpkeep",
        params: {performData: 0x00}
    })

    async function updateUI() {
        // Update when someone else bets on the pot or pot ends
        const currentPrice = (await getCurrentPrice()) as BigNumber
        setCurrentPrice(currentPrice);

        const minBid = (await getMinBid()) as BigNumber
        setMinBid(minBid);
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

    const showPreviousPot = () => {
        return (
            <Pot
                label={"Previous Pot"}
                currentPrice={10}
                previousPrice={6}
                prizePool={BigNumber.from(1000)}
            ></Pot>
        );
    }

    const showCurrentPot = () => {
        return (
            <Pot
                label={"Current Pot"}
                currentPrice={10}
                previousPrice={5}
                prizePool={BigNumber.from(1000)}
            ></Pot>
        );
    }

    const makeStonks = () => {
        setDirection(true);
    }

    const makeNotStonks = () => {
        setDirection(false);
    }

    const stonks = () => {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                 stroke="currentColor" className="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75L12 3m0 0l3.75 3.75M12 3v18"/>
            </svg>
        );
    }

    const notStonks = () => {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                 stroke="currentColor" className="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25L12 21m0 0l-3.75-3.75M12 21V3"/>
            </svg>
        );
    }

    const handlePlaceBet = async () => {
        await placeBet({
            // onComplete:
            onSuccess: handlePlaceBetSuccess, // When function is successful
            onError: (err) => {
                console.log(err);
                setBuyError(true)
                setBuyErrorMessage(err.message)
            },
        })
    }

    const showUserInterface = () => {
        return (
            <div className="w-full flex justify-center">
                <div className="flex flex-col max-w-xl">
                    <div
                        className="flex flex-1 flex-col justify-center max-w-xl m-4 space-y-4"
                        style={{
                            "display": "flex"
                        }}
                    >
                        <h1 className="text-4xl">Prediction Game</h1>
                        <p className="font-semibold text-ellipsis overflow-hidden">
                            Current Pot Size: {currentPotsize.toString()}
                        </p>
                        <div
                            className={"container"}
                            style={{
                                "display": "flex"
                            }}
                        >
                            {showPreviousPot()}
                            {showCurrentPot()}
                        </div>
                    </div>
                    <form
                        onSubmit={handleSubmit(async (data) => {
                            console.log("hi", data)

                            await placeBet();
                        })}
                        className="flex flex-col gap-2 flex-wrap item-center"
                    >
                        <div className="flex item-center">

                            {buyError &&
                                (<ErrorBanner error={buyErrorMessage} closeCB={() => {
                                    setBuyError(false)
                                }}></ErrorBanner>)
                            }
                        </div>
                        <div className="flex gap-2 flex-wrap">

                            <input
                                className="border-2 flex-1 border-gray-300 bg-white p-2 rounded text-sm focus:outline-none"
                                type="number"
                                placeholder="Number of tickets to buy"
                                min={1}
                                max={100000000000000000000}
                                required={true}
                                {...register("ticketBid", {required: true})}
                            />
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                onClick={handlePlaceBet}
                                disabled={isLoading || isFetching || toBet <= 0}
                                type="submit"
                            >
                                {isLoading || isFetching ? (
                                    <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                ) : (
                                    `Bet ${formatEther(
                                        toBet
                                    )} ETH`
                                )}
                            </button>
                        </div>
                    </form>
                    <button
                        onClick={makeStonks}
                    >
                        {stonks()}
                    </button>
                    <button
                        onClick={makeNotStonks}
                    >
                        {notStonks()}
                    </button>
                </div>
            </div>
        )
    }

    if (!raffleAddress) return <div>No Raffle Address detected</div>
    return showUserInterface()
}
