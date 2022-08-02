const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(
    "mongodb+srv://admin:gxZN4WK9S44XDk4T@cadastro.mixqe8i.mongodb.net/?retryWrites=true&w=majority"
  );
  console.log("Conectou pelo mongoose!");
}

main().catch((err) => console.log(err));

module.exports = mongoose;
