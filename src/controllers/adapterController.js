const { listAdapters } = require("../adapters");

exports.listAdapters = (req, res) => {
  res.json({
    success: true,
    adapters: listAdapters(),
  });
};
