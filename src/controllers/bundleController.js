const { buildProjectBundle } = require("../services/bundleService");

exports.getProjectBundle = async (req, res) => {
  try {
    const bundle = await buildProjectBundle(req.params.projectId, req.user);
    res.json({
      success: true,
      bundle,
    });
  } catch (error) {
    if (error.code === "PROJECT_NOT_FOUND") {
      return res.status(404).json({ success: false, error: error.message });
    }

    if (error.code === "PROJECT_FORBIDDEN") {
      return res.status(403).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};
