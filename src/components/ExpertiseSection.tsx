export function ExpertiseSection() {
  return (
    <section
      className="py-24 md:py-32 bg-white dark:bg-bg-dark px-6 max-w-7xl mx-auto"
    >
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-12"
        >
          CORE CAPABILITIES
        </p>

        <h2 className="font-geist-sans text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight mb-12">
          What I Do
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* META ADS & MEDIA BUYING */}
          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-4">Meta Ads & Media Buying</h3>
            <ul className="space-y-3 text-muted/70 text-sm">
              <li>Campaign objectives & KPI planning</li>
              <li>Audience strategy & segmentation</li>
              <li>Media planning & channel selection</li>
              <li>Budget allocation & CPM optimization</li>
              <li>Creative testing direction</li>
              <li>Retargeting concepts</li>
              <li>CPM, CTR, CPC, CPA & ROAS analysis</li>
            </ul>
          </div>

          {/* CONTENT STRATEGY */}
          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-4">Content Strategy</h3>
            <ul className="space-y-3 text-muted/70 text-sm">
              <li>Content pillars & angles</li>
              <li>Content calendars & planning</li>
              <li>Copywriting & messaging</li>
              <li>Audience-focused positioning</li>
              <li>Funnel planning & alignment</li>
              <li>Content & advertising alignment</li>
            </ul>
          </div>

          {/* MARKETING ANALYSIS */}
          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-4">Marketing Analysis</h3>
            <ul className="space-y-3 text-muted/70 text-sm">
              <li>Business & marketing objectives</li>
              <li>Audience research</li>
              <li>Competitor research</li>
              <li>Offer analysis</li>
              <li>Customer journey thinking</li>
              <li>Funnel strategy</li>
              <li>Problem identification</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
