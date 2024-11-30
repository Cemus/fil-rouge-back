require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes/routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
