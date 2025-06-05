import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.DEV_MODE ? false : true,
  sameSite: process.env.DEV_MODE ? "Lax" : "None"
});
