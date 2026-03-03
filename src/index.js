const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const { port } = require("./config/config");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://dscraping.online",
      "https://dscraping.online",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Tüm rotalar /api öneki altında toplanır
app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
