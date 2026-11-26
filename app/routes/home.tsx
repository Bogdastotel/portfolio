import { About } from "~/components/sections/About";
import { Contact } from "~/components/sections/Contact";
import { Experience } from "~/components/sections/Experience";
import { Hero } from "~/components/sections/Hero";
import { Services } from "~/components/sections/Services";
import { Skills } from "~/components/sections/Skills";
import { Work } from "~/components/sections/Work";
import { profile, siteUrl } from "~/content/profile";
import { seo } from "~/lib/seo";

export function meta() {
  return [
    ...seo({ description: profile.intro, path: "/" }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.name,
        jobTitle: profile.roles.join(", "),
        address: { "@type": "PostalAddress", addressLocality: "Niš", addressCountry: "RS" },
        email: `mailto:${profile.email}`,
        sameAs: [profile.github, profile.linkedin].filter(Boolean),
        ...(siteUrl ? { url: siteUrl } : {}),
      },
    },
  ];
}

export default function Home() {
  return (
    <>
      <Hero />
      <Work />
      <Services />
      <Experience />
      <Skills />
      <About />
      <Contact />
    </>
  );
}
