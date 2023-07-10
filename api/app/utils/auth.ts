import jwt from "jsonwebtoken";

// Verify the OAuth token with GitHub API
export async function verifyGitHubToken(token: string) {
    // Use your GitHub API endpoint and headers
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_OAUTH_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
  
    if (!response.ok) {
      throw new Error("Failed to verify GitHub token");
    }
  
    return response.json();
  }
  
  // Generate JWT with user information
  export function generateJwtToken(user: any) {
    const secretKey = `process.env.JWT_SECRET_KEY`;
    const token = jwt.sign(
      { userId: user.id, username: user.githubUsername, email: user.email, permissions: user.permissions, githubAuthToken: user.authToken },
      secretKey,
      { expiresIn: "1h" }
    );
    return token;
  }