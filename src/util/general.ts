export function generateRandomNumber(numDigits: number = 1) {
  // Create a string of the desired length filled with '9'
  const maxNumber = "9".repeat(numDigits);

  // Convert the string to a number and add 1 to get the maximum value
  const max = parseInt(maxNumber, 10) + 1;

  // Generate a random number between 0 and max
  const randomNumber = Math.floor(Math.random() * max);

  // Pad the number with leading zeros if necessary
  const paddedNumber = randomNumber.toString().padStart(numDigits, "0");

  return paddedNumber;
}
