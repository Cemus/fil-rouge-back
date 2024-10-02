const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");
const User = require("../User");
const Card = require("../cards/Card");

class CardCollection extends Model {}

CardCollection.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: "id",
      },
    },
    card_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Card,
        key: "id",
      },
    },
    equipped: {
      type: DataTypes.SMALLINT,
    },
  },
  {
    sequelize,
    modelName: "card_collections",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "card_id"],
      },
    ],
  }
);

module.exports = CardCollection;
