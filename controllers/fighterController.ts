import { Request, Response } from "express";
import { Fighter } from "../types/types";
import { db } from "../db";
import { getFighterEquipment } from "./equipmentController";
import { getDeckForFighter } from "./cardController";
import { getVisualsForFighter } from "./visualsController";
import { getStatsForFighter } from "./statsController";

export interface CustomRequest extends Request {
  user?: { id: number };
}

export const getFighter = async (userId: number) => {
  try {
    const fightersResult = await db.query(
      `SELECT * FROM fighters WHERE user_id = $1`,
      [userId]
    );

    const fighters = fightersResult.rows;

    const fightersWithDetails = await Promise.all(
      fighters.map(async (fighter: Fighter) => {
        const fighterDeck = await getDeckForFighter(fighter.id);
        const fighterEquipment = await getFighterEquipment(fighter.id);
        const fighterVisuals = await getVisualsForFighter(fighter.id);
        const fighterStats = await getStatsForFighter(fighter.id);
        return {
          ...fighter,
          equipment: fighterEquipment,
          deck: fighterDeck,
          visuals: fighterVisuals,
          stats: fighterStats,
        };
      })
    );
    return fightersWithDetails;
  } catch (error) {
    console.error("Erreur durant la récupération du combattant :", error);
  }
};

export const seekFighters = async (req: Request, res: Response) => {
  const { fighter_id } = req.body;

  try {
    const fightersResult = await db.query(
      `SELECT * FROM fighters WHERE id != $1 LIMIT 5;`,
      [fighter_id]
    );

    const fighters = fightersResult.rows;

    const fightersWithDetails = await Promise.all(
      fighters.map(async (fighter: Fighter) => {
        console.log(fighter);
        const fighterDeck = await getDeckForFighter(fighter.id);
        const fighterEquipment = await getFighterEquipment(fighter.id);
        const fighterVisuals = await getVisualsForFighter(fighter.id);
        const fighterStats = await getStatsForFighter(fighter.id);
        return {
          ...fighter,
          equipment: fighterEquipment,
          deck: fighterDeck,
          visuals: fighterVisuals,
          stats: fighterStats,
        };
      })
    );

    res.status(200).json(fightersWithDetails);
  } catch (error) {
    console.error("Erreur de récupération des combattants:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching fighters" });
  }
};

export const createFighter = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  const {
    fighterName,
    skinColor,
    hairType,
    hairColor,
    eyesType,
    eyesColor,
    mouthType,
  } = req.body;

  const { id } = req.user || {};

  try {
    await db.query("BEGIN");

    if (!id) {
      throw new Error("No user id sent.");
    }
    const fighterResult = await db.query(
      `INSERT INTO fighters (name, user_id,created_at, updated_at) VALUES ($1, $2,NOW(),NOW()) RETURNING id`,
      [fighterName, id]
    );
    const newFighterId = fighterResult.rows[0].id;

    await db.query(
      `
      INSERT INTO visuals 
      (fighter_id, skin_color, hair_type, hair_color, eyes_type, eyes_color, mouth_type) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        newFighterId,
        skinColor,
        hairType,
        hairColor,
        eyesType,
        eyesColor,
        mouthType,
      ]
    );

    await db.query(
      `INSERT INTO stats 
    (fighter_id, hp, atk, spd, mag, level, experience, xp_max, attribute_points)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [newFighterId, 25, 5, 5, 5, 1, 0, 100, 0]
    );

    await db.query(
      `INSERT INTO decks 
    (fighter_id, card_id, slot)
   VALUES ($1, $2, $3)`,
      [newFighterId, 31, 1]
    );

    await db.query("COMMIT");

    res.status(201).json({ id: newFighterId, name: fighterName });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Erreur de création du combattant :", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the fighter" });
  }
};
