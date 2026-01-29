const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");

/**
 * Ensures the data directory exists.
 */
const ensureDataDir = async () => {
  if (!fs.existsSync(DATA_DIR)) {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
  }
};

/**
 * Saves JSON data to a file.
 * @param {Object} data - The data directly to save.
 * @param {string} filename - The filename.
 * @returns {Promise<string>} - The full path of the saved file.
 */
exports.saveData = async (data, filename) => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
};

/**
 * Lists all JSON files in the data directory with details.
 * @returns {Promise<Array>} - List of file objects.
 */
exports.listFiles = async () => {
  await ensureDataDir();
  const files = await fs.promises.readdir(DATA_DIR);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  const fileDetails = await Promise.all(
    jsonFiles.map(async (filename) => {
      const stat = await fs.promises.stat(path.join(DATA_DIR, filename));
      return {
        name: filename,
        size: stat.size,
        createdAt: stat.birthtime,
      };
    }),
  );

  // Sort by newest first
  return fileDetails.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Reads a JSON file.
 * @param {string} filename
 * @returns {Promise<Object>}
 */
exports.getFile = async (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found");
  }
  const data = await fs.promises.readFile(filePath, "utf-8");
  return JSON.parse(data);
};

/**
 * Deletes a file.
 * @param {string} filename
 */
exports.deleteFile = async (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  } else {
    throw new Error("File not found");
  }
};

/**
 * Validates a filename to prevent directory traversal.
 * @param {string} filename
 * @returns {boolean}
 */
exports.isValidFilename = (filename) => {
  return /^[a-z0-9-.]+\.json$/i.test(filename);
};
