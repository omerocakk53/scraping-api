const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifySuperAdmin } = require("../middleware/authMiddleware");

// Tüm kullanıcı route'ları authenticateToken'dan sonra çağrılacağı için
// req.user dolu olacak. Ekstra olarak SuperAdmin kontrolü yapıyoruz.

router.get("/users", verifySuperAdmin, userController.getAllUsers);
router.put("/users/:id/role", verifySuperAdmin, userController.updateUserRole);
router.put("/users/:id", verifySuperAdmin, userController.updateUser);
router.delete("/users/:id", verifySuperAdmin, userController.deleteUser);

module.exports = router;
