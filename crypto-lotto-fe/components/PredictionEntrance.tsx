import { useWeb3Contract, useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { useNotification } from "web3uikit"
import PrizePool from "./PrizePool"
import ErrorBanner from "./ErrorBanner"

import { BigNumber } from "ethers"
import { formatEther } from "ethers/lib/utils"

import contractAddresses from "../constants/contractAddresses.json"
import abi from "../constants/abi.json"
import { useForm } from "react-hook-form"
import Moralis from "moralis";
import web3 = Moralis.web3;
import Pot from "./Pot";


export type BuyTicketFormData = {
    ticketBid: number
}

export default function PredictionGameEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const dispatch = useNotification()

    // Interaction with the smart contract
    const [ticketBid, setTicketBid] = useState<BigNumber>(BigNumber.from(0));
    const [lastPrice, setLastPrice] = useState<BigNumber>(BigNumber.from(0));
    const [currentPrice, setCurrentPrice] = useState<BigNumber>(BigNumber.from(0));
    const [direction, setDirection] = useState<boolean>(undefined);
    const [hasBidded, setHasBidded] = useState<boolean>(false);
    const [pricePool, setPricePool] = useState<BigNumber>(BigNumber.from(0));
    const [minBid, setMinBid] = useState<BigNumber>(BigNumber.from(0));
    const [roundDuration, setRoundDuration] = useState<BigNumber>(BigNumber.from(0));
    const [currentPotsize, setCurrentPotsize] = useState<BigNumber>(BigNumber.from(0));

    useEffect(() => {
        if (isWeb3Enabled) updateUI()
    }, [isWeb3Enabled]);

    // For betting
    const { register, watch, handleSubmit } = useForm<BuyTicketFormData>({
        defaultValues: {
            ticketBid: 1,
        },
    })

    const toBuyTicketBid = watch("ticketBid");

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
        params: { isVoteUp: direction },
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
        params: { performData: 0x00 }
    })

    async function updateUI() {
        const currentPrice = (await getCurrentPrice()) as BigNumber
        setCurrentPrice(currentPrice);

        const minBid = (await getMinBid()) as BigNumber
        setMinBid(minBid);
    }

    const pot = () => {

    }

    const showPreviousPot = () => {
        return (
            <Pot
                label={"Current Pot"}
                currentPrice={10}
                previousPrice={6}
            ></Pot>
        );
    }

    const showCurrentPot = () => {
        return (
            <Pot
                label={"Current Pot"}
                currentPrice={10}
                previousPrice={5}
            ></Pot>
        );
    }

    const showUserInterface = () => {
        return (
            <div className="flex justify-center w-full">
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
                        {showCurrentPot()}
                        {showPreviousPot()}
                    </div>
                </div>
                <button></button>
            </div>
        )
    }

    if (!raffleAddress) return <div>No Raffle Address detected</div>
    return showUserInterface()
}
