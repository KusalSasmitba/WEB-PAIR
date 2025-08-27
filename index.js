// Import dependencies
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
require("events").EventEmitter.defaultMaxListeners = 500;

// Use PORT from Render environment or fallback to 8000
const PORT = process.env.PORT || 8000;

// Import routes
const code = require("./pair");
app.use("/code", code);

// Serve your HTML file at root
app.use("/", async (req, res, next) => {
  res.sendFile(path.join(__dirname, "pair.html"));
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start the server
app.listen(PORT, () => {
  console.log(`⏩ Server running on port ${PORT}`);
});

// Export app (optional, for testing or other modules)
module.exports = app;
