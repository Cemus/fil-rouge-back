import { Request, Response } from "express";
import { db } from "../db";
import crypto from "crypto";
import { executeCombat } from "../battle/battle";

const generateRandomSeed = () => {
  return crypto.randomBytes(16).toString("hex");
};

export const saveCombatResult = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fighter1, fighter2 } = req.body;

  if (!fighter1 || !fighter2) {
    res.status(400).json({ error: "Invalid fighter data" });
  }

  const seed = generateRandomSeed();

  const { fighter1Id, fighter2Id, winner, combatLog } = await executeCombat(
    fighter1,
    fighter2,
    seed
  );

  console.log(combatLog);

  const query = `
    INSERT INTO combats (
      fighter1_id, fighter2_id, fighter1_name, fighter2_name, 
      winner_id, seed, combat_log, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, NOW()
    )
    RETURNING *;
  `;

  const values = [
    fighter1Id,
    fighter2Id,
    fighter1.name,
    fighter2.name,
    winner,
    seed,
    JSON.stringify(combatLog),
  ];

  try {
    const result = await db.query(query, values);
    res.status(201).json({
      message: "Combat result saved successfully",
      combat: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving combat result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserCombatHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fighter_id = req.params.fighter_id;

  const query = `
    SELECT *
    FROM combats
    WHERE fighter1_id = $1 OR fighter2_id = $1
    ORDER BY created_at DESC
    LIMIT 5;
  `;

  try {
    const result = await db.query(query, [fighter_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user combat history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
