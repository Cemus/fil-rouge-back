const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");
const Fighter = require("../fighter/Fighter");
const Card = require("./Card");

class Deck extends Model {}

Deck.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fighter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Fighter,
        key: "id",
      },
    },
    card_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Card,
        key: "id",
      },
    },
    slot: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "decks",
    timestamps: false,
  }
);

module.exports = Deck;
