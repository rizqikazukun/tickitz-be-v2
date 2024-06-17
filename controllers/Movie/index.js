const movie = require("./movie");
const cinemas = require("./cinemas");
const model = require("../../models");

const movie_arsyad = require("./movie_arsyad");
const movie_aulia = require("./movie_aulia");
const movie_gusti = require("./movie_gusti");
const movie_rayhan = require("./movie_rayhan");
const movie_rizqi = require("./movie_rizqi");
const movie_yaqin = require("./movie_yaqin");
const movie_yongki = require("./movie_yongki");

function formatNumber(num, precision = 0) {
  const map = [
    { suffix: "T", threshold: 1e12 },
    { suffix: "B", threshold: 1e9 },
    { suffix: "M", threshold: 1e6 },
    { suffix: "K", threshold: 1e3 },
    { suffix: "", threshold: 1 },
  ];

  const found = map.find((x) => Math.abs(num) >= x.threshold);
  if (found) {
    const formatted = (num / found.threshold).toFixed(precision) + found.suffix;
    return formatted;
  }

  return num;
}

function getMovieList(version) {
  let usedMovie;

  switch (version) {
    case "arsyad":
      usedMovie = movie_arsyad;
      break;

    case "aulia":
      usedMovie = movie_aulia;
      break;

    case "gusti":
      usedMovie = movie_gusti;
      break;

    case "rayhan":
      usedMovie = movie_rayhan;
      break;

    case "rizqi":
      usedMovie = movie_rizqi;
      break;

    case "yaqin":
      usedMovie = movie_yaqin;
      break;

    case "yongki":
      usedMovie = movie_yongki;
      break;

    default:
      usedMovie = movie;
      break;
  }

  return usedMovie;
}

module.exports = {
  getNowShowing: (req, res) => {
    res.json({
      status: "OK",
      messages: "Get movie success",
      data: getMovieList(req.params.version)
        ?.map((item, key) => ({ id: 1 + key, ...item }))
        ?.filter((item) => item.isShowing),
    });
  },
  getUpcoming: (req, res) => {
    res.json({
      status: "OK",
      messages: "Get movie success",
      data: getMovieList(req.params.version)
        ?.map((item, key) => ({ id: 1 + key, ...item }))
        ?.filter((item) => !item.isShowing),
    });
  },
  getUpcomingMonth: (req, res) => {
    const { month } = req.params;

    res.json({
      status: "OK",
      messages: "Get movie success",
      data: getMovieList(req.params.version)
        ?.map((item, key) => ({ id: 1 + key, ...item }))
        ?.filter((item) => !item.isShowing && item?.showingMonth === month),
    });
  },
  getSelectedMovie: (req, res) => {
    const { slug } = req.params;
    const filteredMovie = getMovieList(req.params.version)
      ?.map((item, key) => ({ id: 1 + key, ...item }))
      ?.filter((item) => item?.slug === slug);
    const checkIsValid = filteredMovie?.length ? true : false;

    res.status(checkIsValid ? 200 : 404).json({
      status: "OK",
      messages: "Get movie success",
      data: filteredMovie,
    });
  },
  getCinemaMovie: (req, res) => {
    const { slug } = req.params;
    const findMovie = getMovieList(req.params.version)?.find(
      (item) => item?.slug === slug
    );

    if (!findMovie) {
      res.status(404).json({
        status: "False",
        messages: "Movie not found",
        data: null,
      });

      return;
    }

    res.json({
      status: "OK",
      messages: "Get cinemas success",
      data: cinemas?.map((item, key) => ({
        ...item,
        priceDisplay: formatNumber((findMovie.basicPrice * (1 + key)) / 2),
        price: (findMovie.basicPrice * (1 + key)) / 2,
      })),
    });
  },
  findSeatMovie: async (req, res) => {
    try {
      const { version, slug } = req.params;
      const { startMovie, cinemaId } = req.body;

      const findSeat = await model.seat.findAll({
        where: { slug, date: startMovie, cinemaId },
      });

      let theSeat

      if (findSeat.length === 0) {
        theSeat = await model.seat.create({
          slug,
          date: startMovie,
          cinemaId,
          version,
        });

        theSeat = await model.seat.findAll({
          where: { slug, date: startMovie, cinemaId },
        });
      } else {
        theSeat = findSeat
      }

      await res.json({
        status: "OK",
        messages: "Seat choose success",
        data: {
          ...findSeat?.[0]?.dataValues,
          available: JSON.parse(theSeat?.[0]?.dataValues?.available),
          booked: JSON.parse(theSeat?.[0]?.dataValues?.booked),
        },
      });
    } catch (error) {
      res.status(error?.code ?? 500).json({
        status: "ERROR",
        messages: error?.message ?? "Something wrong",
        data: null,
      });
    }
  },
};
