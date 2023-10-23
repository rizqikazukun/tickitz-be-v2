const movie = require("./movie");
const cinemas = require("./cinemas");

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

module.exports = {
  getNowShowing: (req, res) => {
    res.json({
      status: "OK",
      messages: "Get movie success",
      data: movie
        ?.map((item, key) => ({ id: 1 + key, ...item }))
        ?.filter((item) => item.isShowing),
    });
  },
  getUpcoming: (req, res) => {
    res.json({
      status: "OK",
      messages: "Get movie success",
      data: movie
        ?.map((item, key) => ({ id: 1 + key, ...item }))
        ?.filter((item) => !item.isShowing),
    });
  },
  getUpcomingMonth: (req, res) => {
    const { month } = req.params;

    res.json({
      status: "OK",
      messages: "Get movie success",
      data: movie
        ?.map((item, key) => ({ id: 1 + key, ...item }))
        ?.filter((item) => item.isShowing && item?.showingMonth === month),
    });
  },
  getSelectedMovie: (req, res) => {
    const { slug } = req.params;

    res.json({
      status: "OK",
      messages: "Get movie success",
      data: movie
        ?.map((item, key) => ({ id: 1 + key, ...item }))
        ?.filter((item) => item.isShowing && item?.slug === slug),
    });
  },
  getCinemaMovie: async (req, res) => {
    const { slug } = req.params;
    const findMovie = movie?.find((item) => item?.slug === slug);

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
};
