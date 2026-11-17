"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  Flower2,
  Heart,
  MapPin,
  Sparkles,
  Star,
  Shirt,
  Utensils,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { WeddingCategory, WeddingService } from "@/lib/homepage-data";
import { weddingCategories } from "@/lib/homepage-data";
import SectionHeading from "./section-heading";
import ServiceCard from "./service-card";
import SiteFooter from "./site-footer";
import SiteNavbar from "./site-navbar";

type HomePageProps = {
  services: WeddingService[];
};

const categoryDetails: Record<
  WeddingCategory,
  { note: string; icon: typeof Camera }
> = {
  "Photography & Videography": {
    note: "Keep the moments",
    icon: Camera,
  },
  "Wedding Venues": {
    note: "Find your somewhere",
    icon: MapPin,
  },
  "Decoration & Florist": {
    note: "Make it feel like you",
    icon: Flower2,
  },
  "Catering Services": {
    note: "Gather around the table",
    icon: Utensils,
  },
  "Makeup & Styling": {
    note: "Feel like your best self",
    icon: Sparkles,
  },
  "Wedding Fashion": {
    note: "Find the one",
    icon: Shirt,
  },
};

const reasons = [
  {
    number: "01",
    title: "Thoughtfully vetted",
    description:
      "Every featured professional is reviewed before they join our community. Good people, doing beautiful work.",
    icon: BadgeCheck,
  },
  {
    number: "02",
    title: "Your day, your decisions",
    description:
      "Compare your options, explore at your own pace, and choose the people who feel right for your story.",
    icon: Heart,
  },
  {
    number: "03",
    title: "The details, made easier",
    description:
      "Find your venue, flowers, photographs, and more in one welcoming place—without all the open tabs.",
    icon: Sparkles,
  },
];

const steps = [
  {
    number: "01",
    title: "Dream a little",
    description:
      "Start with what matters most to you, from a candlelit dinner to a big garden party.",
  },
  {
    number: "02",
    title: "Find your people",
    description:
      "Explore trusted local wedding professionals across all the details of your day.",
  },
  {
    number: "03",
    title: "Make it yours",
    description:
      "Compare your favorites, get in touch, and bring your plans together with confidence.",
  },
];

