const Joi = require("joi");

const scrapeSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    "string.uri":
      "Geçerli bir URL adresi girmelisiniz (örnek: https://google.com)",
    "any.required": "URL alanı zorunludur",
  }),
  type: Joi.string().valid("static", "dynamic").default("dynamic").messages({
    "any.only": 'Tip sadece "static" veya "dynamic" olabilir',
  }),
});

const validateScrapeRequest = (data) => {
  return scrapeSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateScrapeRequest,
};
