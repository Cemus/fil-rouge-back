const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");
const Fighter = require("./Fighter");

class Stats extends Model {}

Stats.init(
  {
    fighter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Fighter,
        key: "id",
      },
    },
    hp: { type: DataTypes.INTEGER, defaultValue: 100 },
    atk: { type: DataTypes.INTEGER, defaultValue: 5 },
    vit: { type: DataTypes.INTEGER, defaultValue: 5 },
    mag: { type: DataTypes.INTEGER, defaultValue: 5 },
    level: { type: DataTypes.INTEGER, defaultValue: 1 },
    experience: { type: DataTypes.INTEGER, defaultValue: 0 },
    xp_max: { type: DataTypes.INTEGER, defaultValue: 100 },
    attribute_points: { type: DataTypes.INTEGER, defaultValue: 3 },
  },
  {
    sequelize,
    modelName: "stats",
    timestamps: false,
  }
);

module.exports = Stats;
