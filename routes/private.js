module.exports = [
  {
    path: `/:version/auth/profile`,
    controllers: require("../controllers/Auth").getProfile,
    method: "get",
    cache: false,
  },
  {
    path: `/:version/ticket/seat`,
    controllers: require("../controllers/Tickets").seatSelected,
    validator: require("../controllers/Tickets/validator")
      .seatSelectedValidator,
    method: "post",
    cache: false,
  },
  {
    path: `/:version/ticket/purchase/:id`,
    controllers: require("../controllers/Tickets").ticketPurchase,
    method: "patch",
    cache: false,
  },
];
