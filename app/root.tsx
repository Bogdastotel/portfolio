import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./app.css";

import { Footer } from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { NotFound } from "~/components/NotFound";

// Runs before first paint so a saved light preference never flashes dark.
const themeScript = `try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return null;
}

export function ErrorBoundary() {
  return <NotFound title="Something went wrong" text="That page failed to load. Try again from the homepage." />;
}
