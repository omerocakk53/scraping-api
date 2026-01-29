const dataService = require("../services/dataService");

exports.listFiles = async (req, res) => {
  try {
    const files = await dataService.listFiles();
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFile = async (req, res) => {
  const { filename } = req.params;

  // Güvenlik kontrolü
  if (!dataService.isValidFilename(filename)) {
    return res
      .status(400)
      .json({ success: false, error: "Geçersiz dosya adı" });
  }

  try {
    const data = await dataService.getFile(filename);
    res.json({ success: true, data });
  } catch (error) {
    if (error.message === "File not found") {
      return res
        .status(404)
        .json({ success: false, error: "Dosya bulunamadı" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  const { filename } = req.params;

  // Güvenlik kontrolü
  if (!dataService.isValidFilename(filename)) {
    return res
      .status(400)
      .json({ success: false, error: "Geçersiz dosya adı" });
  }

  try {
    await dataService.deleteFile(filename);
    res.json({ success: true, message: "Dosya silindi" });
  } catch (error) {
    if (error.message === "File not found") {
      return res
        .status(404)
        .json({ success: false, error: "Dosya bulunamadı" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};