const testimonials = [
  {
    quote:
      "We found our photographer and florist in one cozy Sunday afternoon. It felt less like planning and more like dreaming out loud.",
    names: "Maya & Julian",
    detail: "Married in the Hudson Valley",
    initials: "MJ",
    color: "rose",
  },
  {
    quote:
      "Every vendor felt like someone we would have wanted to meet anyway. We finally felt excited about the details again.",
    names: "Elena & Marcus",
    detail: "Married in Brooklyn",
    initials: "EM",
    color: "sage",
  },
  {
    quote:
      "We had no idea where to begin. WedPlan made all the little choices feel manageable—and very much like us.",
    names: "Avery & Sam",
    detail: "Married in Long Island",
    initials: "AS",
    color: "blue",
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        ease: "easeOut",
        delay: reduceMotion ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}

function ServiceCollection({
  services,
  isLoading,
}: {
  services: WeddingService[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="service-grid" aria-label="Loading wedding services" aria-busy="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="service-skeleton" key={index}>
            <div className="service-skeleton__image" />
            <div className="service-skeleton__line service-skeleton__line--short" />
            <div className="service-skeleton__line service-skeleton__line--title" />
            <div className="service-skeleton__line" />
            <div className="service-skeleton__line service-skeleton__line--medium" />
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="services-empty" role="status">
        <span className="services-empty__icon">
          <Heart size={22} aria-hidden="true" />
        </span>
        <h3>No services in this collection just yet</h3>
        <p>Try another category or check back soon for more lovely finds.</p>
      </div>
    );
  }

  return (
    <div className="service-grid">
      {services.map((service, index) => (
        <Reveal key={service.id} delay={index * 0.045}>
          <ServiceCard service={service} />
        </Reveal>
      ))}
    </div>
  );
}

export default function HomePage({ services }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<WeddingCategory | null>(
    null,
  );
  const reduceMotion = useReducedMotion();

  const visibleServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.approvalStatus === "approved" &&
          service.isActive &&
          (!selectedCategory || service.category === selectedCategory),
      ),
    [services, selectedCategory],
  );

  function showCategory(category: WeddingCategory | null) {
    setSelectedCategory(category);
    document.getElementById("featured")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <>
      <SiteNavbar />
      <main>
        <section className="hero" id="home">
          <div className="hero__inner page-container">
            <div className="hero__copy">
              <Reveal>
                <p className="eyebrow hero__eyebrow">
                  <span className="eyebrow__line" />
                  Your kind of wonderful starts here
                </p>
                <h1>
                  A day that feels
                  <br />
                  like <em>the two of you.</em>
                </h1>
                <p className="hero__description">
                  Find the people who make every detail feel like yours. Wedding
                  planning, with a little more heart and a lot less overwhelm.
                </p>
                <div className="hero__actions">
                  <a className="button button--primary" href="#categories">
                    Explore wedding services
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
                  <a className="hero__text-link" href="#how-it-works">
                    How it works <ArrowDown size={15} aria-hidden="true" />
                  </a>
                </div>
                <div className="hero__trust">
                  <div className="hero__avatars" aria-hidden="true">
                    <span>J</span>
                    <span>M</span>
                    <span>A</span>
                    <span>+</span>
                  </div>
                  <div>
                    <div className="hero__stars" aria-label="Rated 4.9 out of 5">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={13}
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      ))}
                      <strong>4.9/5</strong>
                    </div>
                    <p>A little love from 2,000+ couples</p>
                  </div>
                </div>
              </Reveal>
            </div>
            <motion.div
              className="hero__visual"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
            >
              <div
                className="hero__photo"
                role="img"
                aria-label="A bride and groom celebrating beneath the trees"
              />
              <div className="hero__photo-tint" />
              <div className="hero__note">
                <span className="hero__note-icon">
                  <Heart size={16} fill="currentColor" aria-hidden="true" />
                </span>
                <span>
                  <strong>Made for your kind of love</strong>
                  <small>Every detail, thoughtfully found</small>
                </span>
              </div>
              <div className="hero__seal" aria-label="Here for the happy tears">
                <span>HERE FOR</span>
                <Heart size={18} fill="currentColor" aria-hidden="true" />
                <span>THE HAPPY TEARS</span>
              </div>
              <div className="hero__flower hero__flower--one" aria-hidden="true">
                ✿
              </div>
              <div className="hero__flower hero__flower--two" aria-hidden="true">
                ✿
              </div>
            </motion.div>
            <div className="hero__bottom-note">
              <span>01</span> A little less ordinary, a lot more you
            </div>
          </div>
          <div className="hero__wash" aria-hidden="true" />
        </section>

        <section className="trust-strip" aria-label="WedPlan highlights">
          <div className="trust-strip__inner page-container">
            <span>YOUR DAY, ON YOUR TERMS</span>
            <i aria-hidden="true" />
            <span>LOCAL PROFESSIONALS</span>
            <i aria-hidden="true" />
            <span>THOUGHTFULLY VETTED</span>
            <i aria-hidden="true" />
            <span>MADE WITH HEART</span>
          </div>
        </section>

        <section className="categories section-pad" id="categories">
          <div className="page-container">
            <Reveal>
              <SectionHeading
                eyebrow="The lovely little details"
                title="Everything you need to make it yours."
                description="Start wherever your heart takes you. The rest will come together."
              />
            </Reveal>
            <div className="category-grid">
              {weddingCategories.map((category, index) => {
                const Icon = categoryDetails[category].icon;
                return (
                  <Reveal key={category} delay={index * 0.04}>
                    <Button
                      className="category-card"
                      type="button"
                      variant="ghost"
                      onClick={() => showCategory(category)}
                      aria-label={`Explore ${category}`}
                    >
                      <span className="category-card__icon">
                        <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <span className="category-card__copy">
                        <strong>{category}</strong>
                        <small>{categoryDetails[category].note}</small>
                      </span>
                      <ChevronRight
                        className="category-card__arrow"
                        size={18}
                        aria-hidden="true"
                      />
                    </Button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="featured section-pad" id="featured">
          <div className="page-container">
            <Reveal>
              <div className="featured__heading">
                <SectionHeading
                  eyebrow="Good people, lovely work"
                  title="A few favorites to fall for."
                  description="Meet a handful of talented wedding pros ready to make your day feel like you."
                  align="left"
                />
                <div className="featured__count">
                  <span>{visibleServices.length.toString().padStart(2, "0")}</span>
                  <small>thoughtful finds</small>
                </div>
              </div>
            </Reveal>
            <div className="featured__filters" aria-label="Filter featured services">
              <Button
                className={`filter-pill${selectedCategory === null ? " filter-pill--active" : ""}`}
                type="button"
                variant="ghost"
                onClick={() => setSelectedCategory(null)}
                aria-pressed={selectedCategory === null}
              >
                All services
              </Button>
              {weddingCategories.map((category) => (
                <Button
                  className={`filter-pill${selectedCategory === category ? " filter-pill--active" : ""}`}
                  type="button"
                  variant="ghost"
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </Button>
              ))}
            </div>
            <ServiceCollection services={visibleServices} isLoading={false} />
            <div className="featured__foot">
              <p>
                <BadgeCheck size={17} aria-hidden="true" />
                Every featured service is approved and currently active.
              </p>
              {selectedCategory ? (
                <Button
                  className="text-link"
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  See all services <ArrowRight size={15} aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="why section-pad" id="why-wedplan">
          <div className="page-container why__layout">
            <Reveal className="why__visual">
              <div
                className="why__photo"
                role="img"
                aria-label="A beautifully arranged wedding table with flowers and candles"
              />
              <div className="why__photo-label">
                <span className="why__label-icon">
                  <Heart size={15} fill="currentColor" aria-hidden="true" />
                </span>
                <span>A day made of a thousand little things.</span>
              </div>
              <div className="why__stamp" aria-hidden="true">
                <span>LOVE</span>
                <Heart size={17} fill="currentColor" />
                <span>IS IN THE DETAILS</span>
              </div>
            </Reveal>
            <div className="why__content">
              <Reveal>
                <SectionHeading
                  eyebrow="A kinder kind of planning"
                  title="Because this should feel like the fun part."
                  description="Wedding planning is about more than checking boxes. It’s finding the people and little moments that feel like your kind of love."
                  align="left"
                />
              </Reveal>
              <div className="reason-list">
                {reasons.map(({ number, title, description, icon: Icon }, index) => (
                  <Reveal key={number} delay={index * 0.06}>
                    <article className="reason">
                      <span className="reason__icon">
                        <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                      </div>
                      <span className="reason__number">{number}</span>
                    </article>
                  </Reveal>
                ))}
              </div>
              <a className="text-link why__link" href="#how-it-works">
                See how WedPlan works <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="how section-pad" id="how-it-works">
          <div className="page-container">
            <Reveal>
              <SectionHeading
                eyebrow="A few easy steps"
                title="From “where do we start?” to “that’s so us.”"
                description="A little inspiration, the right people, and a plan that feels good."
              />
            </Reveal>
            <div className="steps-grid">
              {steps.map((step, index) => (
                <Reveal key={step.number} delay={index * 0.08}>
                  <article className="step-card">
                    <div className="step-card__top">
                      <span>{step.number}</span>
                      {index < steps.length - 1 ? (
                        <span className="step-card__trail" aria-hidden="true" />
                      ) : null}
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="how__cta">
                <p>It starts with one lovely little idea.</p>
                <button
                  className="button button--outline"
                  type="button"
                  onClick={() => {
                    document.getElementById("categories")?.scrollIntoView({
                      behavior: reduceMotion ? "auto" : "smooth",
                    });
                  }}
                >
                  Find your first detail <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="testimonials section-pad" id="testimonials">
          <div className="page-container">
            <Reveal>
              <SectionHeading
                eyebrow="A little love from our couples"
                title="The best part is hearing how it felt."
                description="Planning stories from couples who found their kind of wonderful."
              />
            </Reveal>
            <div className="testimonial-grid">
              {testimonials.map((testimonial, index) => (
                <Reveal key={testimonial.names} delay={index * 0.07}>
                  <figure className="testimonial-card">
                    <div className="testimonial-card__top">
                      <span className="testimonial-card__quote">
                        <Heart size={18} fill="currentColor" aria-hidden="true" />
                      </span>
                      <span className="testimonial-card__stars" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }, (_, starIndex) => (
                          <Star
                            key={starIndex}
                            size={13}
                            fill="currentColor"
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    </div>
                    <blockquote>“{testimonial.quote}”</blockquote>
                    <figcaption>
                      <span
                        className={`testimonial-card__avatar testimonial-card__avatar--${testimonial.color}`}
                        aria-hidden="true"
                      >
                        {testimonial.initials}
                      </span>
                      <span>
                        <strong>{testimonial.names}</strong>
                        <small>{testimonial.detail}</small>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <p className="testimonial-note">
                <Check size={16} aria-hidden="true" />
                Here for the heart-eyes, the happy tears, and every detail in between.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="closing-cta">
          <div className="closing-cta__inner page-container">
            <Reveal>
              <span className="closing-cta__icon">
                <Heart size={21} fill="currentColor" aria-hidden="true" />
              </span>
              <p className="eyebrow">The beginning of your forever</p>
              <h2>Let’s make room for the good stuff.</h2>
              <p className="closing-cta__description">
                Your people, your plans, your one-of-a-kind day. It all starts here.
              </p>
              <a className="button button--light" href="#categories">
                Find your wedding people <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </Reveal>
          </div>
          <span className="closing-cta__spark closing-cta__spark--one" aria-hidden="true">
            ✳
          </span>
          <span className="closing-cta__spark closing-cta__spark--two" aria-hidden="true">
            ✳
          </span>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
