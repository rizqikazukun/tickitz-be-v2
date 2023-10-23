module.exports = {
  seatSelectedValidator: {
    seat: "required|integer",
  },
  ticketPurchaseValidator: {
    movieId: "required|integer",
    cinemaId: "required|integer",
    totalTicket: "required|integer",
    startMovie: "required",
    paymentMethod: "required|string",
  },
};
