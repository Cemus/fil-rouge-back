const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");
const Item = require("./Item");
const User = require("../User");
const Fighter = require("../fighter/Fighter");

class Equipment extends Model {}

Equipment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Item,
        key: "id",
      },
    },
    equipped: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Fighter,
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "equipments",
    timestamps: false,
  }
);

module.exports = Equipment;
