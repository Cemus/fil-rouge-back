const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");
const Fighter = require("./Fighter");

class Visuals extends Model {}

Visuals.init(
  {
    fighter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Fighter,
        key: "id",
      },
    },
    skin_color: { type: DataTypes.STRING },
    hair_type: { type: DataTypes.STRING },
    hair_color: { type: DataTypes.STRING },
    eyes_type: { type: DataTypes.STRING },
    eyes_color: { type: DataTypes.STRING },
    mouth_type: { type: DataTypes.STRING },
  },
  {
    sequelize,
    modelName: "visuals",
    timestamps: false,
  }
);

module.exports = Visuals;
