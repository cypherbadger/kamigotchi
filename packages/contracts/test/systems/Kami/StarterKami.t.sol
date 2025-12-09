// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SetupTemplate } from "tests/utils/SetupTemplate.t.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibStarterKami } from "libraries/LibStarterKami.sol";

contract StarterKamiTest is SetupTemplate {
  function testAutoGrantOnRegister() public {
    uint256 accID = _registerAccount(10);
    uint256[] memory kamis = LibAccount.getKamis(components, accID);
    assertEq(kamis.length, 1, "expected starter kami");

    uint256 starterID = kamis[0];
    assertTrue(LibStarterKami.isStarter(components, starterID), "starter flag missing");
    assertEq(LibKami.getAccount(components, starterID), accID, "starter owner mismatch");
  }

  function testStarterHarvestCap() public {
    uint256 starterID = _getStarterKami(alice);
    assertTrue(starterID != 0, "starter not found");

    uint256 harvestID = _startHarvest(starterID, 1);
    _incHarvestBounty(harvestID, 1_000_000);
    uint256 beforeBal = _getItemBal(alice, MUSU_INDEX);
    _collectHarvest(harvestID);
    _stopHarvest(harvestID);

    uint256 cap = LibConfig.get(components, "STARTER_KAMI_HARVEST_CAP");
    uint256 afterBal = _getItemBal(alice, MUSU_INDEX);
    assertEq(afterBal - beforeBal, cap, "starter harvest should respect cap");
    assertTrue(LibStarterKami.isExhausted(components, starterID), "cap flag not set");

    harvestID = _startHarvest(starterID, 1);
    _incHarvestBounty(harvestID, 1_000);
    _collectHarvest(harvestID);
    _stopHarvest(harvestID);

    assertEq(_getItemBal(alice, MUSU_INDEX), afterBal, "cap should prevent more MUSU");
  }

  function _getStarterKami(PlayerAccount memory account) internal view returns (uint256) {
    uint256[] memory kamis = LibAccount.getKamis(components, account.id);
    for (uint256 i; i < kamis.length; i++) {
      if (LibStarterKami.isStarter(components, kamis[i])) return kamis[i];
    }
    return 0;
  }
}
