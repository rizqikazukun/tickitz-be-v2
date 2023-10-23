'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ticket.init(
    {
      user_id: DataTypes.INTEGER,
      movieSlug: DataTypes.STRING,
      movieName: DataTypes.STRING,
      cinemaId: DataTypes.INTEGER,
      seat: DataTypes.STRING,
      totalTicket: DataTypes.INTEGER,
      startMovie: DataTypes.STRING,
      paymentMethod: DataTypes.STRING,
      paymentStatus: DataTypes.STRING,
      paymentToken: DataTypes.STRING,
      ticketStatus: DataTypes.STRING,
      totalPrice: DataTypes.INTEGER,
      version: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ticket",
    }
  );
  return ticket;
};