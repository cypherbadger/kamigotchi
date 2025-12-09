// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKamiCreate } from "libraries/LibKamiCreate.sol";

library LibStarterKami {
  using LibString for string;

  uint32 internal constant DATA_INDEX = 0;
  uint32 internal constant DEFAULT_OFFSET = 1_000_000;
  uint256 internal constant DEFAULT_HARVEST_CAP = 250;
  uint256 internal constant DEFAULT_HARVEST_BPS = 2_500; // 25%
  string internal constant DEFAULT_NAME_PREFIX = "Holo Kami ";

  string internal constant DATA_TOTAL = "TOTAL_NUM_STARTER_KAMIS";
  string internal constant DATA_EARNED = "STARTER_MUSU_EARNED";

  string internal constant FLAG_ACCOUNT = "HAS_STARTER_KAMI";
  string internal constant FLAG_KAMI = "STARTER_KAMI";
  string internal constant FLAG_CAP_EXHAUSTED = "STARTER_CAP_EXHAUSTED";

  string internal constant CONFIG_ENABLED = "STARTER_KAMI_ENABLED";
  string internal constant CONFIG_AUTO_GRANT = "STARTER_KAMI_AUTO_GRANT";
  string internal constant CONFIG_INDEX_OFFSET = "STARTER_KAMI_INDEX_OFFSET";
  string internal constant CONFIG_NAME = "STARTER_KAMI_NAME";
  string internal constant CONFIG_HARVEST_CAP = "STARTER_KAMI_HARVEST_CAP";
  string internal constant CONFIG_HARVEST_BPS = "STARTER_KAMI_HARVEST_BPS";

  /// @notice automatically mints a starter for the account when allowed by config.
  function autoGrant(IUintComp components, uint256 accID) internal returns (uint256) {
    if (!isEnabled(components)) return 0;
    if (!LibConfig.getBool(components, CONFIG_AUTO_GRANT)) return 0;
    if (LibFlag.has(components, accID, FLAG_ACCOUNT)) return 0;
    return _grantStarter(components, accID);
  }

  /// @notice grants a starter for accounts that have not yet received one.
  function grant(IUintComp components, uint256 accID) internal returns (uint256) {
    if (!isEnabled(components)) revert("starter disabled");
    if (LibFlag.has(components, accID, FLAG_ACCOUNT)) revert("starter already claimed");
    return _grantStarter(components, accID);
  }

  /// @notice check if a kami is flagged as a starter.
  function isStarter(IUintComp components, uint256 kamiID) internal view returns (bool) {
    return LibFlag.has(components, kamiID, FLAG_KAMI);
  }

  /// @notice adjusts harvest output based on starter throttles and tracks progress.
  function applyHarvestModifier(
    IUintComp components,
    uint256 kamiID,
    uint256 rawAmount
  ) internal returns (uint256) {
    if (!isEnabled(components)) return rawAmount;
    if (!isStarter(components, kamiID)) return rawAmount;

    uint256 cap = _getHarvestCap(components);
    uint256 bps = _getHarvestBps(components);
    if (bps == 0) return 0;

    uint256 scaled = (rawAmount * bps) / 10_000;
    if (cap == 0) return scaled;

    uint256 earned = LibData.get(components, kamiID, DATA_INDEX, DATA_EARNED);
    if (earned >= cap) {
      _setExhausted(components, kamiID, true);
      return 0;
    }

    uint256 remaining = cap - earned;
    uint256 allowed = scaled > remaining ? remaining : scaled;
    if (allowed == 0) {
      _setExhausted(components, kamiID, true);
      return 0;
    }

    LibData.inc(components, kamiID, DATA_INDEX, DATA_EARNED, allowed);
    _setExhausted(components, kamiID, earned + allowed >= cap);
    return allowed;
  }

  /// @notice returns remaining MUSU cap for the starter.
  function remainingCap(IUintComp components, uint256 kamiID) internal view returns (uint256) {
    if (!isStarter(components, kamiID)) return 0;
    uint256 cap = _getHarvestCap(components);
    if (cap == 0) return 0;
    uint256 earned = LibData.get(components, kamiID, DATA_INDEX, DATA_EARNED);
    return cap > earned ? cap - earned : 0;
  }

  /// @notice checks whether the starter feature is enabled.
  function isEnabled(IUintComp components) internal view returns (bool) {
    return LibConfig.getBool(components, CONFIG_ENABLED);
  }

  /// @notice returns true if the starter has exhausted their MUSU allowance.
  function isExhausted(IUintComp components, uint256 kamiID) internal view returns (bool) {
    return LibFlag.has(components, kamiID, FLAG_CAP_EXHAUSTED);
  }

  function _grantStarter(IUintComp components, uint256 accID) internal returns (uint256 kamiID) {
    (uint32 serial, uint32 index) = _nextIndex(components);
    kamiID = LibKami.genID(index);
    if (LibEntityType.checkAndSet(components, kamiID, "KAMI")) revert("starter exists");

    LibKamiCreate.setBase(components, kamiID, index, accID);
    uint32[] memory traits = LibKamiCreate.setTraits(components, kamiID);
    LibKamiCreate.setStats(components, kamiID, traits);
    LibKamiCreate.setURI(components, kamiID, traits);
    LibKami.setName(components, kamiID, _formatName(components, serial));

    LibFlag.set(components, accID, FLAG_ACCOUNT, true);
    LibFlag.set(components, kamiID, FLAG_KAMI, true);
    _setExhausted(components, kamiID, false);
    LibData.set(components, kamiID, DATA_INDEX, DATA_EARNED, 0);
    return kamiID;
  }

  function _nextIndex(
    IUintComp components
  ) internal returns (uint32 serialNumber, uint32 entityIndex) {
    uint256 total = LibData.get(components, 0, DATA_INDEX, DATA_TOTAL);
    serialNumber = uint32(total + 1);
    LibData.set(components, 0, DATA_INDEX, DATA_TOTAL, total + 1);

    uint32 offset = _getIndexOffset(components);
    entityIndex = offset + serialNumber;
  }

  function _formatName(IUintComp components, uint32 serial) internal view returns (string memory) {
    string memory prefix = DEFAULT_NAME_PREFIX;
    if (LibConfig.has(components, CONFIG_NAME)) {
      prefix = LibConfig.getString(components, CONFIG_NAME);
    }
    return prefix.concat(LibString.toString(serial));
  }

  function _getIndexOffset(IUintComp components) internal view returns (uint32) {
    if (!LibConfig.has(components, CONFIG_INDEX_OFFSET)) return DEFAULT_OFFSET;
    return uint32(LibConfig.get(components, CONFIG_INDEX_OFFSET));
  }

  function _getHarvestCap(IUintComp components) internal view returns (uint256) {
    if (!LibConfig.has(components, CONFIG_HARVEST_CAP)) return DEFAULT_HARVEST_CAP;
    return LibConfig.get(components, CONFIG_HARVEST_CAP);
  }

  function _getHarvestBps(IUintComp components) internal view returns (uint256) {
    if (!LibConfig.has(components, CONFIG_HARVEST_BPS)) return DEFAULT_HARVEST_BPS;
    return LibConfig.get(components, CONFIG_HARVEST_BPS);
  }

  function _setExhausted(IUintComp components, uint256 kamiID, bool exhausted) internal {
    LibFlag.set(components, kamiID, FLAG_CAP_EXHAUSTED, exhausted);
  }
}
