import "@/css/tailwind.css";
import "@/css/prism.css";
import "@/css/font.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { GA_TRACKING_ID, pageView } from "@/lib/gtag";
import type { AppContext, AppProps } from "next/app";
import App from "next/app";
import Script from "next/script";
function MyApp({ Component, pageProps }: AppProps & { nonce: string }) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url) => {
      pageView(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);
  const { session, nonce, ...rest } = pageProps;

  return (
    <>
      <ThemeProvider attribute="class" nonce={nonce}>
        <SessionProvider session={session}>
          <Head>
            <meta
              name="viewport"
              content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
            />
          </Head>
          <LayoutWrapper>
            <Component {...rest} />
          </LayoutWrapper>
        </SessionProvider>
      </ThemeProvider>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} nonce={nonce} />
      <Script
        id="gtag"
        dangerouslySetInnerHTML={{
          __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
        }}
        nonce={nonce}
      />
    </>
  );
}
MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  const nonce = appContext.ctx.res.getHeader("CSP-Nonce");
  appContext.ctx.res.removeHeader("CSP-Nonce");

  return { ...appProps, nonce };
};

export default MyApp;
