
  if (!secretKey) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  const token = jwt.sign(
    { userId: user.id, permissions: user.permissions, githubAuthToken },
    secretKey,
    { expiresIn: JWTEXPIRYTIMEINHOURS }
  );
  return token;
}
