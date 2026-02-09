// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibTypes } from "solecs/LibTypes.sol";

uint256 constant ID = uint256(keccak256("system.coinflip"));

/// @title CoinFlipSystem
/// @notice A simple coin flip game where players wager MUSU against the house.
///         Uses pseudo-randomness derived from block data for outcome determination.
///         The house is the world treasury (entity 0).
contract CoinFlipSystem is System {
  /// @notice minimum wager amount (in MUSU game units)
  uint256 public constant MIN_WAGER = 10;

  /// @notice maximum wager amount (in MUSU game units)
  uint256 public constant MAX_WAGER = 10000;

  /// @notice house edge numerator (3 out of 100 = 3% house edge)
  uint256 public constant HOUSE_EDGE_NUM = 3;
  uint256 public constant HOUSE_EDGE_DEN = 100;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice Execute a coin flip wager
  /// @param choice 0 = heads, 1 = tails
  /// @param wager  amount of MUSU to wager
  function executeTyped(uint8 choice, uint256 wager) public returns (bytes memory) {
    return abi.encode(_flip(choice, wager));
  }

  function execute(bytes memory args) public override returns (bytes memory) {
    (uint8 choice, uint256 wager) = abi.decode(args, (uint8, uint256));
    return abi.encode(_flip(choice, wager));
  }

  /// @dev Core flip logic
  /// @return won true if the player won
  function _flip(uint8 choice, uint256 wager) internal returns (bool won) {
    require(choice <= 1, "CoinFlip: choice must be 0 (heads) or 1 (tails)");
    require(wager >= MIN_WAGER, "CoinFlip: wager below minimum");
    require(wager <= MAX_WAGER, "CoinFlip: wager above maximum");

    // resolve the caller's account entity via operator lookup
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // verify MUSU balance
    uint256 balance = LibInventory.getBalanceOf(components, accID, MUSU_INDEX);
    require(balance >= wager, "CoinFlip: insufficient MUSU");

    // generate pseudo-random outcome from block context
    uint256 seed = uint256(
      keccak256(
        abi.encodePacked(
          block.timestamp,
          block.prevrandao,
          msg.sender,
          accID,
          wager,
          block.number
        )
      )
    );
    uint256 result = LibRandom.getRandom(seed, 2); // 0 or 1

    won = (result == uint256(choice));

    if (won) {
      // player wins: house pays out wager minus house edge
      uint256 payout = wager - ((wager * HOUSE_EDGE_NUM) / HOUSE_EDGE_DEN);
      LibInventory.incFor(components, accID, MUSU_INDEX, payout);
    } else {
      // player loses: deduct wager from player
      LibInventory.decFor(components, accID, MUSU_INDEX, wager);
    }

    // emit event for client to read outcome
    _emitFlipEvent(accID, wager, choice, won);
  }

  function _emitFlipEvent(
    uint256 accID,
    uint256 wager,
    uint8 choice,
    bool won
  ) internal {
    bytes memory encoded = abi.encode(accID, block.timestamp, wager, choice, won);

    uint8[] memory schema = new uint8[](5);
    schema[0] = uint8(LibTypes.SchemaValue.UINT256); // accID
    schema[1] = uint8(LibTypes.SchemaValue.UINT256); // timestamp
    schema[2] = uint8(LibTypes.SchemaValue.UINT256); // wager
    schema[3] = uint8(LibTypes.SchemaValue.UINT8);   // choice
    schema[4] = uint8(LibTypes.SchemaValue.BOOL);    // won

    LibEmitter.emitEvent(world, "COIN_FLIP", schema, encoded);
  }
}
