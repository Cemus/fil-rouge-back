const { DataTypes, json } = require("sequelize");
const sequelize = require("../db");

const Combat = sequelize.define("Combat", {
  fighter1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fighter2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fighter1_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fighter2_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  winner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  loser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seed: { type: DataTypes.STRING, allowNull: false },
  combat_log: { type: DataTypes.JSONB, allowNull: false },
});

module.exports = Combat;
