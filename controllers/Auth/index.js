require("dotenv").config();
const model = require("../../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bcryptSalt = bcrypt.genSaltSync(10);
const fs = require("fs");
const CryptoJS = require("crypto-js");
const mustache = require("mustache");
const transporter = require("../../utils/nodemailer");
const otpGenerator = require("otp-generator");
const { APP_URL } = process.env;

const findUser = async (email) =>
  await model.users.findOne({
    where: { email },
  });

module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const find = await findUser(email);

      if (!find) throw { code: 400, message: "User not exist" };

      const compare = bcrypt.compareSync(password, find?.dataValues?.password);

      if (!compare) throw { code: 422, message: "Wrong password" };

      let { password: pass, otp: otz, ...result } = find?.dataValues ?? {};
      const token = jwt.sign(result, process.env.APP_SECRET_KEY);

      res.json({
        status: "OK",
        messages: "",
        data: {
          token: token,
          result: result,
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

  register: async (req, res) => {
    try {
      const { email, password } = req.body;
      const find = await findUser(email);

      if (find) throw { code: 400, message: "User already registered" };

      const hashPassword = bcrypt.hashSync(password, bcryptSalt);
      const createUser = await model.users.create({
        email,
        password: hashPassword,
      });

      if (!createUser) throw { code: 500, message: "Failed insert data" };

      res.status(201).json({
        status: "OK",
        messages: "insert success",
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

  getProfile: async (req, res) => {
    try {
      const bearer = req.headers.authorization.slice(6).trim();
      const decoded = jwt.verify(bearer, process.env.APP_SECRET_KEY);

      let find = await findUser(decoded.email);

      delete find.dataValues.password;
      delete find.dataValues.otp;
      res.json({
        status: "OK",
        messages: "Get data oke",
        data: find,
      });
    } catch (error) {
      res.status(error?.code ?? 500).json({
        status: "ERROR",
        messages: error?.message ?? "Something wrong",
        data: null,
      });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const find = await findUser(email);

      if (!find) throw { code: 400, message: "User not exist" };

      const template = fs.readFileSync("./views/template/otp.html", {
        encoding: "utf-8",
      });

      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const ciphertext = encodeURIComponent(
        CryptoJS.AES.encrypt(
          JSON.stringify({ email, otp, created_at: new Date().getTime() }),
          "ENCRYPT_TOKEN_SECRET"
        ).toString()
      );

      const mailOptions = {
        from: "peworld08@gmail.com",
        to: email,
        subject: "Request Reset Password",
        html: mustache.render(template, {
          subject: "Request Reset Password",
          body: `${APP_URL}/v1/auth/forgot/verify?code=${ciphertext}`,
          name: find?.dataValues?.fullname,
        }),
      };
      await model.users.update(
        {
          otp: otp,
        },
        {
          where: {
            id: find?.dataValues?.id,
          },
        }
      );
      await transporter.sendMail(mailOptions);

      res.json({
        status: "OK",
        messages: "OTP code sended",
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

  forgotVerify: async (req, res) => {
    try {
      const { code } = req.query;

      const bytes = CryptoJS.AES.decrypt(
        decodeURIComponent(code),
        "ENCRYPT_TOKEN_SECRET"
      );
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      const convertValue = JSON.parse(originalText);
      const currentTime = new Date().getTime();

      // Periksa apakah waktu masih dalam batas 10 menit
      if (currentTime - convertValue.created_at > 600000) {
        await model.users.update(
          {
            otp_forgot: null,
          },
          {
            where: {
              id: findUser?.dataValues?.id,
            },
          }
        );

        res.render("tokenExpired", { title: "Token verify" });
        return;
      }

      const findUser = await model.users.findOne({
        where: {
          email: convertValue?.email,
          otp: convertValue?.otp,
        },
      });

      if (!findUser) {
        res.render("userNotFound", { title: "User not found" });
        return;
      }

      // set default password
      const hashPassword = bcrypt.hashSync("tickitz@12345", bcryptSalt);
      await model.users.update(
        {
          password: hashPassword,
          otp: null,
        },
        {
          where: {
            id: findUser?.dataValues?.id,
          },
        }
      );

      const template = fs.readFileSync("./views/template/response.html", {
        encoding: "utf-8",
      });

      const mailOptions = {
        from: "peworld08@gmail.com",
        to: convertValue?.email,
        subject: "Reset Password Success",
        html: mustache.render(template, {
          subject: "Reset Password Success",
          name: findUser?.dataValues?.fullname,
        }),
      };

      await transporter.sendMail(mailOptions);

      res.render("emailVerify", { title: "Email verify" });
    } catch (error) {
      res.status(error?.code ?? 500).json({
        status: "ERROR",
        messages: error?.message ?? "Something wrong",
        data: null,
      });
    }
  },

  cta: async (req, res) => {
    try {
      const { email } = req.body;

      const template = fs.readFileSync("./views/template/cta.html", {
        encoding: "utf-8",
      });

      const mailOptions = {
        from: "peworld08@gmail.com",
        to: email,
        subject: "Thanks for subscribing",
        html: mustache.render(template, {
          subject: "Thanks for subscribing",
        }),
      };
      await transporter.sendMail(mailOptions);
      res.json({
        status: "OK",
        messages: "CTA Email sended",
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
