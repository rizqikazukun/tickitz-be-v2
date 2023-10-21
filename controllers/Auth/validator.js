module.exports = {
  loginValidator: {
    email: "required|email",
    password: "required",
  },
  registerValidator: {
    email: "required|email|maxLength:250",
    password: "required|maxLength:250|minLength:8",
    fullname: "required|maxLength:250",
    phone_number: "required|phoneNumber",
  },
  forgotPassword: {
    email: "required|email",
  },
  cta: {
    email: "required|email",
  },
};
