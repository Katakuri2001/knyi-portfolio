import { Reveal } from "@/components/Reveal";

const COMPLETED = [
  { name: "Content Writing", detail: "The Burmese Content Academy, 2025" },
  { name: "Graphic Design", detail: "Donato, 2023" },
  { name: "Digital Marketing Basic", detail: "Digital Face, 2024" },
];

const STUDYING = [
  { name: "Digital Marketing Advanced", detail: "Ye Htet" },
  { name: "Digital Marketing Advanced", detail: "Bagan Digital Institute" },
];

function Entry({ name, detail }: { name: string; detail: string }) {
  return (
    <li className="border-l-2 border-border/70 pl-4 transition-colors duration-300 hover:border-accent-ink">
      <p className="font-geist-sans font-medium">{name}</p>
      <p className="text-muted-text">{detail}</p>
    </li>
  );
}

export function EducationSection() {
  return (
    <section
      id="education"
      className="mx-auto max-w-7xl px-6 py-24 md:py-32"
    >
      <Reveal>
        <p className="font-method mb-6 text-xs uppercase tracking-[0.18em] text-accent-secondary">
          Education &amp; professional development
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <h2 className="mb-12 font-geist-sans text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl">
          Education
        </h2>
      </Reveal>

      <div className="grid gap-12 md:grid-cols-2">
        <Reveal delay={0.1}>
          <div>
            <h3 className="mb-6 font-geist-sans text-lg font-bold">
              Completed training
            </h3>
            <ul className="space-y-5">
              {COMPLETED.map((entry) => (
                <Entry key={entry.name + entry.detail} {...entry} />
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div>
            <h3 className="mb-6 font-geist-sans text-lg font-bold">
              Currently studying
            </h3>
            <ul className="space-y-5">
              {STUDYING.map((entry) => (
                <Entry key={entry.name + entry.detail} {...entry} />
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <p className="mt-12 border-t border-border/50 pt-6 text-muted-text">
          Second-year university studies, discontinued before graduation.
        </p>
      </Reveal>
    </section>
  );
}