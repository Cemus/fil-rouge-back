const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../db");
const User = require("../User");

class Fighter extends Model {}

Fighter.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "fighters",
    timestamps: true,
  }
);

module.exports = Fighter;
