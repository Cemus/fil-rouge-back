const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader.replace("Bearer ", "");

  if (!authHeader) {
    return res.status(401).json({ error: "Accès refusé, token manquant" });
  }

  if (!token) {
    return res.status(401).json({ error: "Accès refusé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide" });
  }
};

module.exports = authMiddleware;
