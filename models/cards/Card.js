const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");

class Card extends Model {}

Card.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conditions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    effects: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: "card",
  }
);

module.exports = Card;
