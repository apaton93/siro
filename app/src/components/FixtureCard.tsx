import type { FixtureSummary } from '@siro/shared'
import { Link } from 'react-router'
import { formatShortDate } from '../lib/format'
import { TeamBand } from './TeamBand'

/** Fixture card: city photo fading into the away team's colour (the travelling fans' team). */
export function FixtureCard({ fixture }: { fixture: FixtureSummary }) {
  const { awayTeam, homeTeam, city, stadium, competition } = fixture

  return (
    <Link to={`/fixtures/${fixture.id}`} className="fixture-card">
      <TeamBand
        colour={awayTeam.primaryColour}
        textColour={awayTeam.onPrimaryColour}
        photoUrl={city.photoUrl}
        photoCredit={city.photoCredit}
      >
        <div className="fixture-card__meta">
          <span>▸ {competition.name}</span>
          <time dateTime={fixture.kickoffUtc}>{formatShortDate(fixture.kickoffUtc, city.timezone)}</time>
        </div>
        <div className="fixture-card__teams">
          <span>{homeTeam.name}</span>
          <span>v {awayTeam.name}</span>
        </div>
      </TeamBand>
      <div className="fixture-card__foot">
        <span>
          {stadium.name}, {city.name}
        </span>
        <strong>{fixture.goingCount} going</strong>
      </div>
    </Link>
  )
}
