export default function requestTimeout(req, res, next) {
  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS) || 120000; // 2 minutes default

  // Node's res.setTimeout will abort the socket after timeoutMs
  res.setTimeout(timeoutMs, () => {
    console.error(`Request timed out after ${timeoutMs}ms: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      try {
        res.status(503).json({ success: false, message: 'Server timeout, please try again' });
      } catch (err) {
        // ignore
      }
    }
  });

  // Also set an abort timer to protect long-running promises (optional)
  const abortTimer = setTimeout(() => {
    if (!res.headersSent) {
      try {
        res.status(503).json({ success: false, message: 'Request aborted due to server timeout' });
      } catch (err) {}
    }
  }, timeoutMs + 5000);

  res.on('finish', () => clearTimeout(abortTimer));
  next();
}
