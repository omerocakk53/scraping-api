const { verifyAccessToken } = require("../utils/token");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Erişim reddedildi (Token yok)" });
  }

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: "Geçersiz token" });
  }
};

const verifySuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, error: "Yetkisiz erişim (SuperAdmin gerekli)" });
  }
};

module.exports = { authenticateToken, verifySuperAdmin };
