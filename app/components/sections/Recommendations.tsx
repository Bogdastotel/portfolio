import { useEffect, useRef, useState } from "react";

import { Section } from "~/components/ui/Section";
import { profile } from "~/content/profile";
import { recommendations, type Recommendation } from "~/content/recommendations";

function Card({ item }: { item: Recommendation }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <span aria-hidden="true" className="font-display text-5xl leading-none text-accent">
        “
      </span>
      <blockquote className="mt-2 text-lg leading-relaxed text-fg">{item.quote}</blockquote>
      <figcaption className="mt-auto pt-6">
        <span className="block border-t border-line pt-5 font-medium">{item.name}</span>
        <span className="block text-sm text-muted">{item.title}</span>
        {item.relation && <span className="mt-2 block font-mono text-xs text-muted">{item.relation}</span>}
      </figcaption>
    </figure>
  );
}

/** Three or more quotes: a row that moves by swipe, trackpad, arrow keys or the buttons. It never moves by itself. */
function Carousel({ items }: { items: Recommendation[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  // Distance between the left edges of two neighbouring cards.
  const step = () => {
    const cards = track.current?.children;
    if (!cards || cards.length < 2) return 0;
    return (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft;
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setAtEnd(end);
      setCurrent(end ? items.length - 1 : Math.round(el.scrollLeft / (step() || 1)));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  const move = (direction: 1 | -1) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollBy({ left: direction * step(), behavior: reduced ? "auto" : "smooth" });
  };

  const button =
    "grid size-11 place-items-center rounded-full border border-line bg-surface text-fg transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-fg";

  return (
    <div className="reveal">
      <ul
        ref={track}
        tabIndex={0}
        aria-label="Recommendations"
        // The trailing spacer lets the last card scroll all the way to the left edge, so every card gets its own stop.
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 [&::-webkit-scrollbar]:hidden after:w-[calc(12%-1.25rem)] after:shrink-0 after:content-[''] sm:after:w-[calc(100%-35.25rem)]"
      >
        {items.map((item) => (
          <li key={item.name + item.quote.slice(0, 24)} className="w-[88%] shrink-0 snap-start sm:w-[34rem]">
            <Card item={item} />
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-3">
        <button type="button" className={button} onClick={() => move(-1)} disabled={current === 0}>
          <span aria-hidden="true">←</span>
          <span className="sr-only">Previous recommendation</span>
        </button>
        <button type="button" className={button} onClick={() => move(1)} disabled={atEnd}>
          <span aria-hidden="true">→</span>
          <span className="sr-only">Next recommendation</span>
        </button>
        <p className="ml-2 font-mono text-xs text-muted" aria-live="polite">
          {String(current + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}

export function Recommendations() {
  if (recommendations.length === 0) return null;

  return (
    <Section id="recommendations" index="04" label="Recommendations" title="What it is like to work with me.">
      {recommendations.length >= 3 ? (
        <Carousel items={recommendations} />
      ) : (
        // One or two quotes fit on screen, so there is nothing to scroll.
        <ul className={`reveal grid gap-5 ${recommendations.length === 2 ? "md:grid-cols-2" : "max-w-3xl"}`}>
          {recommendations.map((item) => (
            <li key={item.name + item.quote.slice(0, 24)}>
              <Card item={item} />
            </li>
          ))}
        </ul>
      )}

      {profile.recommendations && (
        <p className="mt-8">
          <a
            href={profile.recommendations}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-sm text-fg underline decoration-line underline-offset-4 hover:decoration-accent"
          >
            Read the full recommendations on LinkedIn ↗
          </a>
        </p>
      )}
    </Section>
  );
}
