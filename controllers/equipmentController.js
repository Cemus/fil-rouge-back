const db = require("../db");
const { toCamelCase } = require("../utils/toCamelCase");

const getFighterEquipment = async (fighterId) => {
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

    const equipment = result.rows[0].equipment;
    console.log(equipment);
    return toCamelCase(equipment);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'équipement du combattant :",
      error
    );
    throw error;
  }
};

const getUserEquipments = async (userId) => {
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

const getEquippedItems = async (req, res) => {
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

const equipmentUpdate = async (req, res) => {
  const { fighterId, equipmentSlots } = req.body;
  console.log(equipmentSlots);

  try {
    const fighterQuery = `SELECT * FROM fighters WHERE id = $1`;
    const fighterResult = await db.query(fighterQuery, [fighterId]);

    if (fighterResult.rowCount === 0) {
      return res.status(404).json({ error: "Combattant non trouvé" });
    }

    const setClause = [];
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
      console.info("Aucun équipement à mettre à jour");
      return res.status(400).json({ error: "Nothing to update" });
    }

    const query = `
      UPDATE equipments
      SET ${setClause.join(", ")}
      WHERE fighter_id = $1
    `;

    await db.query(query, values);

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
