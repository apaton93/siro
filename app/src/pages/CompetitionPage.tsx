import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { FixtureList } from '../components/FixtureList'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, useApi } from '../lib/api'
import { compBandStyle, competitionCard, type CompetitionCardInfo } from '../lib/competitions'
import { NotFoundPage } from './SimplePages'

/** /competitions/:code – every upcoming fixture in one competition. */
export function CompetitionPage() {
  const { code } = useParams()
  const card = competitionCard(code)

  useEffect(() => {
    if (card) document.title = `${card.name} – Siro`
  }, [card])

  if (!card) return <NotFoundPage />
  return <Competition card={card} />
}

function Competition({ card }: { card: CompetitionCardInfo }) {
  const props = card
  const { state, reload } = useApi(`fixtures:comp:${props.code}`, (signal) => api.fixtures({ competition: props.code }, signal))

  return (
    <>
      <TopBar />
      <header className="comp-hero" style={compBandStyle(card)}>
        <Link to="/?tab=competitions" className="icon-btn" aria-label="Back to competitions">
          <Icon name="back" />
        </Link>
        <span className="comp-card__code">{props.code}</span>
        <h1 className="comp-card__name">{props.name}</h1>
        {card.photo && <small className="band-credit">Photo: {card.photo.credit}</small>}
      </header>
      <main className="page">
        <h2 className="display" style={{ fontSize: 22 }}>
          Upcoming fixtures
        </h2>
        <FixtureList
          state={state}
          reload={reload}
          label="fixtures"
          empty={<StateMessage title="Coming soon">Fixtures for the {props.name} haven’t been added yet.</StateMessage>}
        />
      </main>
    </>
  )
}
