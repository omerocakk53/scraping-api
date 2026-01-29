const userService = require("../services/userService");

exports.getAllUsers = (req, res) => {
  try {
    const users = userService.findAll();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateUserRole = (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = userService.updateRole(id, role);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    // Kendini silmeyi engelle
    if (parseInt(id) === req.user.id) {
      return res
        .status(400)
        .json({ success: false, error: "Kendinizi silemezsiniz" });
    }

    userService.deleteUser(id);
    res.json({ success: true, message: "Kullanıcı silindi" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    const user = userService.updateUser(id, { username, password });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
