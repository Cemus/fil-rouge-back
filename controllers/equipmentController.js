const db = require("../db");
const { toCamelCase } = require("../utils/toCamelCase");

const getFighterEquipment = async (fighterId) => {
  try {
    const result = await db.query(
      `SELECT 
      i.id , i.name AS item_name, i.description, i.slot, i.type, i.hp, i.atk, i.spd, i.mag, i.range
    FROM equipments e
    LEFT JOIN items i ON e.item_id = i.id
    WHERE e.fighter_id = $1;
  `,
      [fighterId]
    );
    console.log(result.rows);
    return toCamelCase(result.rows);
  } catch (error) {
    console.error("Error fetching fighter equipment:", error);
    throw error;
  }
};

const getUserEquipments = async (userId) => {
  const query = `
    SELECT 
      c.id, c.user_id,, 
      i.id AS item_id, i.name AS item_name, i.description, i.slot, i.type, i.hp, i.atk, i.spd, i.mag, i.range
    FROM item_collections c
    LEFT JOIN items i ON c.item_id = i.id
    WHERE c.user_id = $1
  `;

  try {
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching user equipments:", error);
    throw error;
  }
};

const getEquippedItems = async (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT 
      c.id, c.user_id, c.equipped, 
      i.id AS item_id, i.name AS item_name, i.description, i.slot, i.type, i.hp, i.atk, i.spd, i.mag, i.range
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

const equipmentUpdate = async (req, res) => {
  const { fighterId, equipmentSlots } = req.body;

  try {
    const fighterQuery = `SELECT * FROM fighters WHERE id = $1`;
    const fighterResult = await db.query(fighterQuery, [fighterId]);

    if (fighterResult.rowCount === 0) {
      return res.status(404).json({ error: "Combattant non trouvé" });
    }

    for (const slot in equipmentSlots) {
      const item = equipmentSlots[slot];

      if (item.equipped === fighterId) {
        await db.query(
          `
          UPDATE item_collections
          SET equipped = $1
          WHERE id = $2
          `,
          [fighterId, item.id]
        );
      } else {
        await db.query(
          `
          UPDATE item_collections
          SET equipped = NULL
          WHERE id = $1
          `,
          [item.id]
        );
      }
    }

    res.status(200).json({ message: "Équipement mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'équipement:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

module.exports = {
  getUserEquipments,
  getEquippedItems,
  equipmentUpdate,
  getFighterEquipment,
};
