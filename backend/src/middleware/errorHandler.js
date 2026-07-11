export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found" });
}
