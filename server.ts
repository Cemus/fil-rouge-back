import express, { Request, Response } from "express";
import cors from "cors";
import { json } from "body-parser";
import router from "./routes/router";
import * as dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
  })
);
app.use(json());
app.use("/api", router);

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(` ┌(◉ ͜ʖ◉)つ < Serveur lancé : http://localhost:${PORT} )`);
});
