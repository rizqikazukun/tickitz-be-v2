'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("seats", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      slug: {
        type: Sequelize.STRING,
      },
      version: {
        type: Sequelize.STRING,
      },
      cinemaId: {
        type: Sequelize.INTEGER,
      },
      available: {
        type: Sequelize.TEXT,
        defaultValue: `["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12","A13","A14","B1","B2","B3","B4","B5","B6","B7","B8","B9","B10","B11","B12","B13","B14","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","C11","C12","C13","C14","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12","D13","D14","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","G11","G12","G13","G14"]`,
      },
      booked: {
        type: Sequelize.TEXT,
      },
      date: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('seats');
  }
};