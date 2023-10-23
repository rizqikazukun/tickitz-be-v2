'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class seat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  seat.init(
    {
      slug: DataTypes.STRING,
      version: DataTypes.STRING,
      available: DataTypes.STRING,
      cinemaId: DataTypes.INTEGER,
      booked: DataTypes.STRING,
      date: DataTypes.STRING,
      version: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "seat",
    }
  );
  return seat;
};