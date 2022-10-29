const defaultWinner = "No current pool"

const bannerStyle = {
    border: "3px solid black",
    borderRadius: "15px",
    padding: "25px",
    fontFamily: "Helvetica",
    margin: "20px",
    fontWeight: "500",
    fontSize: "36px",
}

export type PrizePoolProps = {
    pool: number
}

export default function PrizePool({ pool }: PrizePoolProps) {
    return (
        <div className="flex items-center justify-center">
            <div style={bannerStyle}>{pool !== 0 ? `Prize Pool: ${pool} ETH` : defaultWinner}</div>
        </div>
    )
}
