const version = "/v1";

module.exports = [
  {
    path: `${version}/auth/profile`,
    controllers: require("../controllers/Auth").getProfile,
    method: "get",
    cache: false,
  },
  {
    path: `${version}/ticket/seat`,
    controllers: require("../controllers/Tickets").seatSelected,
    method: "patch",
    cache: false,
  },
  {
    path: `${version}/ticket/purchase/:id`,
    controllers: require("../controllers/Tickets").ticketPurchase,
    validator: require("../controllers/Tickets/validator").ticketPurchaseValidator,
    method: "patch",
    cache: false,
  },
];
