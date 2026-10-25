import type { FixtureSummary } from '@siro/shared'
import { Link } from 'react-router'
import { fanAccessInfo } from '../lib/fanAccess'
import { formatShortDate } from '../lib/format'
import { TeamBand } from './TeamBand'

/** Fixture card: city photo fading into the away team's colour (the travelling fans' team). */
export function FixtureCard({ fixture }: { fixture: FixtureSummary }) {
  const { awayTeam, homeTeam, city, stadium } = fixture
  const access = fanAccessInfo(fixture.fanAccess)
  const finished = fixture.status === 'finished' && fixture.homeScore !== null && fixture.awayScore !== null

  return (
    <Link to={`/fixtures/${fixture.id}`} className="fixture-card">
      <TeamBand
        colour={awayTeam.primaryColour}
        textColour={awayTeam.onPrimaryColour}
        photoUrl={city.photoUrl}
        photoCredit={city.photoCredit}
        solidUntil={22}
        clearTop={50}
      >
        <div className="fixture-card__row">
          <div className="fixture-card__teams">
            <span>{homeTeam.name}</span>
            <span className="fixture-card__away">v {awayTeam.name}</span>
          </div>
          <time className="fixture-card__date" dateTime={fixture.kickoffUtc}>
            {formatShortDate(fixture.kickoffUtc, city.timezone)}
          </time>
        </div>
      </TeamBand>
      <div className="fixture-card__foot">
        <span>
          {stadium.name}, <b className="fixture-card__city">{city.name}</b>
        </span>
        {finished ? (
          <strong>
            FT {fixture.homeScore}–{fixture.awayScore}
          </strong>
        ) : access ? (
          <strong className={`access-badge access-badge--${access.severity}`}>{access.badge}</strong>
        ) : (
          <strong>{fixture.goingCount} going</strong>
        )}
      </div>
    </Link>
  )
}
