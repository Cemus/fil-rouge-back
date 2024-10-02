const sequelize = require("../db");
const User = require("./User");
const Fighter = require("./fighter/Fighter");
const Stats = require("./fighter/Stats");
const Visuals = require("./fighter/Visuals");
const CardCollection = require("./cards/CardCollection");
const Deck = require("./cards/Deck");
const Card = require("./cards/Card");
const Equipment = require("./equipment/Equipment");
const Item = require("./equipment/Item");

User.belongsToMany(Card, {
  through: CardCollection,
  foreignKey: "user_id",
});
Card.belongsToMany(User, {
  through: CardCollection,
  foreignKey: "card_id",
});

User.hasMany(Fighter, { foreignKey: "user_id" });
Fighter.belongsTo(User, { foreignKey: "user_id" });

Fighter.hasMany(Deck, { foreignKey: "fighter_id" });
Deck.belongsTo(Fighter, { foreignKey: "fighter_id" });

User.hasMany(Equipment, { foreignKey: "user_id" });
Equipment.belongsTo(User, { foreignKey: "user_id" });

Fighter.hasMany(Equipment, { foreignKey: "equipped", sourceKey: "id" });
Equipment.belongsTo(Fighter, { foreignKey: "equipped", targetKey: "id" });

Fighter.hasMany(Stats, { foreignKey: "fighter_id" });
Stats.belongsTo(Fighter, { foreignKey: "fighter_id" });

Fighter.hasMany(Visuals, { foreignKey: "fighter_id" });
Visuals.belongsTo(Fighter, { foreignKey: "fighter_id" });

Card.hasMany(Deck, { foreignKey: "card_id" });
Deck.belongsTo(Card, { foreignKey: "card_id", as: "card" });

Item.hasMany(Equipment, { foreignKey: "item_id" });
Equipment.belongsTo(Item, { foreignKey: "item_id" });

CardCollection.belongsTo(User, { foreignKey: "user_id" });
CardCollection.belongsTo(Card, { foreignKey: "card_id" });

module.exports = {
  sequelize,
  User,
  Card,
  CardCollection,
  Deck,
  Fighter,
  Stats,
  Visuals,
  Item,
};
