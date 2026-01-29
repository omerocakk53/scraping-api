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
    const users = [
      {
        id: 1,
        username: "admin",
        password: hashedPassword,
        role: "superadmin",
      },
    ];
    saveUsers(users);
    return users;
  }
  const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
  // Eski kullanıcılar için rol kontrolü (migration gibi)
  return users.map((u) => ({ ...u, role: u.role || "admin" }));
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
};

exports.findAll = () => {
  return loadUsers().map(({ password, ...user }) => user);
};

exports.findOne = (username) => {
  const users = loadUsers();
  return users.find((u) => u.username === username);
};

exports.findById = (id) => {
  const users = loadUsers();
  return users.find((u) => u.id === id);
};

exports.create = (username, password, role = "admin") => {
  const users = loadUsers();
  if (users.find((u) => u.username === username)) {
    throw new Error("Kullanıcı zaten mevcut");
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: Date.now(),
    username,
    password: hashedPassword,
    role,
  };
  users.push(newUser);
  saveUsers(users);
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

exports.updateRole = (id, newRole) => {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === parseInt(id));
  if (index === -1) throw new Error("Kullanıcı bulunamadı");

  users[index].role = newRole;
  saveUsers(users);
  const { password, ...user } = users[index];
  return user;
};

exports.deleteUser = (id) => {
  const users = loadUsers();
  const newUsers = users.filter((u) => u.id !== parseInt(id));
  saveUsers(newUsers);
  return true;
};

exports.updateUser = (id, { username, password }) => {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === parseInt(id));
  if (index === -1) throw new Error("Kullanıcı bulunamadı");

  // Check if new username is taken by another user
  if (username && username !== users[index].username) {
    if (users.find((u) => u.username === username)) {
      throw new Error("Bu kullanıcı adı zaten kullanılıyor");
    }
    users[index].username = username;
  }

  if (password) {
    users[index].password = bcrypt.hashSync(password, 10);
  }

  saveUsers(users);
  const { password: _, ...user } = users[index];
  return user;
};
