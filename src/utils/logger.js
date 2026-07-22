const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({
      error: "Failed to serialize log payload",
    });
  }
};

const writeLog = (level, event, payload = {}) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const line = safeStringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

module.exports = {
  debug: (event, payload) => writeLog("debug", event, payload),
  info: (event, payload) => writeLog("info", event, payload),
  warn: (event, payload) => writeLog("warn", event, payload),
  error: (event, payload) => writeLog("error", event, payload),
};
