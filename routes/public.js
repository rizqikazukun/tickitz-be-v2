const version = "/v1";

module.exports = [
  {
    path: `${version}/auth/login`,
    controllers: require("../controllers/Auth").login,
    validator: require("../controllers/Auth/validator").loginValidator,
    method: "post",
  },
  {
    path: `${version}/auth/register`,
    controllers: require("../controllers/Auth").register,
    validator: require("../controllers/Auth/validator").registerValidator,
    method: "post",
  },
  {
    path: `${version}/auth/forgot-password`,
    controllers: require("../controllers/Auth").forgotPassword,
    validator: require("../controllers/Auth/validator").forgotPassword,
    method: "post",
  },
  {
    path: `${version}/auth/cta`,
    controllers: require("../controllers/Auth").cta,
    validator: require("../controllers/Auth/validator").cta,
    method: "post",
  },
  {
    path: `${version}/auth/forgot/verify`,
    controllers: require("../controllers/Auth").forgotVerify,
    method: "get",
  },

  // movies
  {
    path: `${version}/movie/now-showing`,
    controllers: require("../controllers/Movie").getNowShowing,
    method: "get",
  },
  {
    path: `${version}/movie/upcoming`,
    controllers: require("../controllers/Movie").getUpcoming,
    method: "get",
  },
  {
    path: `${version}/movie/upcoming/:month`,
    controllers: require("../controllers/Movie").getUpcomingMonth,
    method: "get",
  },
  {
    path: `${version}/movie/detail/:slug`,
    controllers: require("../controllers/Movie").getSelectedMovie,
    method: "get",
  },
  {
    path: `${version}/movie/:slug/cinemas`,
    controllers: require("../controllers/Movie").getCinemaMovie,
    method: "get",
  },
];
