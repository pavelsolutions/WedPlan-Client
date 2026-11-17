import { ArrowUpRight, Camera, Heart, Mail } from "lucide-react";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__brand">
          <Link className="brand brand--footer" href="/#home" aria-label="WedPlan home">
            <span className="brand__mark">
              <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span>wedplan<span className="brand__period">.</span></span>
          </Link>
          <p>For all the big feelings and little details that make a wedding yours.</p>
          <a className="site-footer__social" href="https://www.instagram.com/" target="_blank" rel="noreferrer">
            <Camera size={16} aria-hidden="true" /> Follow along <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
        <div className="site-footer__links">
          <div>
            <h3>Explore</h3>
            <Link href="/services">Wedding services</Link>
            <Link href="/services">Browse categories</Link>
            <Link href="/#how-it-works">How it works</Link>
          </div>
          <div>
            <h3>WedPlan</h3>
            <Link href="/#why-wedplan">Our story</Link>
            <Link href="/#testimonials">Couple stories</Link>
            <a href="mailto:hello@wedplan.com">
              <Mail size={14} aria-hidden="true" /> Get in touch
            </a>
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© WedPlan. Made with love.</span>
        <span>Here’s to your happily ever after.</span>
      </div>
    </footer>
  );
}
