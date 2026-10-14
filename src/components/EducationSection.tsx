import { Reveal } from "@/components/Reveal";

const COMPLETED = [
  { name: "Content Writing", detail: "The Burmese Content Academy", year: "2025" },
  { name: "Graphic Design", detail: "Donato", year: "2023" },
  { name: "Digital Marketing Basic", detail: "Digital Face", year: "2024" },
];

const STUDYING = [
  { name: "Digital Marketing Advanced", detail: "Ye Htet", year: null },
  { name: "Digital Marketing Advanced", detail: "Bagan Digital Institute", year: null },
];

function Entry({
  name,
  detail,
  year,
  ongoing,
}: {
  name: string;
  detail: string;
  year: string | null;
  ongoing?: boolean;
}) {
  return (
    <li className="group flex items-baseline justify-between gap-6 border-b border-border py-5 transition-colors duration-200 hover:border-accent-ink/40">
      <div>
        <p className="font-geist-sans text-lg font-medium leading-snug text-foreground">
          {name}
        </p>
        <p className="mt-1 text-sm text-muted-text">{detail}</p>
      </div>
      <span
        className={[
          "font-method flex-none text-sm",
          ongoing ? "text-accent-ink" : "text-muted-text",
        ].join(" ")}
      >
        {ongoing ? "Ongoing" : year}
      </span>
    </li>
  );
}

export function EducationSection() {
  return (
    <section id="education" className="section-body scroll-mt-24 px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-secondary">
            <span className="h-px w-12 bg-accent-secondary/40" aria-hidden="true" />
            Education &amp; professional development
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <Reveal delay={0.06} className="lg:col-span-7">
            <h2 className="text-title text-foreground">Education</h2>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
            <p className="text-muted-text leading-relaxed">
              Second-year university studies, discontinued before graduation.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-14 md:grid-cols-2">
          <Reveal delay={0.14}>
            <div>
              <h3 className="text-eyebrow mb-4 text-foreground">Completed training</h3>
              <ul>
                {COMPLETED.map((entry) => (
                  <Entry key={entry.name + entry.detail} {...entry} />
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div>
              <h3 className="text-eyebrow mb-4 text-muted-text">
                Currently studying
              </h3>
              <ul>
                {STUDYING.map((entry) => (
                  <Entry key={entry.name + entry.detail} {...entry} ongoing />
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}