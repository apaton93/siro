import { DISCUSSION_LIMITS, type PostInfo } from '@siro/shared'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, ApiRequestError, useApi } from '../lib/api'
import { initials, useAuth } from '../lib/auth'
import { CATEGORY_LABELS } from '../lib/discussion'
import { formatRelative } from '../lib/format'
import { SignInButtons } from './SignInPage'

/** /fixtures/:id/discuss/:threadId */
export function ThreadPage() {
  const { id = '', threadId = '' } = useParams()
  const { state, reload } = useApi(`thread:${threadId}`, (signal) => api.thread(threadId, signal))

  useEffect(() => {
    if (state.status === 'success') document.title = `${state.data.thread.title} – Siro`
  }, [state])

  return (
    <>
      <TopBar />
      <main className="page">
        <Link to={`/fixtures/${id}/discuss`} className="back-link">
          <Icon name="back" size={16} /> All threads
        </Link>
        {state.status === 'loading' && <div className="skeleton" style={{ height: 200 }} />}
        {state.status === 'error' && (
          <StateMessage
            title={state.error instanceof ApiRequestError && state.error.status === 404 ? 'Thread not found' : "Couldn't load the thread"}
          >
            {state.error.message}
          </StateMessage>
        )}
        {state.status === 'success' && (
          <>
            <div>
              <span className="kicker">
                {CATEGORY_LABELS[state.data.thread.category]} · {state.data.fixture.homeTeam} v {state.data.fixture.awayTeam}
              </span>
              <h1 className="display" style={{ fontSize: 22 }}>
                {state.data.thread.title}
              </h1>
            </div>
            <ol className="posts" aria-label="Posts">
              {state.data.posts.map((p) => (
                <Post key={p.id} post={p} />
              ))}
            </ol>
            <Reply threadId={threadId} onPosted={reload} />
          </>
        )}
      </main>
    </>
  )
}

function Post({ post }: { post: PostInfo }) {
  const { auth } = useAuth()
  const [reported, setReported] = useState(post.reportedByMe)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const report = async () => {
    if (!confirming) return setConfirming(true)
    try {
      await api.reportPost(post.id)
      setReported(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not report')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <li className="post">
      <span className="avatar avatar-sm" aria-hidden="true">
        {initials(post.author.displayName)}
      </span>
      <div className="post__main">
        <div className="post__meta">
          <strong>{post.author.displayName}</strong>
          <time dateTime={post.createdAt}>{formatRelative(post.createdAt)}</time>
        </div>
        {post.hidden ? (
          <p className="post__hidden">Hidden after reports from other fans.</p>
        ) : (
          <p className="post__body">{post.body}</p>
        )}
        {auth.status === 'signed-in' && !post.mine && !post.hidden && (
          <div className="post__actions">
            {reported ? (
              <span className="cta__note">Reported – thanks.</span>
            ) : (
              <button type="button" className="link-btn" onClick={report} aria-label={`Report post by ${post.author.displayName}`}>
                {confirming ? 'Tap again to report' : 'Report'}
              </button>
            )}
            {error && <span className="cta__note">{error}</span>}
          </div>
        )}
      </div>
    </li>
  )
}

function Reply({ threadId, onPosted }: { threadId: string; onPosted: () => void }) {
  const { auth } = useAuth()
  const location = useLocation()
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  if (auth.status === 'signed-out') {
    return (
      <section className="panel" aria-label="Sign in to reply">
        <p className="prose">Sign in to join the conversation.</p>
        <SignInButtons returnTo={location.pathname} />
      </section>
    )
  }
  if (auth.status !== 'signed-in') return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'saving' })
    try {
      await api.createPost(threadId, { body })
      setBody('')
      setStatus({ kind: 'idle' })
      onPosted()
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not post' })
    }
  }

  return (
    <form className="panel composer" onSubmit={submit}>
      <label htmlFor="reply" className="label">
        Reply as {auth.me.displayName}
      </label>
      <textarea
        id="reply"
        className="input input-area"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={DISCUSSION_LIMITS.bodyMax}
        required
      />
      {status.kind === 'error' && (
        <p className="cta__note" role="alert">
          {status.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={status.kind === 'saving' || !body.trim()}>
        Post reply
      </button>
    </form>
  )
}
