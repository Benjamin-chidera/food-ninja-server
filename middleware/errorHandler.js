export const errorHandler = (error, req, res, next) => {
  return res.status(400).json({ error: error.message });
};
