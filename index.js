const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 8080;

const app = express();

//config JSON response
app.use(express.json());

// Solve CORS
app.use(
  cors({ credentials: true, origin: "https://meupetproject.herokuapp.com/" })
);

// Public folder for images
app.use(express.static("public"));

//Routes
const UserRoutes = require("./routes/UserRoutes");
const PetRoutes = require("./routes/PetRoutes");
app.use("/users", UserRoutes);
app.use("/pets", PetRoutes);

app.listen(port, () => {
  console.log(`porta ${port}`);
});
