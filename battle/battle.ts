import { Card, Condition, Effect, Fighter } from "../types/types";
import seedrandom from "seedrandom";

interface State {
  fighter1Health: number;
  fighter2Health: number;
  fighter1Energy: string[];
  fighter2Energy: string[];
  fighter1Range: number;
  fighter2Range: number;
  fighter1Position: number;
  fighter2Position: number;
}

export const executeCombat = async (
  fighter1: Fighter,
  fighter2: Fighter,
  seed: string
) => {
  let updatedFighter1 = updateFighter(fighter1);
  let updatedFighter2 = updateFighter(fighter2);

  let fighter1Health = updatedFighter1.stats.hp;
  let fighter2Health = updatedFighter2.stats.hp;
  const fighter1Energy: string[] = [];
  const fighter2Energy: string[] = [];

  const maxTurns = 100;
  const combatLog = [];
  let turn = 0;

  if (!Array.isArray(fighter1.deck) || !Array.isArray(fighter2.deck)) {
    throw new Error("Invalid deck data");
  }

  let fighter1Range = 1;
  let fighter2Range = 1;

  if (fighter1.equipment.weapon) {
    fighter1Range = fighter1.equipment.weapon.range;
  }

  if (fighter2.equipment.weapon) {
    fighter2Range = fighter2.equipment.weapon.range;
  }

  let state: State = {
    fighter1Health,
    fighter2Health,
    fighter1Energy,
    fighter2Energy,
    fighter1Range,
    fighter2Range,
    fighter1Position: -3,
    fighter2Position: 3,
  };
  while (
    turn < maxTurns &&
    state.fighter1Health > 0 &&
    state.fighter2Health > 0
  ) {
    const currentSeed = `${seed}-${turn}`;

    const { first, second } = getTurnOrder(
      updatedFighter1,
      updatedFighter2,
      currentSeed
    );

    const players = [
      {
        fighter: first,
        isPlayer: first === updatedFighter1,
        deck: first.deck.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)),
      },
      {
        fighter: second,
        isPlayer: second === updatedFighter1,
        deck: second.deck.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)),
      },
    ];

    for (const { fighter, isPlayer, deck } of players) {
      let currentCard = await getValidCard(deck, isPlayer, state);
      if (currentCard) {
        for (const effect of currentCard.effects || []) {
          state = await applyCardEffects(
            effect,
            isPlayer,
            state,
            currentSeed,
            fighter
          );
        }
        combatLog.push({
          currentFighter: fighter.id,
          card: currentCard,
          fighter1: {
            health: state.fighter1Health,
            energy: state.fighter1Energy,
            position: state.fighter1Position,
          },
          fighter2: {
            health: state.fighter2Health,
            energy: state.fighter2Energy,
            position: state.fighter2Position,
          },
          turn: turn,
          seed: currentSeed,
        });
      }
      if (state.fighter1Health <= 0 || state.fighter2Health <= 0) {
        break;
      }
    }

    turn++;
  }

  const fighter1Id = fighter1.id;
  const fighter2Id = fighter2.id;
  let winner: number | null;

  if (state.fighter1Health > state.fighter2Health) {
    winner = fighter1.id;
  } else if (state.fighter1Health < state.fighter2Health) {
    winner = fighter2.id;
  } else {
    winner = null;
  }

  return { fighter1Id, fighter2Id, winner, combatLog };
};

const updateFighter = (fighter: Fighter): Fighter => {
  const updatedFighter = { ...fighter };
  updatedFighter.stats = { ...fighter.stats };

  for (const key in updatedFighter.equipment) {
    const element =
      updatedFighter.equipment[key as keyof typeof updatedFighter.equipment];
    if (element) {
      updatedFighter.stats.hp += element.hp;
      updatedFighter.stats.atk += element.atk;
      updatedFighter.stats.spd += element.spd;
      updatedFighter.stats.mag += element.mag;
      updatedFighter.stats.rng += element.range - 1;
    }
  }
  return updatedFighter;
};

const getTurnOrder = (fighter1: Fighter, fighter2: Fighter, seed: string) => {
  const calculateInitiative = (spd: number, fighter: Fighter) => {
    const rng = seedrandom(seed + fighter.id);
    const min = 0.875;
    const max = 1.125;
    const randomMultiplier = min + rng() * (max - min);
    return Math.floor(spd * randomMultiplier);
  };

  const fighter1Initiative = calculateInitiative(fighter1.stats.spd, fighter1);
  const fighter2Initiative = calculateInitiative(fighter2.stats.spd, fighter2);

  return fighter1Initiative >= fighter2Initiative
    ? { first: fighter1, second: fighter2 }
    : { first: fighter2, second: fighter1 };
};

const getValidCard = (deck: Card[], isfighter: boolean, state: State) => {
  for (const cardData of deck) {
    const allConditionsMet = cardData.conditions.every((condition) => {
      return areConditionsMet(condition, isfighter, state);
    });
    if (allConditionsMet) {
      return cardData;
    }
  }
  return null;
};

const calculateDamage = (
  cardDamage: number,
  fighter: Fighter,
  seed: string
) => {
  const rng = seedrandom(seed);
  const randomMultiplier = 0.875 + rng() * 0.25;
  const atk = fighter.stats.atk;
  const level = fighter.stats.level;
  const damage = Math.max(
    1,
    Math.floor(
      cardDamage * randomMultiplier * (1 + atk * ((level + atk) / 256))
    )
  );
  console.log(damage);
  return damage;
};

