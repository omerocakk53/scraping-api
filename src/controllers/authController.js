const userService = require("../services/userService");
const bcrypt = require("bcryptjs");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = userService.findOne(username);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Kullanıcı adı veya şifre hatalı" });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res
      .status(401)
      .json({ success: false, error: "Kullanıcı adı veya şifre hatalı" });
  }

  // Tokenları oluştur
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Refresh token'ı httpOnly cookie olarak gönder
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Production'da true olmalı
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
  });

  res.json({
    success: true,
    accessToken,
    user: { id: user.id, username: user.username, role: user.role },
  });
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, error: "Refresh token bulunamadı" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = userService.findById(decoded.id);

    if (!user) {
      return res
        .status(403)
        .json({ success: false, error: "Geçersiz kullanıcı" });
    }

    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Geçersiz veya süresi dolmuş refresh token",
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Çıkış yapıldı" });
};

exports.me = (req, res) => {
  // Auth middleware zaten user'ı req içine ekliyor
  res.json({ success: true, user: req.user });
};
