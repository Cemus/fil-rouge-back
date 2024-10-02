const CardCollection = require("../models/cards/CardCollection");
const Deck = require("../models/cards/Deck");
const Card = require("../models/cards/Card");
const sequelize = require("../db");

const getDeckIncludeOptions = () => {
  return {
    model: Deck,
    include: [{ model: Card, as: "card" }],
    attributes: ["slot", "card_id"],
  };
};

async function createInitialCollection(newUser, transaction) {
  const initialCardIds = [19, 20, 24];

  await Promise.all(
    initialCardIds.map(async (cardId) => {
      await CardCollection.create(
        {
          user_id: newUser.id,
          card_id: cardId,
        },
        { transaction }
      );
    })
  );
}

const getAllCards = async (req, res) => {
  try {
    const cards = await Card.findAll();
    res.status(200).json(cards);
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const getOwnedCards = async (req, res) => {
  const { id } = req.user;
  console.log(id);
  try {
    const ownedCards = await CardCollection.findAll({
      where: { user_id: id },
      include: [{ model: Card }],
    });
    res.status(200).json(ownedCards);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des cartes possédées:",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const getEquippedCard = async (req, res) => {
  const { fighter_id } = req.params;

  if (!fighter_id) {
    return res.status(400).json({ error: "Fighter ID is required" });
  }

  try {
    const equippedCards = await Deck.findAll({
      where: { fighter_id },
      include: [{ model: Card, as: "card" }],
    });

    res.status(200).json(equippedCards);
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes équipées:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const postEquippedCard = async (req, res) => {
  try {
    const { equippedCards, fighter_id, user_id } = req.body;
    const transaction = await sequelize.transaction();

    if (!Array.isArray(equippedCards)) {
      return res.status(400).json({ error: "Invalid equipped cards data" });
    }
    console.log(req.user_id);
    await CardCollection.update(
      { equipped: 0 },
      { where: { user_id: user_id }, transaction }
    );

    await Promise.all(
      equippedCards.map(async (card) => {
        await CardCollection.update(
          { equipped: 1 },
          {
            where: {
              user_id: req.user.id,
              card_id: card.card.id,
            },
            transaction,
          }
        );
      })
    );

    const newEquippedCards = equippedCards.map((card) => ({
      fighter_id: fighter_id,
      slot: card.slot,
      card_id: card.card.id,
    }));
    console.log(newEquippedCards);
    await Deck.destroy({
      where: { fighter_id },
      transaction,
    });

    await Deck.bulkCreate(newEquippedCards, { transaction });

    await transaction.commit();

    res.status(200).json({ message: "Equipped cards saved successfully" });
  } catch (error) {
    console.error("Erreur durant la validation du deck", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving equipped cards" });
  }
};

module.exports = {
  getDeckIncludeOptions,
  getAllCards,
  getOwnedCards,
  getEquippedCard,
  postEquippedCard,
  createInitialCollection,
};
