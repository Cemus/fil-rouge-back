import { Request, Response } from "express";
import { db } from "../db";
import { toCamelCase } from "../utils/toCamelCase";
import { User } from "../types/types";
import { PoolClient } from "pg";

export async function createInitialEquipmentCollection(
  newUser: User,
  transactionClient: PoolClient
): Promise<void> {
  const initialEquipmentIds = [1, 4];

  try {
    for (const equipmentId of initialEquipmentIds) {
      await transactionClient.query(
        `
        INSERT INTO item_collections (user_id, item_id,quantity)
        VALUES ($1, $2,1);
        `,
        [newUser.id, equipmentId]
      );
    }
  } catch (error) {
    console.error(
      "Erreur lors de la création de la collection initiale :",
      error
    );
    throw error;
  }
}

export const getFighterEquipment = async (fighterId: number) => {
  try {
    const result = await db.query(
      `SELECT 
      JSON_BUILD_OBJECT(
      'weapon', w,
      'feet', f,
      'body', b,
      'hands', h
    ) AS equipment
    FROM equipments e
    LEFT JOIN items w ON e.weapon = w.id
    LEFT JOIN items f ON e.feet = f.id
    LEFT JOIN items b ON e.body = b.id
    LEFT JOIN items h ON e.hands = h.id
    WHERE e.fighter_id = $1;
      `,
      [fighterId]
    );
    console.log(result.rows);
    if (result.rows.length === 0) {
      return {
        weapon: null,
        feet: null,
        body: null,
        hands: null,
      };
    }
    const equipment = result.rows[0].equipment;
    return toCamelCase(equipment);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'équipement du combattant :",
      error
    );
    throw error;
  }
};

export const getUserEquipments = async (userId: number) => {
  try {
    const query = `SELECT c.id, c.quantity,
    i.id, i.name, i.description, i.slot, i.type, i.hp, i.atk, i.spd, i.mag, i.range
    FROM item_collections c
    LEFT JOIN items i ON c.item_id = i.id
    WHERE c.user_id = $1

  `;

    const result = await db.query(query, [userId]);

    return toCamelCase(result.rows);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'équipement de l'utilisateur :",
      error
    );
    throw error;
  }
};

export const getEquippedItems = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  const query = `
    SELECT 
      c.id, c.user_id, c.equipped, 
      i.id, i.name, i.description, i.slot, i.type, i.hp, i.atk, i.spd, i.mag, i.range
    FROM item_collections c
    LEFT JOIN items i ON c.item_id = i.id
    WHERE c.user_id = $1
  `;

  try {
    const result = await db.query(query, [user_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des équipements possédés:",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const equipmentUpdate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fighterId, equipmentSlots } = req.body;
  console.log(equipmentSlots);

  try {
    const fighterQuery = `SELECT * FROM fighters WHERE id = $1`;
    const fighterResult = await db.query(fighterQuery, [fighterId]);

    if (fighterResult.rowCount === 0) {
      res.status(404).json({ error: "Combattant non trouvé" });
    }

    const setClause: string[] = [];
    const values = [fighterId];

    Object.keys(equipmentSlots).forEach((slot, index) => {
      const item = equipmentSlots[slot];
      if (item) {
        setClause.push(`${slot} = $${index + 2}`);
        values.push(item.id);
      } else {
        setClause.push(`${slot} = $${index + 2}`);
        values.push(null);
      }
    });

    if (setClause.length === 0) {
      console.info("No equipment to update");
      res.status(400).json({ error: "Nothing to update" });
    }

    const query = `
      UPDATE equipments
      SET ${setClause.join(", ")}
      WHERE fighter_id = $1
    `;

    await db.query(query, values);

    res.status(200).json({ message: "Equipment updated!" });
  } catch (error) {
    console.error("Error during the change of equipment:", error);
    res.status(500).json({ error: "Internal error" });
  }
};
