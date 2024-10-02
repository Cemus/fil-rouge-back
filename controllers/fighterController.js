const Fighter = require("../models/fighter/Fighter");
const Stats = require("../models/fighter/Stats");
const Visuals = require("../models/fighter/Visuals");
const { Op } = require("sequelize");
const { getDeckIncludeOptions } = require("./cardController");
const Equipment = require("../models/equipment/Equipment");
const Item = require("../models/equipment/Item");
const sequelize = require("../db");

const getFighterIncludeOptions = () => {
  return [
    {
      model: Visuals,
      attributes: [
        "skin_color",
        "hair_type",
        "hair_color",
        "eyes_type",
        "eyes_color",
        "mouth_type",
      ],
      limit: 1,
    },
    {
      model: Stats,
      attributes: [
        "hp",
        "atk",
        "vit",
        "mag",
        "level",
        "experience",
        "xp_max",
        "attribute_points",
      ],
      limit: 1,
    },
    getDeckIncludeOptions(),
  ];
};

const seekFighters = async (req, res) => {
  const { fighter_id } = req.body;

  try {
    const allFighters = await Fighter.findAll({
      where: {
        id: { [Op.ne]: fighter_id },
      },
      attributes: ["id", "name"],

      include: [
        {
          model: Visuals,
          attributes: [
            "skin_color",
            "hair_type",
            "hair_color",
            "eyes_type",
            "eyes_color",
            "mouth_type",
          ],
          limit: 1,
        },
        {
          model: Stats,
          attributes: [
            "hp",
            "atk",
            "vit",
            "mag",
            "level",
            "experience",
            "xp_max",
            "attribute_points",
          ],
          limit: 1,
        },
        {
          model: Equipment,
          attributes: ["id", "item_id", "equipped"],
          include: [
            {
              model: Item,
              attributes: [
                "name",
                "description",
                "slot",
                "type",
                "hp",
                "atk",
                "vit",
                "mag",
                "range",
              ],
            },
          ],
        },
        getDeckIncludeOptions(),
      ],
    });
    const shuffledFighters = allFighters.sort(() => 0.5 - Math.random());
    const selectedFighters = shuffledFighters.slice(0, 6);
    res.status(200).json(selectedFighters);
  } catch (error) {
    console.error("Error fetching fighters:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching fighters" });
  }
};

const createFighter = async (req, res) => {
  const {
    fighterName,
    skinColor,
    hairType,
    hairColor,
    eyesType,
    eyesColor,
    mouthType,
  } = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      const newFighter = await Fighter.create(
        {
          name: fighterName,
          user_id: req.user.id,
        },
        { transaction: t }
      );

      await Visuals.create(
        {
          fighter_id: newFighter.id,
          skin_color: skinColor,
          hair_type: hairType,
          hair_color: hairColor,
          eyes_type: eyesType,
          eyes_color: eyesColor,
          mouth_type: mouthType,
        },
        { transaction: t }
      );

      await Stats.create(
        {
          fighter_id: newFighter.id,
        },
        { transaction: t }
      );

      return newFighter;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Failed to create fighter:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the fighter" });
  }
};

module.exports = {
  getFighterIncludeOptions,
  createFighter,
  seekFighters,
};
