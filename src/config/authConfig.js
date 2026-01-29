const crypto = require("crypto");

// Rastgele güvenli anahtarlar oluşturma (Development için)
// Production'da bunlar .env dosyasından gelmeli
const generateSecrets = () => {
  return {
    ACCESS_TOKEN_SECRET: crypto.randomBytes(64).toString("hex"),
    REFRESH_TOKEN_SECRET: crypto.randomBytes(64).toString("hex"),
  };
};

module.exports = {
  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET || "dev_access_secret_123",
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret_123",
};
