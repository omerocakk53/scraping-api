const express = require("express");
const cors = require("cors");
const scannerRoutes = require("./routes/scraperRoutes");
const { port } = require("./config/config");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", scannerRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
