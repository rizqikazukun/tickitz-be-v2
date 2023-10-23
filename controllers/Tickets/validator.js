module.exports = {
  seatSelectedValidator: {
    cinemaId: "required|integer",
    movieSlug: "required|string",
    seat: "required|arrayUnique",
    startMovie: "required",
  },
  ticketPurchaseValidator: {
    paymentMethod: "required|string",
  },
};
