const Joi = require("joi");

const scrapeSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    "string.uri":
      "Geçerli bir URL adresi girmelisiniz (örnek: https://google.com)",
    "any.required": "URL alanı zorunludur",
  }),
  scrapeType: Joi.string().valid("general", "custom").default("general"),
  selectors: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        selector: Joi.string().required(),
        attr: Joi.string().allow("", null).optional(),
      }),
    )
    .when("scrapeType", {
      is: "custom",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  method: Joi.string().valid("static", "dynamic").default("dynamic").messages({
    "any.only": 'Yöntem sadece "static" veya "dynamic" olabilir',
  }),
});

const validateScrapeRequest = (data) => {
  return scrapeSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateScrapeRequest,
};
