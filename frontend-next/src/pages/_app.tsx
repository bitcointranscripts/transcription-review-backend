import Layout from "@/layout";
import "@/styles/globals.css";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { SessionProvider } from "next-auth/react";
import theme from "@/chakra/chakra-theme";
import { useEffect } from "react";

const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // reset chakra-ui local storage on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      let currentColorMode = window.localStorage.getItem(
        "chakra-ui-color-mode"
      );
      if (currentColorMode === "dark") {
        window.localStorage.removeItem("chakra-ui-color-mode");
      }
    }
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="light" />
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={session}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </SessionProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
