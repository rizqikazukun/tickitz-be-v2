const fs = require("fs");
const mustache = require("mustache");
const transporter = require("../../utils/nodemailer");

module.exports = {
  seatSelected: async (req, res) => {
    try {
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
      const {} = req.body;

      const template = fs.readFileSync("./views/template/ticket.html", {
        encoding: "utf-8",
      });
      const mailOptions = {
        from: "peworld08@gmail.com",
        to: "bilkisismail07@gmail.com",
        subject: "Proof of Payment",
        html: mustache.render(template, {
          subject: "Proof of Payment",
        }),
      };
      await transporter.sendMail(mailOptions);

      res.json({
        status: "OK",
        messages: "Purchase success",
        data: null,
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
