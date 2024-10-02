const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");

class Item extends Model {}

Item.init(
  {
    name: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    slot: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    hp: { type: DataTypes.INTEGER },
    atk: { type: DataTypes.INTEGER },
    vit: { type: DataTypes.INTEGER },
    mag: { type: DataTypes.INTEGER },
    range: { type: DataTypes.INTEGER },
  },
  {
    sequelize,
    modelName: "items",
    timestamps: false,
  }
);

module.exports = Item;