const areConditionsMet = (
  condition: Condition,
  isfighter: boolean,
  state: State
) => {
  switch (condition.type) {
    case "healthAbove":
      return isfighter
        ? state.fighter1Health > condition.value
        : state.fighter2Health > condition.value;

    case "healthBelow":
      return isfighter
        ? state.fighter1Health < condition.value
        : state.fighter2Health < condition.value;

    case "energyAbove":
      return isfighter
        ? state.fighter1Energy.filter((e: string) => {
            return e === "energy";
          }).length > condition.value
        : state.fighter2Energy.filter((e: string) => {
            return e === "energy";
          }).length > condition.value;

    case "opponentEnergy":
      return !isfighter
        ? state.fighter1Energy.length >= condition.value
        : state.fighter2Energy.length >= condition.value;

    case "energyCost":
      return isfighter
        ? state.fighter1Energy.filter((e: string) => {
            return e === "energy";
          }).length >= condition.value
        : state.fighter2Energy.filter((e: string) => {
            return e === "energy";
          }).length >= condition.value;

    case "weaponReach": {
      const currentFighterPosition = isfighter
        ? state.fighter1Position
        : state.fighter2Position;
      const otherFighterPosition = isfighter
        ? state.fighter2Position
        : state.fighter1Position;
      const range = isfighter ? state.fighter1Range : state.fighter2Range;
      return isAtWeaponReach(
        range,
        currentFighterPosition,
        otherFighterPosition
      );
    }
    case "canMove": {
      const currentFighterPosition = isfighter
        ? state.fighter1Position
        : state.fighter2Position;
      const otherFighterPosition = isfighter
        ? state.fighter2Position
        : state.fighter1Position;

      return canFighterMove(
        currentFighterPosition,
        otherFighterPosition,
        condition.value
      );
    }
    default:
      return false;
  }
};

const applyCardEffects = (
  effect: Effect,
  isfighter: boolean,
  state: State,
  seed: string,
  currentFighter: Fighter
) => {
  let newState = { ...state };
  console.log(effect);
  switch (effect.type) {
    case "damage":
      const damage = calculateDamage(effect.value, currentFighter, seed);

      if (isfighter) {
        newState.fighter2Health = Math.max(0, state.fighter2Health - damage);
      } else {
        newState.fighter1Health = Math.max(0, state.fighter1Health - damage);
      }
      break;
    case "gainEnergy":
      {
        const maxEnergy = 5;
        const tempEnergy = isfighter
          ? [...state.fighter1Energy]
          : [...state.fighter2Energy];

        for (let i = 0; i < effect.value; i++) {
          if (tempEnergy.length <= maxEnergy) {
            tempEnergy.push("energy");
          } else {
            tempEnergy.shift();
            tempEnergy.push("energy");
          }
        }
        if (isfighter) {
          newState.fighter1Energy = tempEnergy;
        } else {
          newState.fighter2Energy = tempEnergy;
        }
      }
      break;
    case "energyCost":
      {
        const tempEnergy = isfighter
          ? [...newState.fighter1Energy]
          : [...newState.fighter2Energy];
        let remainingCost = effect.value;
        for (let i = 0; i < tempEnergy.length && remainingCost > 0; i++) {
          if (tempEnergy[i] === "energy") {
            remainingCost -= 1;
            tempEnergy.splice(i, 1);
            i--;
          }
        }

        if (isfighter) {
          newState.fighter1Energy = tempEnergy;
        } else {
          newState.fighter2Energy = tempEnergy;
        }
      }
      break;
    case "healthCost":
      if (isfighter) {
        newState.fighter1Health -= effect.value;
      } else {
        newState.fighter2Health -= effect.value;
      }
      break;
    case "movement":
      {
        const currentFighterPosition = isfighter
          ? state.fighter1Position
          : state.fighter2Position;
        const otherFighterPosition = isfighter
          ? state.fighter2Position
          : state.fighter1Position;

        const numberOfMovement = Math.abs(effect.value);
        const movementDirection =
          currentFighterPosition < otherFighterPosition ? 1 : -1;

        let newPosition = currentFighterPosition;

        for (let i = 0; i < numberOfMovement; i++) {
          if (
            canFighterMove(
              currentFighterPosition,
              otherFighterPosition,
              Math.sign(effect.value)
            )
          ) {
            newPosition += movementDirection * 3;
          }
        }
        if (isfighter) {
          newState.fighter1Position = newPosition;
        } else {
          newState.fighter2Position = newPosition;
        }
      }
      break;
  }
  return newState;
};

const canFighterMove = (
  fighter1Position: number,
  fighter2Position: number,
  distance: number
) => {
  const isOnLeftSide = fighter1Position < fighter2Position;
  const newPosition = isOnLeftSide
    ? fighter1Position + distance * 3
    : fighter1Position - distance * 3;
  const respectAreaLimit = newPosition >= -9 && newPosition <= 9;

  if (!respectAreaLimit) return false;

  return isOnLeftSide
    ? newPosition < fighter2Position
    : newPosition > fighter2Position;
};

const isAtWeaponReach = (
  currentFighterRange: number,
  currentFighterPosition: number,
  otherFighterPosition: number
) => {
  let isCloseEnough = false;

  const distanceBetweenFighters = Math.abs(
    currentFighterPosition - otherFighterPosition
  );
  if (distanceBetweenFighters <= currentFighterRange * 3) {
    isCloseEnough = true;
  }
  return isCloseEnough;
};

export const baseStats = () => {
  return {
    level: 1,
    skillPoint: 3,
    xpCurrent: 0,
    xpMax: 100,
    stat: {
      hp: 10,
      atk: 10,
      mag: 10,
      spd: 10,
      rng: 10,
    },
  };
};
