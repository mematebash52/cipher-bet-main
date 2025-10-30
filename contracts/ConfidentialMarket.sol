// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

contract ConfidentialMarket {
    struct Bet {
        euint64 yesVotes;
        euint64 noVotes;
    }

    // marketId => data
    mapping(uint256 => Bet) public markets;

    event BetPlaced(uint256 indexed marketId, address indexed better);

    function placeBet(
        uint256 marketId,
        einput encryptedOption,
        bytes calldata inputProof
    ) external {
        euint32 option = TFHE.asEuint32(encryptedOption, inputProof);

        // option: 1 => yes, 0 => no
        euint64 one = TFHE.asEuint64(1);
        euint64 zero = TFHE.asEuint64(0);

        ebool isYes = TFHE.eq(TFHE.asEuint64(option), TFHE.asEuint64(1));
        ebool isNo = TFHE.eq(TFHE.asEuint64(option), TFHE.asEuint64(0));

        Bet storage b = markets[marketId];
        b.yesVotes = TFHE.add(b.yesVotes, TFHE.select(isYes, one, zero));
        b.noVotes = TFHE.add(b.noVotes, TFHE.select(isNo, one, zero));

        emit BetPlaced(marketId, msg.sender);
    }

    function getMarket(uint256 marketId) external view returns (euint64, euint64) {
        Bet storage b = markets[marketId];
        return (b.yesVotes, b.noVotes);
    }
}
