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

export default function PrizePool(props) {
    return (
        <div className="flex align-center justify-center">
            <div style={bannerStyle}>
                {props?.pool != 0
                    ? "Prize Pool: " + props?.pool + " ETH"
                    : defaultWinner.toString()}
            </div>
        </div>
    )
}
