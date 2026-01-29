const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");

exports.listFiles = async (req, res) => {
  try {
    if (!fs.existsSync(dataDir)) {
      return res.json({ success: true, files: [] });
    }

    const files = await fs.promises.readdir(dataDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    // Dosya detaylarını al (tarih vb. için)
    const fileDetails = await Promise.all(
      jsonFiles.map(async (filename) => {
        const stat = await fs.promises.stat(path.join(dataDir, filename));
        return {
          name: filename,
          size: stat.size,
          createdAt: stat.birthtime,
        };
      }),
    );

    // Tarihe göre sırala (en yeni en üstte)
    fileDetails.sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, files: fileDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFile = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDir, filename);

  // Güvenlik kontrolü (Directory traversal saldırılarını önlemek için)
  if (!filename.match(/^[a-z0-9-.]+\.json$/i)) {
    // Sadece alfanümerik, tire ve nokta.
    return res
      .status(400)
      .json({ success: false, error: "Geçersiz dosya adı" });
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, error: "Dosya bulunamadı" });
    }
    const data = await fs.promises.readFile(filePath, "utf-8");
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDir, filename);

  // Güvenlik kontrolü
  if (!filename.match(/^[a-z0-9-.]+\.json$/i)) {
    return res
      .status(400)
      .json({ success: false, error: "Geçersiz dosya adı" });
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, error: "Dosya bulunamadı" });
    }
    await fs.promises.unlink(filePath);
    res.json({ success: true, message: "Dosya silindi" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
