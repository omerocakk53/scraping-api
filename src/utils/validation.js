const Joi = require("joi");
const { listAdapters, getDefaultAdapterKey } = require("../adapters");

const supportedScrapeTypes = listAdapters().map((adapter) => adapter.key);
const defaultScrapeType = getDefaultAdapterKey();

const scrapeSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    "string.uri":
      "Geçerli bir URL adresi girmelisiniz (örnek: https://google.com)",
    "any.required": "URL alanı zorunludur",
  }),
  scrapeType: Joi.string()
    .valid(...supportedScrapeTypes)
    .default(defaultScrapeType)
    .messages({
      "any.only": `Scrape tipi sadece '${supportedScrapeTypes.join("', '")}' olabilir.`,
    }),
  // Allow method but ignore it or validate if passed
  method: Joi.string().optional(),
  limit: Joi.number().integer().min(1).optional().allow(null, ""),
  projectId: Joi.string().guid({ version: ["uuidv4"] }).optional().allow(null, ""),
});

const validateScrapeRequest = (data) => {
  return scrapeSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateScrapeRequest,
};
