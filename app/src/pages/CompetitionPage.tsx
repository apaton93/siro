import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { FixtureList } from '../components/FixtureList'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, useApi } from '../lib/api'
import { competitionCard } from '../lib/competitions'
import { NotFoundPage } from './SimplePages'

/** /competitions/:code – every upcoming fixture in one competition. */
export function CompetitionPage() {
  const { code } = useParams()
  const card = competitionCard(code)

  useEffect(() => {
    if (card) document.title = `${card.name} – Siro`
  }, [card])

  if (!card) return <NotFoundPage />
  return <Competition code={card.code} name={card.name} colour={card.colour} textColour={card.textColour} />
}

function Competition(props: { code: string; name: string; colour: string; textColour: string }) {
  const { state, reload } = useApi(`fixtures:comp:${props.code}`, (signal) => api.fixtures({ competition: props.code }, signal))

  return (
    <>
      <TopBar />
      <header className="comp-hero" style={{ background: props.colour, color: props.textColour }}>
        <Link to="/?tab=competitions" className="icon-btn" aria-label="Back to competitions">
          <Icon name="back" />
        </Link>
        <span className="comp-card__code">{props.code}</span>
        <h1 className="comp-card__name">{props.name}</h1>
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
