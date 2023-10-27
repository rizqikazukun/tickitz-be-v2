const fs = require("fs");
const mustache = require("mustache");
const transporter = require("../../utils/nodemailer");
const model = require("../../models");
const jwt = require("jsonwebtoken");
const midtransClient = require("midtrans-client");

const movie = require("../Movie/movie");
const movie_arsyad = require("./movie_arsyad");
const movie_aulia = require("./movie_aulia");
const movie_gusti = require("./movie_gusti");
const movie_rayhan = require("./movie_rayhan");
const movie_rizqi = require("./movie_rizqi");
const movie_yaqin = require("./movie_yaqin");
const movie_yongki = require("./movie_yongki");

let snap = new midtransClient.Snap({
  // Set to true if you want Production Environment (accept real transaction).
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER,
  clientKey: process.env.CLIENT_KEY,
});

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
  seatSelected: async (req, res) => {
    try {
      const { version } = req.params;
      const { seat, startMovie, movieSlug, cinemaId } = req.body;
      const bearer = req.headers.authorization.slice(6).trim();
      const decoded = jwt.verify(bearer, process.env.APP_SECRET_KEY);
      const findMovie = getMovieList(req.params.version)?.find(
        (item) => item?.slug === movieSlug
      );

      // filter movie
      if (!findMovie) throw { code: 400, message: "Movie not found" };

      // seat cannot null
      if (seat.length === 0)
        throw { code: 400, message: "Seat cannot be empty" };

      // find available seat
      const findSeat = await model.seat.findOrCreate({
        where: { slug: movieSlug, date: startMovie, cinemaId },
        defaults: {
          slug: movieSlug,
          date: startMovie,
          cinemaId,
          version,
        },
      });

      // seat cannot duplicate
      seat.forEach((selectedSeat) => {
        if (
          !JSON.parse(findSeat?.[0]?.dataValues?.available ?? "[]").includes(
            selectedSeat
          )
        ) {
          throw { code: 400, message: `Seat ${selectedSeat} not available` };
        }
      });

      const parseSeat = JSON.parse(
        findSeat?.[0]?.dataValues?.available ?? "[]"
      );
      const bookedSeat = [
        ...JSON.parse(findSeat?.[0]?.dataValues?.booked ?? "[]"),
        ...seat,
      ];

      const eliminatedSeat = parseSeat.filter((item) =>
        bookedSeat.find((_item) => item == _item) ? null : item
      );

      await model.seat.update(
        {
          available: JSON.stringify(eliminatedSeat),
          booked: JSON.stringify(bookedSeat),
        },
        {
          where: {
            id: findSeat?.[0]?.dataValues?.id,
          },
        }
      );

      const request = await model.ticket.create({
        user_id: decoded.id,
        movieSlug: movieSlug,
        movieName: movieSlug.split("-").join(" "),
        cinemaId: cinemaId,
        totalTicket: seat.length,
        startMovie: startMovie,
        paymentMethod: null,
        paymentStatus: "pending",
        ticketStatus: "pending",
        totalPrice: (findMovie.basicPrice * cinemaId) / 2,
        seat: JSON.stringify(seat),
        version,
      });

      res.json({
        status: "OK",
        messages: "Seat choose success",
        data: {
          paymentId: request.dataValues.id,
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
  ticketPurchase: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) throw { code: 400, message: "ID parameter cannot null" };
      if (typeof parseInt(id) !== "number")
        throw { code: 400, message: "ID parameter must integer" };

      const bearer = req.headers.authorization.slice(6).trim();
      const decoded = jwt.verify(bearer, process.env.APP_SECRET_KEY);

      const find = await model.ticket.findOne({
        where: { id: id, user_id: decoded.id },
      });

      if (!find) throw { code: 404, message: "Payment not found" };

      let parameter = {
        transaction_details: {
          order_id: `tickitz-${id}-${new Date().getTime()}`,
          gross_amount: find?.dataValues?.totalPrice, // FIX IN FUTURE
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: decoded?.fullname?.split(" ")?.[0] ?? "",
          last_name: decoded?.fullname?.split(" ")?.[1] ?? "",
          email: decoded?.email,
          phone: decoded?.phone_number ?? "",
        },
      };

      const requestPayment = await snap.createTransaction(parameter);

      const request = await model.ticket.update(
        {
          paymentMethod: "virtual account",
          paymentToken: requestPayment?.token,
        },
        {
          where: {
            id,
          },
          returning: true,
        }
      );
      const template = fs.readFileSync("./views/template/payment.html", {
        encoding: "utf-8",
      });
      const mailOptions = {
        from: "peworld08@gmail.com",
        to: decoded?.email,
        subject: "Proof of Payment",
        html: mustache.render(template, {
          subject: "Proof of Payment",
          name: decoded?.fullname ?? "unknown",
          paymentMethod: "virtual account",
          paymentLink: requestPayment?.redirect_url,
          ...request?.[1]?.[0]?.dataValues,
          seat: request?.[1]?.[0]?.dataValues?.seat
            ?.replace("[", "")
            ?.replace("]", ""),
        }),
      };
      await transporter.sendMail(mailOptions);

      res.json({
        status: "OK",
        messages: "Purchase success",
        data: requestPayment,
      });
    } catch (error) {
      res.status(error?.code ?? 500).json({
        status: "ERROR",
        messages: error?.message ?? "Something wrong",
        data: null,
      });
    }
  },
  paymentInfo: async (req, res) => {
    try {
      const { order_id, transaction_status } = req.query;

      const request = await model.ticket.update(
        {
          paymentStatus: transaction_status,
          ticketStatus:
            transaction_status === "settlement" ||
            transaction_status === "capture"
              ? "ready"
              : "pending",
        },
        {
          where: {
            id: order_id.split("-")[1],
          },
          returning: true,
        }
      );

      if (!request) {
        res.render("paymentFailed", { title: "Payment failed" });
      } else {
        if (
          transaction_status === "settlement" ||
          transaction_status === "capture"
        ) {
          if (transaction_status === "settlement") {
            model.ticket.belongsTo(model.users, {
              foreignKey: {
                name: "user_id",
                allowNull: false,
              },
            });

            const find = await model.ticket.findOne({
              where: {
                id: order_id.split("-")[1],
              },
              include: [
                {
                  model: model.users,
                  required: true,
                  attributes: ["fullname", "email"],
                },
              ],
            });

            if (!find?.dataValues?.user) {
              res.render("paymentFailed", { title: "Payment failed" });
            } else {
              const template = fs.readFileSync(
                "./views/template/ticket.html",
                {
                  encoding: "utf-8",
                }
              );
              const mailOptions = {
                from: "peworld08@gmail.com",
                to: find?.dataValues?.user?.dataValues?.email,
                subject: "Digital Ticket",
                html: mustache.render(template, {
                  subject: "Digital Ticket",
                  ...find?.dataValues,
                  url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${process.env.APP_URL}/v1/payment/ticket-scan/${find?.dataValues?.id}`,
                  name: find?.dataValues?.user?.dataValues?.fullname,
                }),
              };
              await transporter.sendMail(mailOptions);
              res.render("paymentSuccess", { title: "Payment success" });
            }
          } else {
            res.render("paymentSuccess", { title: "Payment success" });
          }
        } else if (transaction_status === "pending") {
          res.render("paymentPending", { title: "Payment pending" });
        } else {
          res.render("paymentFailed", { title: "Payment failed" });
        }
      }
    } catch (error) {
      console.log(error);
      res.render("paymentFailed", { title: "Payment failed" });
    }
  },
};
