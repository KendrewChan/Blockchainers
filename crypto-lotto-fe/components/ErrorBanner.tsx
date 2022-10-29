const bannerStyle = {
    border: "1px solid black",
    borderRadius: "5px",
    padding: "15px",
    fontFamily: "Helvetica",
    fontWeight: "500",
    maxWidth: "inherit",
    minWidth: "100%",
    backgroundColor: "rgba(255, 0, 0, 0.5)",
}

export type ErrorMessage = {
    error: string
    closeCB: Function
}

const handleResponse = (error: string) => {
    // i am too lazy to serialize and check the code so i'll live with this..
    if (error.startsWith("insufficient funds")) {
        return "Insufficient funds to complete purchase!"
    }

    return "Internal server error. Please try again."
}

export default function ErrorBanner({ error, closeCB }: ErrorMessage) {
    return (
        <div className="flex gap-2 justify-apart justify-between" style={bannerStyle}>
            <div className="pl-2">{handleResponse(error)}</div>
            <div className="pr-2" onClick={() => closeCB()}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        </div>
    )
}
