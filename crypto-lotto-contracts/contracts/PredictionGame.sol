// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
pragma abicoder v2;

// AutomationCompatible.sol imports the functions from both ./AutomationBase.sol and
// ./interfaces/AutomationCompatibleInterface.sol
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

/**
 * Horse betting but for ETH price.
 *
 * Keep track of previous round bets and current round bets
 */
contract PredictionGame is AutomationCompatibleInterface, ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    bytes32 private jobId;
    uint256 private fee;

    mapping(address => uint) public pendingReturns;
    uint immutable public minBid;
    uint immutable public roundDuration;
    uint public lastRoundPrice;
    uint public currentRoundPrice;
    uint public lastRoundEndTime;
    uint immutable public maxVotingDuration;

    // Parameters for next round bidding
    mapping(address => uint) public nextBids;
    address[] public nextUpVoters;
    address[] public nextDownVoters;
    uint public nextPotSize;
    uint public nextUpPotSize;
    uint public nextDownPotSize;

    // Parameters for current round bidding
    mapping(address => uint) public currentBids;
    address[] public currentUpVoters;
    address[] public currentDownVoters;
    uint public currentPotSize;
    uint public currentUpPotSize;
    uint public currentDownPotSize;

    event RequestVolume(bytes32 indexed requestId, uint256 volume);

    /**
     * @notice Initialize the link token and target oracle
     *
     * Goerli Testnet details:
     * Link Token: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB
     * Oracle: 0xCC79157eb46F5624204f47AB42b3906cAA40eaB7 (Chainlink DevRel)
     *
     */
    constructor(uint _minBid, uint _roundDuration, uint _cooldownDuration) ConfirmedOwner(msg.sender) {
        minBid = _minBid;
        roundDuration = _roundDuration * 1 seconds;
        maxVotingDuration = (_roundDuration - _cooldownDuration) * 1 seconds;

        nextPotSize = 0;
        nextUpPotSize = 0;
        nextDownPotSize = 0;
        currentPotSize = 0;
        currentUpPotSize = 0;
        currentDownPotSize = 0;

        lastRoundEndTime = 0;

        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
        setChainlinkOracle(0xCC79157eb46F5624204f47AB42b3906cAA40eaB7);
        jobId = "ca98366cc7314957b8c012c72f05aeeb";
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0,1 * 10**18 (Varies by network and job)
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 100 (to remove decimal places from data).
     */
    function requestEthereumPrice() public returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // Set the URL to perform the GET request on
        req.add("get", "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD");

        req.add("path", "USD"); // Chainlink nodes 1.0.0 and later support this format

        // Multiply the result by 100 to remove decimals
        int256 timesAmount = 10**2;
        req.addInt("times", timesAmount);

        // Sends the request
        return sendChainlinkRequest(req, fee);
    }

    /**
     * Receive the response in the form of uint256 and process the current round of bidding for the prediction game.
     */
    function fulfill(bytes32 _requestId, uint256 _volume) public recordChainlinkFulfillment(_requestId) {
        emit RequestVolume(_requestId, _volume);
        lastRoundPrice = currentRoundPrice;
        currentRoundPrice = _volume;

        if (currentRoundPrice >= lastRoundPrice) {
            for (uint i = 0; i < currentUpVoters.length; i++) {
                address voter = currentUpVoters[i];
                pendingReturns[voter] += (currentBids[voter]/ currentUpPotSize) * currentPotSize;
                currentBids[voter] = 0;
            }
            for (uint i = 0; i < currentDownVoters.length; i++) {
                currentBids[currentDownVoters[i]] = 0;
            }
        } else {
            for (uint i = 0; i < currentDownVoters.length; i++) {
                address voter = currentDownVoters[i];
                pendingReturns[voter] += (currentBids[voter]/ currentDownPotSize) * currentPotSize;
                currentBids[voter] = 0;
            }
            for (uint i = 0; i < currentUpVoters.length; i++) {
                currentBids[currentUpVoters[i]] = 0;
            }
        }

        for (uint i = 0; i< nextUpVoters.length; i++) {
                address voter = nextUpVoters[i];
                currentBids[voter] = nextBids[voter];
        }
        for (uint i = 0; i< nextDownVoters.length; i++) {
                address voter = nextDownVoters[i];
                currentBids[voter] = nextBids[voter];
        }

        currentUpVoters = nextUpVoters;
        currentDownVoters = nextDownVoters;
        currentPotSize = nextPotSize;
        currentUpPotSize = nextUpPotSize;
        currentDownPotSize = nextDownPotSize;

        delete nextUpVoters;
        delete nextDownVoters;
        nextPotSize = 0;
        nextUpPotSize = 0;
        nextDownPotSize = 0;

        lastRoundPrice = currentRoundPrice;
    }

    /**
     * Allow withdraw of Link tokens from the contract
     */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), 'Unable to transfer');
    }

    /**
    * Allows user to place a bet with bool isVoteUp being True if vote is up, False if vote is down
    */
    function placeBet(bool isVoteUp) public payable {
        require(
            msg.value > minBid,
            "Bet is too small, please place a higher bet!"
        );
        require(
            nextBids[msg.sender] == 0,
            "You have already voted! Please wait for the next round to vote"
        );
//        require(
//            (block.timestamp - lastRoundEndTime) < maxVotingDuration,
//            "Voting for the next round has ended. Please wait for the next voting round to start!"
//        );

        if (isVoteUp) {
            nextUpVoters.push(msg.sender);
            nextUpPotSize += msg.value;
        } else {
            nextDownVoters.push(msg.sender);
            nextDownPotSize += msg.value;
        }
        nextPotSize += msg.value;
        nextBids[msg.sender] += msg.value;
    }

    function withdraw() public returns (bool) {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;

            if (!payable(msg.sender).send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    // Standard functions for chain link scheduler to call
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        upkeepNeeded = (block.timestamp - lastRoundEndTime) > roundDuration;
        // We don't use the checkData. The checkData is defined when the Upkeep was registered.
    }

    // Called every round duration.
    function performUpkeep(bytes calldata /* performData */) external override {
        //We highly recommend revalidating the upkeep in the performUpkeep function
        if ((block.timestamp - lastRoundEndTime) > roundDuration) {
            lastRoundEndTime = block.timestamp;
            requestEthereumPrice();
        }
        // We don't use the performData. The performData is generated by the Automation Node's call to your checkUpkeep function
    }
}
