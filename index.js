const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 8080;

const app = express();

//config JSON response
app.use(express.json());

// Solve CORS
app.use(
  cors({ credentials: true, origin: "https://a8ed-2804-29b8-517a-49d-1c6d-bf10-791f-8e.sa.ngrok.io/" })
);

// Public folder for images
app.use(express.static("public"));

//Routes
const UserRoutes = require("./routes/UserRoutes");
const PetRoutes = require("./routes/PetRoutes");
app.use("/users", UserRoutes);
app.use("/pets", PetRoutes);
app.get("/", (req, res) => {
  res.send("A API está funcionando.");
});

app.listen(port, () => {
  console.log(`porta ${port}`);
});
