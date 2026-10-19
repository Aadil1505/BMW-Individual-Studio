/* eslint-disable @next/next/no-html-link-for-pages -- Home navigation resets the imported studio state. */
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BmwLogo } from "@/components/layout/bmw-logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-layout">
        <div className="footer-identity">
          <a
            href="/"
            aria-label="Individual Studio home"
            className="footer-logo"
          >
            <BmwLogo />
            <span>Individual Studio</span>
          </a>
          <p>© {new Date().getFullYear()} Individual Studio.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a
            href="https://www.bmwusa.com/build-your-own.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            BMW builder <ExternalLink aria-hidden="true" />
          </a>
          <a
            href="https://individual.bmw-m.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            BMW Individual <ExternalLink aria-hidden="true" />
          </a>
        </nav>
        <a
          className="footer-github"
          href="https://github.com/Aadil1505"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Avatar className="footer-avatar">
            <AvatarImage
              src="https://avatars.githubusercontent.com/u/74999480?v=4&s=96"
              alt="Aadil1505’s GitHub profile picture"
              width={40}
              height={40}
            />
            <AvatarFallback>AA</AvatarFallback>
          </Avatar>
          <span>
            Built by <strong>Aadil1505</strong>
          </span>
          <ExternalLink aria-hidden="true" />
        </a>
      </div>
      <p className="footer-disclaimer">
        Independent visualizer. Not affiliated with or endorsed by BMW. BMW and
        BMW Individual are trademarks of BMW AG. Rendered colors are for
        illustration; confirm paint availability, appearance and pricing with
        your BMW Center.
      </p>
    </footer>
  );
}
