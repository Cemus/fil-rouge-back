const db = require("../db");
const { getFighterEquipment } = require("./equipmentController");
const { getDeckForFighter } = require("./cardController");
const { getVisualsForFighter } = require("./visualsController");
const { getStatsForFighter } = require("./statsController");

const getFighter = async (userId) => {
  try {
    const fightersResult = await db.query(
      `SELECT * FROM fighters WHERE user_id = $1`,
      [userId]
    );

    const fighters = fightersResult.rows;

    const fightersWithDetails = await Promise.all(
      fighters.map(async (fighter) => {
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

const seekFighters = async (req, res) => {
  const { fighter_id } = req.body;

  try {
    const fightersResult = await db.query(
      `SELECT * FROM fighters WHERE id != $1 ORDER BY RANDOM() LIMIT 1;`,
      [fighter_id]
    );

    const fighters = fightersResult.rows;

    const fightersWithDetails = await Promise.all(
      fighters.map(async (fighter) => {
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

const createFighter = async (req, res) => {
  const {
    fighterName,
    skinColor,
    hairType,
    hairColor,
    eyesType,
    eyesColor,
    mouthType,
  } = req.body;

  try {
    await db.query("BEGIN");

    const fighterResult = await db.query(
      `INSERT INTO fighters (name, user_id) VALUES ($1, $2) RETURNING id`,
      [fighterName, req.user.id]
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

    await db.query(`INSERT INTO stats (fighter_id) VALUES ($1)`, [
      newFighterId,
    ]);

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

module.exports = {
  createFighter,
  seekFighters,
  getFighter,
};
