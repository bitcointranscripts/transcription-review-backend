import axios from "@/api/axios";
import NextAuth, { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GithubProvider from "next-auth/providers/github";
export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: { scope: "read:user user:email repo" },
      },
    }),
    // ...add more providers here
  ],
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: Session;
      token: any;
    }): Promise<Session> {
      // Send userId and permission properties to the client
      session.userId = token.id;
      session.permissions = token.permissions;
      return session;
    },
    async jwt({ token }: { token: JWT }) {
      // TODO: when resource is available send properties to backend and get id
      if (!token?.id) {
        await axios
          .get("/users/4")
          .then((res) => {
            if (res.data) {
              token.id = res.data.id;
              token.permissions = res.data.permissions;
            }
          })
          .catch(() => (token.id = undefined));
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
export default NextAuth(authOptions);
