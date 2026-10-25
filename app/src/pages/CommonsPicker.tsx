import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { commonsCredit, searchCommons, type CommonsPhoto } from '../lib/commons'

/** "Find a photo" panel for the city form. Calls onPick with the URL and credit to save. */
export function CommonsPicker(props: { defaultQuery: string; onPick: (photoUrl: string, credit: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(props.defaultQuery)
  const [state, setState] = useState<
    { kind: 'idle' | 'loading' } | { kind: 'done'; photos: CommonsPhoto[] } | { kind: 'error'; message: string }
  >({ kind: 'idle' })

  const search = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setState({ kind: 'loading' })
    try {
      setState({ kind: 'done', photos: await searchCommons(query.trim()) })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Search failed' })
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-sm"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => {
          setOpen(true)
          void search()
        }}
      >
        <Icon name="search" size={16} /> Find a photo on Wikimedia Commons
      </button>
    )
  }

  return (
    <div className="picker">
      {/* Not a nested <form>: the city form wraps this. Enter in the box searches. */}
      <div style={{ display: 'flex', gap: 8 }}>
        <label htmlFor="commons-q" className="visually-hidden">
          Search Wikimedia Commons
        </label>
        <input
          id="commons-q"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void search(e)
          }}
        />
        <button type="button" className="btn btn-dark" onClick={() => void search()} disabled={state.kind === 'loading'}>
          Search
        </button>
      </div>
      <p className="cta__note">Quality-reviewed, freely licensed landscape photos. The credit is filled in for you.</p>

      {state.kind === 'loading' && <div className="skeleton" style={{ height: 120 }} />}
      {state.kind === 'error' && <p className="cta__note">{state.message}</p>}
      {state.kind === 'done' &&
        (state.photos.length === 0 ? (
          <p className="cta__note">No suitable photos – try another search, e.g. the old town or a landmark.</p>
        ) : (
          <ul className="picker__grid">
            {state.photos.map((p) => (
              <li key={p.pageUrl}>
                <button
                  type="button"
                  className="picker__item"
                  onClick={() => {
                    props.onPick(p.thumbUrl, commonsCredit(p))
                    setOpen(false)
                  }}
                  aria-label={`Use ${p.title} by ${p.author}`}
                >
                  <img src={p.thumbUrl.replace(/\/1280px-/, '/330px-')} alt="" loading="lazy" />
                  <span>
                    {p.author} · {p.license}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(false)}>
        Close
      </button>
    </div>
  )
}
