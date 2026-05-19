import { CampaignProvider, useCampaign } from '../lib/campaignContext';
import { TodayCard } from '../components/TodayCard';
import { WorldPicker } from '../components/WorldPicker';
import { YearGrid } from '../components/YearGrid';

export function Home() {
  return (
    <CampaignProvider>
      <HomeInner />
    </CampaignProvider>
  );
}

function HomeInner() {
  const { campaign, loading } = useCampaign();

  if (loading || !campaign) {
    return (
      <div
        className="flex h-64 items-center justify-center text-sm"
        style={{ color: 'var(--pb-text-tertiary)' }}
      >
        Loading campaign…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <h1
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: 'var(--pb-text-primary)' }}
          >
            Today
          </h1>
          <p
            className="max-w-2xl text-sm"
            style={{ color: 'var(--pb-text-secondary)' }}
          >
            Your campaign's current in-world date, with weather, moons, and events.
            Switch worlds with the picker; everything else flows from there.
          </p>
        </header>
        <WorldPicker />
        <TodayCard />
      </section>

      <YearGrid />
    </div>
  );
}
