const Joi = require("joi");

const projectSchema = Joi.object({
  name: Joi.string().min(2).max(120).required().messages({
    "string.min": "Proje adı en az 2 karakter olmalı",
    "string.max": "Proje adı en fazla 120 karakter olabilir",
    "any.required": "Proje adı zorunludur",
  }),
  description: Joi.string().max(1000).allow("", null).default(""),
});

const projectUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(120).optional().messages({
    "string.min": "Proje adı en az 2 karakter olmalı",
    "string.max": "Proje adı en fazla 120 karakter olabilir",
  }),
  description: Joi.string().max(1000).allow("", null).optional(),
}).min(1);

const targetSchema = Joi.object({
  scrapeType: Joi.string().required().messages({
    "any.required": "Scrape tipi zorunludur",
  }),
  url: Joi.string().uri().required().messages({
    "string.uri": "Geçerli bir URL adresi girmelisiniz",
    "any.required": "URL alanı zorunludur",
  }),
  limit: Joi.number().integer().min(1).allow(null).optional(),
  label: Joi.string().max(120).allow("", null).default(""),
});

const validateProjectRequest = (data) => projectSchema.validate(data, {
  abortEarly: false,
});

const validateProjectUpdateRequest = (data) => projectUpdateSchema.validate(data, {
  abortEarly: false,
});

const validateTargetRequest = (data) => targetSchema.validate(data, {
  abortEarly: false,
});

module.exports = {
  validateProjectRequest,
  validateProjectUpdateRequest,
  validateTargetRequest,
};
