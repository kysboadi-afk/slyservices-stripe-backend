/**
 * Returns true when the car name refers to a Slingshot booking.
 * Used to decide whether to CC SLINGSHOT_OWNER_EMAIL on notifications.
 *
 * @param {unknown} car - car name from request body or Stripe metadata
 * @returns {boolean}
 */
export function isSlingshotBooking(car) {
  return String(car).toLowerCase().includes("slingshot");
}
