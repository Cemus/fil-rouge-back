const db = require("../db");
const { toCamelCase } = require("../utils/toCamelCase");

const getStatsForFighter = async (fighterId) => {
  try {
    const result = await db.query(
      `
        SELECT  s.hp, s.atk, s.spd, 
               s.mag, s.level, s.experience, s.xp_max, s.attribute_points
        FROM stats s
        WHERE s.fighter_id = $1;
        `,

      [fighterId]
    );

    // Transformer experience to xp
    return toCamelCase(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération des stats :", error);
    throw new Error("Error fetching stats for fighter");
  }
};

module.exports = { getStatsForFighter };
