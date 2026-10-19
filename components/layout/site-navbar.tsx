/* eslint-disable @next/next/no-html-link-for-pages -- Returning home must reset the URL-driven studio state, including after a crash. */
import { ExternalLink } from "lucide-react";

import { BmwLogo } from "@/components/layout/bmw-logo";

export function SiteNavbar() {
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Individual Studio home">
        <BmwLogo />
        INDIVIDUAL<span className="wordmark-light">STUDIO</span>
      </a>
      <nav className="site-nav" aria-label="Main navigation">
        <a href="/" className="nav-home">
          Home
        </a>
        <a
          href="https://www.bmwusa.com/build-your-own.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          BMW builder <ExternalLink aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
