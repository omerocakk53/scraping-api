const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const usersFile = path.join(__dirname, "../../data/users.json");
const dataDir = path.join(__dirname, "../../data");

// Veri klasörünü kontrol et
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Kullanıcı dosyasını yükle veya oluştur
const loadUsers = () => {
  if (!fs.existsSync(usersFile)) {
    // Varsayılan admin kullanıcısı oluştur
    const defaultPassword = "admin";
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    const users = [{ id: 1, username: "admin", password: hashedPassword }];
    saveUsers(users);
    return users;
  }
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
};

exports.findOne = (username) => {
  const users = loadUsers();
  return users.find((u) => u.username === username);
};

exports.findById = (id) => {
  const users = loadUsers();
  return users.find((u) => u.id === id);
};

exports.create = (username, password) => {
  const users = loadUsers();
  if (users.find((u) => u.username === username)) {
    throw new Error("Kullanıcı zaten mevcut");
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id: Date.now(), username, password: hashedPassword };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};
