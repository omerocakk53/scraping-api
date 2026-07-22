const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");

/**
 * Ensures the data directory exists.
 */
const ensureDataDir = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
};

const resolveDataPath = (filename) => {
  const filePath = path.resolve(DATA_DIR, filename);
  if (!filePath.startsWith(path.resolve(DATA_DIR) + path.sep)) {
    throw new Error("Invalid filename");
  }
  return filePath;
};

/**
 * Saves JSON data to a file.
 * @param {Object} data - The data directly to save.
 * @param {string} filename - The filename.
 * @returns {Promise<string>} - The full path of the saved file.
 */
exports.saveData = async (data, filename) => {
  await ensureDataDir();
  const filePath = resolveDataPath(filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
};

/**
 * Lists all JSON files in the data directory with details.
 * @returns {Promise<Array>} - List of file objects.
 */
exports.listFiles = async () => {
  await ensureDataDir();
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  const fileDetails = await Promise.all(
    jsonFiles.map(async (filename) => {
      const stat = await fs.stat(path.join(DATA_DIR, filename));
      return {
        name: filename,
        size: stat.size,
        createdAt: stat.birthtime,
        updatedAt: stat.mtime,
      };
    }),
  );

  return fileDetails.sort((a, b) => b.updatedAt - a.updatedAt);
};

/**
 * Reads a JSON file.
 * @param {string} filename
 * @returns {Promise<Object>}
 */
exports.getFile = async (filename) => {
  const filePath = resolveDataPath(filename);
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error("File not found");
  }
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
};

/**
 * Deletes a file.
 * @param {string} filename
 */
exports.deleteFile = async (filename) => {
  const filePath = resolveDataPath(filename);
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (error) {
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
