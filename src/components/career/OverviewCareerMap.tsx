import type { CareerProfile } from '@/types/careerProfile';
import { careerColor } from './careerTheme';
import { allItems } from '@/hooks/useCareerProfile';

interface Props {
  profile: CareerProfile;
}

/** Strukturerad översiktskarta – optimerad för utskrift, export och samtal. */
export const OverviewCareerMap = ({ profile }: Props) => {
  const active = profile.categories.filter((c) => allItems(c).length > 0);
  const cols = profile.visualization.layout === 'compact' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="h-full w-full overflow-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground px-10 py-6 shadow-md">
            <span className="text-xs uppercase tracking-widest opacity-80">Min Karriärprofil</span>
            <span className="text-2xl font-bold">{profile.profileName || 'Min Karriärprofil'}</span>
          </div>
        </div>
        <div className={`grid gap-4 ${cols}`}>
          {active.map((c, i) => {
            const color = careerColor(c.colorIndex ?? i, profile.visualization.theme);
            return (
              <section key={c.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="px-4 py-2 text-sm font-bold text-primary-foreground" style={{ backgroundColor: color }}>
                  {c.title}
                </div>
                {profile.visualization.display === 'all' && (
                  <ul className="p-4 space-y-1">
                    {allItems(c).map((l) => (
                      <li key={l} className="text-sm flex gap-2">
                        <span aria-hidden style={{ color }}>
                          •
                        </span>
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
        {active.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Välj några ord i tidigare steg så byggs din karta upp här.
          </p>
        )}
      </div>
    </div>
  );
};
