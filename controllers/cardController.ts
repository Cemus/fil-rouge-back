import { db } from "../db";
import { Request, Response } from "express";
import { PoolClient } from "pg";
import { ExtendedRequest, User } from "../types/types";
import { toCamelCase } from "../utils/toCamelCase";

interface Card {
  id: number;
  slot?: number;
  quantity?: number;
  context?: "deck" | "collection";
  [key: string]: any;
}

export async function createInitialCollection(
  newUser: User,
  transactionClient: PoolClient
): Promise<void> {
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

export const getAllCards = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await db.query(`SELECT * FROM cards;`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const getDeckForFighter = async (fighterId: number): Promise<Card[]> => {
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

    const formattedResult = result.rows.map((row: any) => ({
      ...row,
      fighter_id: undefined,
      card_id: undefined,
      quantity: 0,
      context: "deck",
    }));

    return toCamelCase(formattedResult) as Card[];
  } catch (error) {
    console.error("Erreur lors de la récupération du deck :", error);
    throw new Error("Error fetching deck for fighter");
  }
};

export const getCardCollection = async (
  userId: number
): Promise<void | Card[]> => {
  try {
    const result = await db.query(
      `
      SELECT cc.quantity, c.*
      FROM card_collections cc
      JOIN cards c ON cc.card_id = c.id
      WHERE cc.user_id = $1;
      `,
      [userId]
    );

    const formattedResult = result.rows.map((row: any) => ({
      ...row,
      fighter_id: undefined,
      card_id: undefined,
      slot: -1,
      context: "collection",
    }));

    return toCamelCase(formattedResult) as Card[];
  } catch (error) {
    console.error("Erreur lors de la récupération de la collection :", error);
  }
};

export const getOwnedCards = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  const { id } = req.user!;

  try {
    const collection = await getCardCollection(id);
    res.status(200).json(collection);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des cartes possédées :",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const getEquippedCard = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fighter_id } = req.params;

  if (!fighter_id) {
    res.status(400).json({ error: "Fighter ID is required" });
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

    const formattedResult = result.rows.map((row: any) => ({
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

export const postEquippedCard = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { collection, equippedCards, fighter_id, user_id } = req.body;

  if (!Array.isArray(equippedCards) || !Array.isArray(collection)) {
    res.status(400).json({ error: "Invalid input data" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM card_collections WHERE user_id = $1;`, [
      user_id,
    ]);

    const collectionInsertPromises = collection.map((card: Card) => {
      return client.query(
        `
        INSERT INTO card_collections (user_id, card_id, quantity)
        VALUES ($1, $2, $3);
        `,
        [user_id, card.id, card.quantity]
      );
    });
    await Promise.all(collectionInsertPromises);

    await client.query(`DELETE FROM decks WHERE fighter_id = $1;`, [
      fighter_id,
    ]);

    const deckInsertPromises = equippedCards.map((card: Card) => {
      return client.query(
        `
        INSERT INTO decks (fighter_id, slot, card_id)
        VALUES ($1, $2, $3);
        `,
        [fighter_id, card.slot, card.id]
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
