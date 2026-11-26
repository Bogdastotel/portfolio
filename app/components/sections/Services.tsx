import { Section } from "~/components/ui/Section";
import { TagList } from "~/components/ui/Tag";
import { services } from "~/content/services";

export function Services() {
  return (
    <Section id="services" index="02" label="Services" title="Need something built? Here is what I take on.">
      <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        {services.map((service, i) => (
          <li key={service.title} className="reveal flex flex-col gap-4 bg-surface p-6 sm:p-8">
            <span className="font-mono text-xs text-accent" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-xl font-semibold tracking-tight">{service.title}</h3>
            <p className="text-muted">{service.text}</p>
            <div className="mt-auto pt-2">
              <TagList items={service.tags} label={`${service.title} technologies`} />
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
