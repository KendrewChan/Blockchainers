// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

/* Errors */
error Unauthorized();
error RaffleUpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);
error ErrorPayingWinner();
error RaffleInsuficientFunds(uint256 msgValue, uint256 requiredValue);
error RaffleNotOpen();
error RaffleHasNoBidders();

/**@title A sample Raffle Contract
 * @author Patrick Collins
 * @notice This contract is for creating a sample raffle contract
 * @dev This implements the Chainlink VRF Version 2
 */
contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING_VRF
    }
    /* State variables */
    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subId;
    uint32 private immutable i_cbGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    address private s_recentWinner;
    uint256 private immutable i_interval;

    uint256 private i_tixCostWei = 5e15; // Equivalent to 0.005ETH. Use https://www.eth-to-wei.com/
    // uint256 private i_tixCostWei = 1e18;

    mapping(address => bool) admins;

    address[] private contestants;
    mapping(address => uint256) public tickets;
    uint256 private totalNumTickets = 0;

    /* Events */
    event RequestedRaffleWinner(uint256 indexed requestId);
    event RaffleEnter(address indexed player);
    event WinnerPicked(address indexed player);

    /* Functions */
    constructor(
        address vrfCoordinatorV2,
        uint64 subId,
        bytes32 keyHash, // keyHash
        uint256 interval,
        uint32 cbGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_interval = interval;
        i_subId = subId;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_cbGasLimit = cbGasLimit;

        admins[msg.sender] = true;
    }

    modifier onlyAdmins() {
        if (!admins[msg.sender]) revert Unauthorized();
        _;
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls to send the money to the random winner.
     */
    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint256 len = contestants.length;
        if (len == 0) revert RaffleHasNoBidders();
        address[] memory rafflePool = new address[](totalNumTickets);
        uint256 raffleIdx = 0;
        for (uint256 i = 0; i < len; i++) {
            address contestant = contestants[i];
            uint256 numTix = tickets[contestant];
            for (uint256 j = 0; j < numTix; j++) {
                rafflePool[raffleIdx] = contestant;
                ++raffleIdx;
            }
            delete tickets[contestant];
        }
        uint256 winningIdx = randomWords[0] % raffleIdx;
        address winnerAddr = rafflePool[winningIdx];
        s_recentWinner = winnerAddr;

        delete totalNumTickets;
        delete contestants;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        (bool callSuccess, ) = payable(winnerAddr).call{value: address(this).balance}("");
        if (!callSuccess) {
            revert ErrorPayingWinner();
        }
        emit WinnerPicked(winnerAddr);
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True.
     * the following should be true for this to return true:
     * 1. The time interval has passed between raffle runs.
     * 2. The lottery is open.
     * 3. The contract has ETH.
     * 4. Implicity, your subscription is funded with LINK.
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isRaffleOpen = s_raffleState == RaffleState.OPEN;
        bool hasTimePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayers = (contestants.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = isRaffleOpen && hasTimePassed && hasPlayers && hasBalance;
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * and it kicks off a Chainlink VRF call to get a random winner.
     */
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert RaffleUpkeepNotNeeded(
                address(this).balance,
                contestants.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING_VRF;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subId,
            REQUEST_CONFIRMATIONS,
            i_cbGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    /** Contract Functions */
    function buyTickets() public payable {
        uint256 tixCostWei = i_tixCostWei;
        if (msg.value < tixCostWei) revert RaffleInsuficientFunds(msg.value, tixCostWei);
		if (s_raffleState != RaffleState.OPEN) revert RaffleNotOpen();

        if (tickets[msg.sender] == 0) contestants.push(msg.sender);
        uint256 numTix = msg.value / tixCostWei;
        tickets[msg.sender] += numTix;
        totalNumTickets += numTix;

        emit RaffleEnter(msg.sender);
    }

	/** Fallback functions */
	fallback() external payable {
        buyTickets();
    }

    receive() external payable {
        buyTickets();
    }

    /** Setters */
    function addAdmin(address _newAdmin) public onlyAdmins {
        admins[_newAdmin] = true;
    }

    function changeTicketCost(uint256 newTixCost) public onlyAdmins {
        i_tixCostWei = newTixCost;
    }

    /** Getters */
    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getContestant(uint256 index) public view returns (address) {
        return contestants[index];
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getTicketCost() public view returns (uint256) {
        return i_tixCostWei;
    }

    function getNumContestants() public view returns (uint256) {
        return contestants.length;
    }

    function getNumTickets() public view returns (uint256) {
        return totalNumTickets;
    }

    function getUserTickets() public view returns (uint256) {
        return tickets[msg.sender];
    }

    function isUserAdmin() public view returns (bool) {
        return admins[msg.sender];
    }
}
