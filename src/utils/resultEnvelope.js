const buildResultEnvelope = ({ adapter, request, data, info, job }) => {
  const resultCount =
    data?.comments?.length ??
    data?.reviews?.length ??
    data?.items?.length ??
    data?.results?.length ??
    0;

  return {
    success: true,
    source: {
      key: adapter.key,
      label: adapter.label,
      scrapeType: adapter.key,
    },
    request: {
      url: request.url,
      limit: request.limit,
      projectId: request.projectId || null,
    },
    info: {
      ...info,
      resultCount,
      normalizedAt: new Date().toISOString(),
      jobId: job?.id || null,
      attempts: job?.attempts || 1,
    },
    data,
  };
};

module.exports = {
  buildResultEnvelope,
};
