const { Sequelize } = require("sequelize");

const databaseURL = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseURL, {
  use_env_variable: databaseURL,
  dialect: "postgres",
  define: {
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
