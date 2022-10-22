const defaultWinner = "Nobody won recently. It could be you!"

const bannerStyle = {
    border: "3px solid black",
    borderRadius: "15px",
    padding: "25px",
    fontFamily: "Helvetica",
    margin: "20px",
    fontWeight: "500",
    fontSize: "36px"
}

export default function Winner(props) {
    return (
        <div className="flex align-center justify-center">
            <div style={bannerStyle}>
                {props?.address != 0? props?.address : defaultWinner.toString()}
            </div>
        </div>
    )
}