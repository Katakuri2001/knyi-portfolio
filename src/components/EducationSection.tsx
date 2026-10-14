export function EducationSection() {
  return (
    <section
      className="py-24 md:py-32 px-6 max-w-7xl mx-auto"
    >
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-12"
        >
          EDUCATION & PROFESSIONAL DEVELOPMENT
        </p>

        <h2 className="font-geist-sans text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight mb-12">
          Education
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-4">Completed Training</h3>
            <ul className="space-y-3 text-muted/70 text-sm">
              <li>
                <p className="font-medium">Content Writing</p>
                <p className="text-muted/60">The Burmese Content Academy, 2025</p>
              </li>
              <li>
                <p className="font-medium">Graphic Design</p>
                <p className="text-muted/60">Donato, 2023</p>
              </li>
              <li>
                <p className="font-medium">Digital Marketing Basic</p>
                <p className="text-muted/60">Digital Face, 2024</p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-4">Currently Studying</h3>
            <ul className="space-y-3 text-muted/70 text-sm">
              <li>
                <p className="font-medium">Digital Marketing Advanced</p>
                <p className="text-muted/60">Ye Htet</p>
              </li>
              <li>
                <p className="font-medium">Digital Marketing Advanced</p>
                <p className="text-muted/60">Bagan Digital Institute</p>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted/60">
          Second-year university studies, discontinued before graduation.
        </p>
      </div>
    </section>
  );
}
