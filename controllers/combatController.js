const Combat = require("../models/Combat");
const { executeCombat } = require("../battle/battle");
const sequelize = require("../db");
const { Op } = require("sequelize");
const crypto = require("crypto");

const generateRandomSeed = () => {
  return crypto.randomBytes(16).toString("hex");
};

const saveCombatResult = async (req, res) => {
  const { fighter1, fighter2 } = await req.body;

  if (!fighter1 || !fighter2) {
    return res.status(400).json({ error: "Invalid fighter data" });
  }

  const seed = generateRandomSeed();

  const { fighter1Id, fighter2Id, winner, loser, combatLog } =
    await executeCombat(fighter1, fighter2, seed);
  try {
    const combat = await Combat.create({
      fighter1_id: fighter1Id,
      fighter2_id: fighter2Id,
      fighter1_name: fighter1.name,
      fighter2_name: fighter2.name,
      winner_id: winner,
      loser_id: loser,
      seed: seed,
      combat_log: combatLog,
    });

    res
      .status(201)
      .json({ message: "Combat result saved successfully", combat });
  } catch (error) {
    console.error("Error saving combat result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserCombatHistory = async (req, res) => {
  const fighter_id = req.params.fighter_id;
  try {
    const combats = await Combat.findAll({
      where: {
        [Op.or]: [{ fighter1_id: fighter_id }, { fighter2_id: fighter_id }],
      },
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    res.status(200).json(combats);
  } catch (error) {
    console.error("Error fetching user combat history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  saveCombatResult,
  getUserCombatHistory,
};
