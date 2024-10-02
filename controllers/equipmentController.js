const Equipment = require("../models/equipment/Equipment");
const Item = require("../models/equipment/Item");
const Fighter = require("../models/fighter/Fighter");

const getUserEquipments = async (userId) => {
  return Equipment.findAll({
    where: { user_id: userId },
    include: [{ model: Item, as: "item" }],
  });
};

const getEquippedItems = async (req, res) => {
  const { user_id } = req.params;

  try {
    const ownedItems = await Equipment.findAll({
      where: { user_id: user_id },
      include: [{ model: Item }],
    });
    res.status(200).json(ownedItems);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des equipements possédées:",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const equipmentUpdate = async (req, res) => {
  const { fighterId, equipmentSlots } = req.body;

  try {
    const fighter = await Fighter.findByPk(fighterId, {
      include: [{ model: Equipment, include: [Item] }],
    });

    if (!fighter) {
      return res.status(404).json({ error: "Combattant non trouvé" });
    }

    for (const slot in equipmentSlots) {
      const item = equipmentSlots[slot];

      if (item.equipped === fighterId) {
        await Equipment.update(
          { equipped: fighterId },
          {
            where: {
              id: item.id,
            },
          }
        );
      } else {
        await Equipment.update(
          { equipped: null },
          {
            where: {
              id: item.id,
            },
          }
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
};
