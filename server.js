const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = "6a5d175c83bed5f2f8b21798a499fd13"; //

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

async function startServer() {
  const dbPath = path.join(__dirname, "data/db.json");
  await fs.ensureDir(path.dirname(dbPath));

  const adapter = new JSONFile(dbPath);
  const db = new Low(adapter, { searches: [], weather: {} });

  await db.read();
  db.data ||= { searches: [], weather: {} };

  app.get("/api/weather/:city", async (req, res) => {
    try {
      const city = req.params.city;

      let url, forecastUrl;

      if (city.includes(",")) {
        const [lat, lon] = city.split(",");
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
      }
      const weatherRes = await fetch(url);
      const weather = await weatherRes.json();

      console.log("API WEATHER:", weather); // 👈 IMPORTANT

      const forecastRes = await fetch(forecastUrl);
      const forecast = await forecastRes.json();

      res.json({
        weather,
        forecast: forecast.list ? forecast.list.slice(0, 8) : [],
      });
    } catch (e) {
      console.log("ERROR:", e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/searches", (req, res) => {
    res.json(db.data.searches.slice(0, 10));
  });

  app.listen(PORT, () => {
    console.log(`TORU Weather running at http://localhost:${PORT}`);
  });
}

startServer();
