const db = require("../db");
const { toCamelCase } = require("../utils/toCamelCase");

async function createInitialCollection(newUser, transactionClient) {
  const initialCardIds = [19, 20, 24];

  try {
    for (const cardId of initialCardIds) {
      await transactionClient.query(
        `
        INSERT INTO card_collections (user_id, card_id)
        VALUES ($1, $2);
        `,
        [newUser.id, cardId]
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

const getAllCards = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM cards;
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const getDeckForFighter = async (fighterId) => {
  try {
    const result = await db.query(
      `
      SELECT d.slot, c.*
      FROM decks d
      JOIN cards c ON d.card_id = c.id
      WHERE d.fighter_id = $1;
      `,
      [fighterId]
    );

    const formattedResult = result.rows.map((row) => ({
      ...row,
      fighter_id: undefined,
      card_id: undefined,
      quantity: 0,
      context: "deck",
    }));

    return toCamelCase(formattedResult);
  } catch (error) {
    console.error("Erreur lors de la récupération du deck :", error);
    throw new Error("Error fetching deck for fighter");
  }
};

const getOwnedCards = async (req, res) => {
  const { id } = req.user;

  try {
    const result = await db.query(
      `
      SELECT cc.quantity, c.*
      FROM card_collections cc
      JOIN cards c ON cc.card_id = c.id
      WHERE cc.user_id = $1;
      `,
      [id]
    );
    const formattedResult = result.rows.map((row) => ({
      ...row,
      fighter_id: undefined,
      card_id: undefined,
      slot: -1,
      context: "collection",
    }));
    const cards = toCamelCase(formattedResult);
    res.status(200).json(cards);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des cartes possédées :",
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
    const result = await db.query(
      `
      SELECT d.slot, c.*
      FROM decks d
      JOIN cards c ON d.card_id = c.id
      WHERE d.fighter_id = $1;
      `,
      [fighter_id]
    );
    const formattedResult = result.rows.map((row) => ({
      ...row,
      fighter_id: undefined,
      card_id: undefined,
      quantity: 0,
    }));
    const equippedCards = toCamelCase(formattedResult);

    res.status(200).json(equippedCards);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des cartes équipées :",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const postEquippedCard = async (req, res) => {
  const { collection, equippedCards, fighter_id, user_id } = req.body;

  if (!Array.isArray(equippedCards) || !Array.isArray(collection)) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM card_collections WHERE user_id = $1;`, [
      user_id,
    ]);

    const collectionInsertPromises = collection.map((card) => {
      return client.query(
        `
        INSERT INTO card_collections (user_id, card_id, quantity)
        VALUES ($1, $2, $3);
        `,
        [user_id, card.id, 1]
      );
    });
    await Promise.all(collectionInsertPromises);

    await client.query(`DELETE FROM decks WHERE fighter_id = $1;`, [
      fighter_id,
    ]);

    const deckInsertPromises = equippedCards.map((card, index) => {
      return client.query(
        `
        INSERT INTO decks (fighter_id, slot, card_id)
        VALUES ($1, $2, $3);
        `,
        [fighter_id, index, card.id]
      );
    });
    await Promise.all(deckInsertPromises);

    await client.query("COMMIT");

    res
      .status(200)
      .json({ message: "Collection and deck updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erreur durant la mise à jour :", error);
    res.status(500).json({ error: "An error occurred while updating data" });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllCards,
  getOwnedCards,
  getEquippedCard,
  postEquippedCard,
  createInitialCollection,
  getDeckForFighter,
};
