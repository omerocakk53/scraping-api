const jwt = require("jsonwebtoken");
const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} = require("../config/authConfig");

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
