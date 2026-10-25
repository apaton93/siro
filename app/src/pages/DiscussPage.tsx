import { DISCUSSION_LIMITS, THREAD_CATEGORIES, type ThreadCategory } from '@siro/shared'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, useApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CATEGORY_LABELS } from '../lib/discussion'
import { formatRelative } from '../lib/format'
import { SignInButtons } from './SignInPage'

/** /fixtures/:id/discuss?category=pubs – a fixture's threads. */
export function DiscussPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const raw = params.get('category')
  const category = (THREAD_CATEGORIES as readonly string[]).includes(raw ?? '') ? (raw as ThreadCategory) : null
  const fixture = useApi(`fixture:${id}`, (signal) => api.fixture(id, signal))
  const threads = useApi(`threads:${id}:${category}`, (signal) => api.threads(id, category, signal))
  const [composing, setComposing] = useState(false)

  const title = fixture.state.status === 'success' ? `${fixture.state.data.homeTeam.name} v ${fixture.state.data.awayTeam.name}` : ''

  useEffect(() => {
    document.title = title ? `Discussion: ${title} – Siro` : 'Discussion – Siro'
  }, [title])

  return (
    <>
      <TopBar />
      <main className="page">
        <Link to={`/fixtures/${id}`} className="back-link">
          <Icon name="back" size={16} /> Back to fixture
        </Link>
        <div>
          <span className="kicker">Discussion</span>
          <h1 className="display" style={{ fontSize: 24 }}>
            {title || ' '}
          </h1>
        </div>

        <nav className="chips" aria-label="Categories">
          <Link to="?" replace className={`chip ${category === null ? 'chip--on' : ''}`} aria-current={category === null ? 'page' : undefined}>
            All
          </Link>
          {THREAD_CATEGORIES.map((c) => (
            <Link key={c} to={`?category=${c}`} replace className={`chip ${category === c ? 'chip--on' : ''}`} aria-current={category === c ? 'page' : undefined}>
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </nav>

        {composing ? (
          <NewThread fixtureId={id} initialCategory={category ?? 'general'} onCancel={() => setComposing(false)} />
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={() => setComposing(true)}>
            Start a thread
          </button>
        )}

        <div aria-live="polite" aria-busy={threads.state.status === 'loading'}>
          {threads.state.status === 'loading' && <div className="skeleton" style={{ height: 160 }} />}
          {threads.state.status === 'error' && (
            <StateMessage
              title="Couldn't load the discussion"
              action={
                <button type="button" className="btn btn-sm" onClick={threads.reload}>
                  Try again
                </button>
              }
            >
              {threads.state.error.message}
            </StateMessage>
          )}
          {threads.state.status === 'success' &&
            (threads.state.data.threads.length === 0 ? (
              <StateMessage title="No threads yet">
                {category ? `Nothing about ${CATEGORY_LABELS[category].toLowerCase()} yet.` : 'Be the first to start one.'}
              </StateMessage>
            ) : (
              <ul className="rows" aria-label="Threads">
                {threads.state.data.threads.map((t) => (
                  <li key={t.id}>
                    <Link to={`/fixtures/${id}/discuss/${t.id}`} className="thread-row">
                      <span className="row-main">
                        <strong>{t.title}</strong>
                        <span>
                          {CATEGORY_LABELS[t.category]} · {t.author.displayName} · {formatRelative(t.lastPostAt)}
                        </span>
                      </span>
                      <span className="row-value" aria-label={`${t.postCount} posts`}>
                        {t.postCount}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </main>
    </>
  )
}

function NewThread(props: { fixtureId: string; initialCategory: ThreadCategory; onCancel: () => void }) {
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [category, setCategory] = useState<ThreadCategory>(props.initialCategory)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  if (auth.status !== 'signed-in') {
    return (
      <section className="panel" aria-label="Sign in to post">
        <p className="prose">Sign in to start a thread.</p>
        <SignInButtons returnTo={location.pathname + location.search} />
        <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={props.onCancel}>
          Cancel
        </button>
      </section>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'saving' })
    try {
      const { id } = await api.createThread({ fixtureId: props.fixtureId, category, title, body })
      navigate(`/fixtures/${props.fixtureId}/discuss/${id}`)
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not post' })
    }
  }

  return (
    <form className="panel composer" onSubmit={submit}>
      <div className="field">
        <label htmlFor="t-category" className="label">
          Category
        </label>
        <select id="t-category" className="input" value={category} onChange={(e) => setCategory(e.target.value as ThreadCategory)}>
          {THREAD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="t-title" className="label">
          Title
        </label>
        <input
          id="t-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={DISCUSSION_LIMITS.titleMax}
          placeholder="e.g. Best pub for away fans?"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="t-body" className="label">
          Post
        </label>
        <textarea
          id="t-body"
          className="input input-area"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={DISCUSSION_LIMITS.bodyMax}
          required
        />
      </div>
      <p className="cta__note" role="alert">
        {status.kind === 'error' ? status.message : 'Be kind. No ticket touting or sharing personal details.'}
      </p>
      <div className="admin-actions">
        <button type="submit" className="btn btn-primary" disabled={status.kind === 'saving'}>
          Post thread
        </button>
        <button type="button" className="btn" onClick={props.onCancel} disabled={status.kind === 'saving'}>
          Cancel
        </button>
      </div>
    </form>
  )
}
