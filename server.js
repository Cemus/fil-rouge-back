require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes/routes");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json());
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(` ┌(◉ ͜ʖ◉)つ < Serveur lancé : http://localhost:${PORT} )`);
});
