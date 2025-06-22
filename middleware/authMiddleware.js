const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader.replace("Bearer ", "");

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied, token missing" });
  }

  if (!token) {
    return res.status(401).json({ error: "Access denied, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
