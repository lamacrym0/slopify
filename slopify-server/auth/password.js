import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = ({ user, password }) => {
  if (!user?.password) return false;
  return bcrypt.compare(password, user.password);
};
