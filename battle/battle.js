const seedrandom = require("seedrandom");

const executeCombat = async (fighter1, fighter2, seed) => {
  let fighter1Health = fighter1.stats.hp;
  let fighter2Health = fighter2.stats.hp;
  let fighter1Energy = [];
  let fighter2Energy = [];

  const maxTurns = 1000;
  let turn = 0;
  let combatLog = [];

  if (!Array.isArray(fighter1.deck) || !Array.isArray(fighter2.deck)) {
    throw new Error("Invalid deck data");
  }

  let fighter1Range = 0;
  let fighter2Range = 0;

  for (const [key, value] of Object.entries(fighter1.equipment)) {
    console.log(`${key}: ${value}`);
    if (key === "weapon") {
      if (value) {
        fighter1Range = value.range;
      }
      break;
    }
  }

  for (const [key, value] of Object.entries(fighter2.equipment)) {
    console.log(`${key}: ${value}`);
    if (key === "weapon") {
      if (value) {
        fighter2Range = value.range;
      }
      break;
    }
  }

  /*   for (const equipment of fighter1.equipment) {
    if (equipment.item.slot === "weapon") {
      fighter1Range = equipment.item.range;
      break;
    }
  }

  for (const equipment of fighter2.equipment) {
    if (equipment.item.slot === "weapon") {
      fighter2Range = equipment.item.range;
      break;
    }
  } */

  let state = {
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

    const { first, second } = getTurnOrder(fighter1, fighter2);

    const players = [
      {
        fighter: first,
        isPlayer: first === fighter1,
        deck: first.deck.sort((a, b) => a.slot - b.slot),
      },
      {
        fighter: second,
        isPlayer: second === fighter1,
        deck: second.deck.sort((a, b) => a.slot - b.slot),
      },
    ];

    for (const { fighter, isPlayer, deck } of players) {
      console.log("DECK", deck);
      let currentCard = await getValidCard(deck, isPlayer, state);
      console.log("CURRENT CARD", currentCard);
      if (currentCard) {
        for (const effect of currentCard.effects || []) {
          console.log("EFFECT", effect);
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
  const winner =
    state.fighter1Health > state.fighter2Health ? fighter1.id : fighter2.id;
  const loser =
    state.fighter1Health > state.fighter2Health ? fighter2.id : fighter1.id;
  console.log("RESULSTS", fighter1Id, fighter2Id, winner, loser, combatLog);
  //Penser au cas invalide de combatlog vide
  return { fighter1Id, fighter2Id, winner, loser, combatLog };
};

const getTurnOrder = (fighter1, fighter2, seed) => {
  const calculateInitiative = (spd, fighter) => {
    const rng = seedrandom(seed + fighter.id);
    const randomMultiplier = rng() * (1.125 - 0.875 + 0.875);
    return Math.floor(spd * randomMultiplier);
  };

  const fighter1Initiative = calculateInitiative(fighter1.stats.spd, fighter1);
  const fighter2Initiative = calculateInitiative(fighter2.stats.spd, fighter2);

  return fighter1Initiative >= fighter2Initiative
    ? { first: fighter1, second: fighter2 }
    : { first: fighter2, second: fighter1 };
};

const getValidCard = (deck, isfighter, state) => {
  for (const cardData of deck) {
    console.log("CARDDATA", cardData);
    console.log(
      "TEST",
      cardData.conditions.every((condition) => {
        console.log("condition", condition);
        return areConditionsMet(condition, isfighter, state);
      })
    );
    const allConditionsMet = cardData.conditions.every((condition) => {
      console.log("condition", condition);
      return areConditionsMet(condition, isfighter, state);
    });
    console.log("ALLCONDMET,", allConditionsMet);
    if (allConditionsMet) {
      console.log("CARTE MAGIQUE");
      return cardData;
    }
  }
  return null;
};

const calculateDamage = (cardDamage, fighter, seed) => {
  const rng = seedrandom(seed);
  const randomMultiplier = rng() * (1.125 - 0.875 + 0.875);
  const atk = fighter.stats.atk;
  const level = fighter.stats.level;
  console.log(
    "damage:",
    Math.floor(
      cardDamage * randomMultiplier * (1 + atk * ((level + atk) / 256))
    )
  );
  return Math.floor(
    cardDamage * randomMultiplier * (1 + atk * ((level + atk) / 256))
  );
};

const areConditionsMet = (condition, isfighter, state) => {
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
        ? state.fighter1Energy.filter((e) => {
            return e === "energy";
          }).length > condition.value
        : state.fighter2Energy.filter((e) => {
            return e === "energy";
          }).length > condition.value;

    case "opponentEnergy":
      return !isfighter
        ? state.fighter1Energy.length >= condition.value
        : state.fighter2Energy.length >= condition.value;

    case "energyCost":
      return isfighter
        ? state.fighter1Energy.filter((e) => {
            return e === "energy";
          }).length >= condition.value
        : state.fighter2Energy.filter((e) => {
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
      console.log(
        "CAN MOVE",
        canFighterMove(
          currentFighterPosition,
          otherFighterPosition,
          condition.value
        )
      );
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

const applyCardEffects = (effect, isfighter, state, seed, currentFighter) => {
  let newState = { ...state };
  console.log("EFFECT", effect);
  switch (effect.type) {
    case "damage":
      const damage = calculateDamage(effect.value, currentFighter, seed);

      if (isfighter) {
        newState.fighter2Health = Math.max(0, state.fighter2Health - damage);
      } else {
        newState.fighter1Health = Math.max(0, state.fighter1Health - damage);
      }
      break;
    case "gain_energy":
      {
        const tempEnergy = isfighter
          ? [...state.fighter1Energy]
          : [...state.fighter2Energy];
        const maxEnergy = 5;

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
    case "energy_cost":
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
    case "health_cost":
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

const canFighterMove = (fighter1Position, fighter2Position, distance) => {
  const isOnLeftSide = fighter1Position < fighter2Position;
  const newPosition = isOnLeftSide
    ? fighter1Position + distance * 3
    : fighter1Position - distance * 3;
  const respectAreaLimit = newPosition >= -9 && newPosition <= 9;

  if (!respectAreaLimit) return false;
  console.log(
    "CAN MOVE",
    isOnLeftSide
      ? newPosition < fighter2Position
      : newPosition > fighter2Position
  );
  return isOnLeftSide
    ? newPosition < fighter2Position
    : newPosition > fighter2Position;
};

const isAtWeaponReach = (
  currentFighterRange,
  currentFighterPosition,
  otherFighterPosition
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

module.exports = {
  executeCombat,
};
