const version = "/v1";

module.exports = [
  {
    path: `${version}/auth/profile`,
    controllers: require("../controllers/Auth").getProfile,
    method: "get",
    cache: false,
  },
];
