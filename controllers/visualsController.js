const db = require("../db");
const { toCamelCase } = require("../utils/toCamelCase");

const getVisualsForFighter = async (fighterId) => {
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

module.exports = { getVisualsForFighter };
