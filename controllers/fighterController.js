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
    const allFightersResult = await db.query(
      `
      SELECT 
        f.id, 
        f.name,
        v.skin_color, v.hair_type, v.hair_color, v.eyes_type, v.eyes_color, v.mouth_type,
        s.hp, s.atk, s.spd, s.mag, s.level, s.experience, s.xp_max, s.attribute_points,
        e.id AS equipment_id, e.item_id, e.equipped,
        i.name AS item_name, i.description AS item_description, i.slot, i.type, i.hp AS item_hp, 
        i.atk AS item_atk, i.spd AS item_spd, i.mag AS item_mag, i.range AS item_range
      FROM fighters f
      LEFT JOIN visuals v ON v.fighter_id = f.id
      LEFT JOIN stats s ON s.fighter_id = f.id
      LEFT JOIN equipments e ON e.equipped = f.id
      LEFT JOIN items i ON i.id = e.item_id
      WHERE f.id != $1
    `,
      [fighter_id]
    );

    const shuffledFighters = allFightersResult.rows.sort(
      () => 0.5 - Math.random()
    );
    const selectedFighters = shuffledFighters.slice(0, 6);

    res.status(200).json(selectedFighters);
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
