const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [3, 20],
        msg: "username must contain between 3 and 20 characters",
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8, 255],
        msg: "password must contain at least 8 characters",
      },
    },
  },
});

module.exports = User;
