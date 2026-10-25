import type { ReportedPost } from '@siro/shared'
import { useState } from 'react'
import { Link } from 'react-router'
import { StateMessage } from '../components/StateMessage'
import { api, useApi } from '../lib/api'
import { formatRelative } from '../lib/format'

/** Admin: posts fans have reported, or that are hidden. */
export function ReportedPosts() {
  const { state, reload } = useApi('reported-posts', (signal) => api.reportedPosts(signal))

  if (state.status === 'loading') return <div className="skeleton" style={{ height: 200 }} />
  if (state.status === 'error') {
    return (
      <StateMessage
        title="Couldn't load reports"
        action={
          <button type="button" className="btn btn-sm" onClick={reload}>
            Try again
          </button>
        }
      >
        {state.error.message}
      </StateMessage>
    )
  }
  return (
    <section className="panel" aria-labelledby="reports-heading">
      <h1 id="reports-heading" className="display" style={{ fontSize: 22 }}>
        Reported posts <span className="label">({state.data.posts.length})</span>
      </h1>
      <p className="cta__note">Posts are hidden automatically after 3 reports. Restoring a post clears its reports.</p>
      {state.data.posts.length === 0 ? (
        <p className="cta__note">Nothing reported. 🎉</p>
      ) : (
        <ul className="posts">
          {state.data.posts.map((p) => (
            <ReportedRow key={p.id} post={p} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ReportedRow({ post }: { post: ReportedPost }) {
  const [hidden, setHidden] = useState(post.hidden)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = async () => {
    setBusy(true)
    setError('')
    try {
      setHidden((await api.setPostHidden(post.id, !hidden)).hidden)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="post post--report">
      <div className="post__main">
        <div className="post__meta">
          <strong>{post.author.displayName}</strong>
          <time dateTime={post.createdAt}>{formatRelative(post.createdAt)}</time>
          <span className={`access-badge access-badge--${hidden ? 'stop' : 'caution'}`}>
            {hidden ? 'Hidden' : `${post.reportedCount} report${post.reportedCount === 1 ? '' : 's'}`}
          </span>
        </div>
        <p className="post__body">{post.body}</p>
        <div className="post__actions">
          <Link to={`/fixtures/${post.thread.fixtureId}/discuss/${post.thread.id}`} className="link-btn">
            In “{post.thread.title}”
          </Link>
          <button type="button" className={`btn btn-sm ${hidden ? '' : 'btn-danger'}`} onClick={toggle} disabled={busy}>
            {hidden ? 'Restore' : 'Hide'}
          </button>
          {error && <span className="cta__note">{error}</span>}
        </div>
      </div>
    </li>
  )
}
