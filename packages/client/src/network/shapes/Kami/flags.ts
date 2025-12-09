import { EntityIndex, World } from 'engine/recs';

import { Components } from 'network/components';
import { getConfigFieldValue } from 'network/shapes/Config';
import { getData } from 'network/shapes/Data';
import { hasFlag } from '../Flag';

export interface Flags {
  namable: boolean;
  skillReset: boolean;
  starter?: StarterFlag;
}

export interface StarterFlag {
  cap: number;
  earned: number;
  exhausted: boolean;
  remaining: number;
  yieldBps: number;
}

// get the flags of a kami entity
export const getFlags = (world: World, components: Components, entity: EntityIndex): Flags => {
  return {
    namable: !hasFlag(world, components, entity, 'NOT_NAMEABLE'),
    skillReset: hasFlag(world, components, entity, 'CAN_RESET_SKILLS'),
    starter: getStarterFlag(world, components, entity),
  };
};

const getStarterFlag = (
  world: World,
  components: Components,
  entity: EntityIndex
): StarterFlag | undefined => {
  if (!hasFlag(world, components, entity, 'STARTER_KAMI')) return undefined;

  const id = world.entities[entity];
  const cap = getConfigFieldValue(world, components, 'STARTER_KAMI_HARVEST_CAP');
  const earned = getData(world, components, id, 'STARTER_MUSU_EARNED');
  const remaining = cap > earned ? cap - earned : 0;
  const exhausted = hasFlag(world, components, entity, 'STARTER_CAP_EXHAUSTED');
  const yieldBps = getConfigFieldValue(world, components, 'STARTER_KAMI_HARVEST_BPS');

  return {
    cap,
    earned,
    exhausted,
    remaining,
    yieldBps,
  };
};
