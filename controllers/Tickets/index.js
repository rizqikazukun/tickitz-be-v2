const fs = require("fs");
const mustache = require("mustache");
const transporter = require("../../utils/nodemailer");
const model = require("../../models");
const jwt = require("jsonwebtoken");
const midtransClient = require("midtrans-client");

let snap = new midtransClient.Snap({
  // Set to true if you want Production Environment (accept real transaction).
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER,
  clientKey: process.env.CLIENT_KEY,
});

module.exports = {
  seatSelected: async (req, res) => {
    try {
      const { version } = req.params;
      const { seat, startMovie, movieSlug, cinemaId } = req.body;
      const bearer = req.headers.authorization.slice(6).trim();
      const decoded = jwt.verify(bearer, process.env.APP_SECRET_KEY);

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
        userId: decoded.id,
        movieSlug: movieSlug,
        movieName: movieSlug.split("-").join(" "),
        cinemaId: cinemaId,
        totalTicket: seat.length,
        startMovie: startMovie,
        paymentMethod: null,
        paymentStatus: "pending",
        ticketStatus: "pending",
        totalPrice: 0, // FIX IN FUTURE
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
      const { paymentMethod } = req.body;

      const bearer = req.headers.authorization.slice(6).trim();
      const decoded = jwt.verify(bearer, process.env.APP_SECRET_KEY);

      const find = await model.ticket.findOne({
        where: { id: id, userId: decoded.id },
      });

      if (!find) throw { code: 404, message: "Payment not found" };

      let parameter = {
        transaction_details: {
          order_id: `tickitz-${
            find?.dataValues?.movieSlug
          }-${id}-${new Date().getTime()}`,
          gross_amount: 10000, // FIX IN FUTURE
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
          paymentMethod,
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
          paymentMethod,
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
};
