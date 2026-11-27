import { Section } from "~/components/ui/Section";
import { TagList } from "~/components/ui/Tag";
import { skills } from "~/content/skills";

export function Skills() {
  return (
    <Section id="skills" index="05" label="Skills" title="The tools I reach for.">
      <dl className="divide-y divide-line border-y border-line">
        {skills.map((skill) => (
          <div key={skill.group} className="reveal grid gap-3 py-5 md:grid-cols-[14rem_1fr] md:gap-10">
            <dt className="font-display font-semibold">{skill.group}</dt>
            <dd>
              <TagList items={skill.items} label={`${skill.group} skills`} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
