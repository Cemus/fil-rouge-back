import { toCamelCase } from "../utils/toCamelCase";
import { db } from "../db";

export const getVisualsForFighter = async (fighterId: number) => {
  try {
    const result = await db.query(
      `
        SELECT  v.skin_color, v.hair_type, v.hair_color, 
               v.eyes_type, v.eyes_color, v.mouth_type
        FROM visuals v
        WHERE v.fighter_id = $1;
        `,
      [fighterId]
    );
    return toCamelCase(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération du visuel :", error);
    throw new Error("Error fetching visuals for fighter");
  }
};
