import type { AdminReference } from '@siro/shared'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { StateMessage } from '../components/StateMessage'
import { api, useApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { utcToZonedInput, zonedTimeToUtc } from '../lib/zoned'
import { CONFIGS, type EntityConfig, type Field } from './admin-config'
import { SignInButtons } from './SignInPage'

type Row = Record<string, unknown> & { id: string }
type Values = Record<string, string>

/** /admin?type=fixtures – add and edit the fixtures and reference data fans see. */
export function AdminPage() {
  const { auth } = useAuth()

  useEffect(() => {
    document.title = 'Admin – Siro'
  }, [])

  return (
    <>
      <TopBar />
      <main className="page">
        <span className="kicker">Admin</span>
        {auth.status === 'loading' && <div className="skeleton" style={{ height: 160 }} />}
        {auth.status === 'error' && <StateMessage title="Couldn't check your account">{auth.error.message}</StateMessage>}
        {auth.status === 'signed-out' && <SignInButtons returnTo="/admin" />}
        {auth.status === 'signed-in' &&
          (auth.me.isAdmin ? (
            <Admin />
          ) : (
            <StateMessage title="Admins only">This page is for adding fixtures and city guides.</StateMessage>
          ))}
      </main>
    </>
  )
}

function Admin() {
  const [params] = useSearchParams()
  const config = CONFIGS.find((c) => c.entity === params.get('type')) ?? CONFIGS[0]
  const { state, reload } = useApi('admin-reference', (signal) => api.adminReference(signal))
  const [editing, setEditing] = useState<{ entity: string; id: string | null } | null>(null)
  const [notice, setNotice] = useState('')

  const open = editing?.entity === config.entity ? editing : null

  return (
    <>
      <nav className="tabs tabs-flush" aria-label="Record types">
        {CONFIGS.map((c) => (
          <Link
            key={c.entity}
            to={`?type=${c.entity}`}
            className={c.entity === config.entity ? 'active' : ''}
            aria-current={c.entity === config.entity ? 'page' : undefined}
            onClick={() => {
              setEditing(null)
              setNotice('')
            }}
          >
            {c.title}
          </Link>
        ))}
      </nav>

      {state.status === 'loading' && <div className="skeleton" style={{ height: 200 }} />}
      {state.status === 'error' && (
        <StateMessage
          title="Couldn't load admin data"
          action={
            <button type="button" className="btn btn-sm" onClick={reload}>
              Try again
            </button>
          }
        >
          {state.error.message}
        </StateMessage>
      )}
      {state.status === 'success' &&
        (open ? (
          <EditForm
            key={`${config.entity}:${open.id ?? 'new'}`}
            config={config}
            ref_={state.data}
            row={open.id ? (state.data[config.list] as unknown as Row[]).find((r) => r.id === open.id) ?? null : null}
            onDone={(message) => {
              setEditing(null)
              setNotice(message)
              if (message) reload()
            }}
          />
        ) : (
          <RecordList
            config={config}
            ref_={state.data}
            notice={notice}
            onAdd={() => {
              setNotice('')
              setEditing({ entity: config.entity, id: null })
            }}
            onEdit={(id) => {
              setNotice('')
              setEditing({ entity: config.entity, id })
            }}
          />
        ))}
    </>
  )
}

function RecordList(props: {
  config: EntityConfig
  ref_: AdminReference
  notice: string
  onAdd: () => void
  onEdit: (id: string) => void
}) {
  const { config, ref_ } = props
  const rows = ref_[config.list] as unknown as Row[]

  return (
    <section className="panel" aria-labelledby="list-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 id="list-heading" className="display" style={{ fontSize: 22 }}>
          {config.title} <span className="label">({rows.length})</span>
        </h1>
        <button type="button" className="btn btn-sm btn-primary" onClick={props.onAdd}>
          Add {config.singular}
        </button>
      </div>
      {props.notice && (
        <p className="cta__note" role="status">
          {props.notice}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="cta__note">Nothing here yet.</p>
      ) : (
        <ul className="rows">
          {rows.map((row) => {
            const { main, sub } = config.describe(row, ref_)
            return (
              <li key={row.id}>
                <span className="row-main">
                  <strong>{main}</strong>
                  {sub && <span>{sub}</span>}
                </span>
                <button type="button" className="btn btn-sm" onClick={() => props.onEdit(row.id)} aria-label={`Edit ${main}`}>
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** Timezone of the stadium currently picked on a fixture form. */
function stadiumTimezone(ref: AdminReference, stadiumId: string): string | null {
  const stadium = ref.stadiums.find((s) => s.id === stadiumId)
  return ref.cities.find((c) => c.id === stadium?.cityId)?.timezone ?? null
}

function initialValues(config: EntityConfig, ref: AdminReference, row: Row | null): Values {
  const values: Values = {}
  for (const f of config.fields) {
    const v = row?.[f.key]
    values[f.key] = v === null || v === undefined ? (row ? '' : (f.initial ?? '')) : String(v)
  }
  // Show kickoff in the stadium's local time.
  if (row && 'kickoffUtc' in values) {
    const tz = stadiumTimezone(ref, values.stadiumId)
    values.kickoffUtc = tz ? utcToZonedInput(String(row.kickoffUtc), tz) : ''
  }
  return values
}

/** Form strings → API body. Returns an error message instead if something can't be converted. */
function toBody(config: EntityConfig, ref: AdminReference, values: Values): Record<string, unknown> | string {
  const body: Record<string, unknown> = {}
  for (const f of config.fields) {
    const raw = values[f.key].trim()
    if (f.kind === 'number') {
      if (raw === '') body[f.key] = null
      else if (Number.isFinite(Number(raw))) body[f.key] = Number(raw)
      else return `${f.label} must be a number`
    } else if (f.kind === 'kickoff') {
      const tz = stadiumTimezone(ref, values.stadiumId)
      if (!tz) return 'Pick a stadium first – kickoff is in its local time'
      const utc = zonedTimeToUtc(raw, tz)
      if (!utc) return 'Enter a kickoff date and time'
      body[f.key] = utc
    } else {
      body[f.key] = raw === '' && f.optional ? null : raw
    }
  }
  return body
}

function EditForm(props: { config: EntityConfig; ref_: AdminReference; row: Row | null; onDone: (message: string) => void }) {
  const { config, ref_, row } = props
  const [values, setValues] = useState<Values>(() => initialValues(config, ref_, row))
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'confirm-delete' } | { kind: 'error'; message: string }>({ kind: 'idle' })
  const label = row ? config.describe(row, ref_).main : `New ${config.singular}`

  const set = (key: string, value: string) => {
    setValues((cur) => ({ ...cur, [key]: value }))
    if (status.kind !== 'saving') setStatus({ kind: 'idle' })
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const body = toBody(config, ref_, values)
    if (typeof body === 'string') return setStatus({ kind: 'error', message: body })
    setStatus({ kind: 'saving' })
    try {
      await api.adminSave(config.entity, row?.id ?? null, body)
      props.onDone(row ? `Saved ${label}.` : `Added ${config.singular}.`)
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save' })
    }
  }

  const remove = async () => {
    if (!row) return
    if (status.kind !== 'confirm-delete') return setStatus({ kind: 'confirm-delete' })
    setStatus({ kind: 'saving' })
    try {
      await api.adminDelete(config.entity, row.id)
      props.onDone(`Deleted ${label}.`)
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not delete' })
    }
  }

  const tz = 'stadiumId' in values ? stadiumTimezone(ref_, values.stadiumId) : null

  return (
    <form className="panel admin-form" onSubmit={save} noValidate>
      <h1 className="display" style={{ fontSize: 22 }}>
        {label}
      </h1>

      {config.fields.map((f) => (
        <FieldInput
          key={f.key}
          field={f}
          ref_={ref_}
          value={values[f.key]}
          onChange={(v) => set(f.key, v)}
          extraHelp={f.kind === 'kickoff' ? (tz ? `Time in ${tz}` : 'Pick a stadium first') : undefined}
        />
      ))}

      <p className="cta__note" role="alert" aria-live="polite">
        {status.kind === 'error' ? status.message : ''}
      </p>

      <div className="admin-actions">
        <button type="submit" className="btn btn-primary" disabled={status.kind === 'saving'}>
          {row ? 'Save' : `Add ${config.singular}`}
        </button>
        <button type="button" className="btn" onClick={() => props.onDone('')} disabled={status.kind === 'saving'}>
          Cancel
        </button>
        {row && config.deletable && (
          <button type="button" className="btn btn-danger" onClick={remove} disabled={status.kind === 'saving'}>
            {status.kind === 'confirm-delete' ? 'Tap again to delete' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}

function FieldInput(props: { field: Field; ref_: AdminReference; value: string; onChange: (v: string) => void; extraHelp?: string }) {
  const { field: f, value, onChange } = props
  const id = `f-${f.key}`
  const help = props.extraHelp ?? f.help
  const common = { id, 'aria-describedby': help ? `${id}-help` : undefined, required: !f.optional }

  let input
  if (f.kind === 'select') {
    input = (
      <select {...common} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{f.optional ? '— None —' : 'Choose…'}</option>
        {f.options?.(props.ref_).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (f.kind === 'textarea') {
    input = <textarea {...common} className="input input-area" value={value} onChange={(e) => onChange(e.target.value)} rows={5} />
  } else if (f.kind === 'colour') {
    input = (
      <span style={{ display: 'flex', gap: 8 }}>
        <input
          type="color"
          className="input input-colour"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label={`${f.label} picker`}
        />
        <input {...common} className="input" value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} />
      </span>
    )
  } else {
    input = (
      <input
        {...common}
        className="input"
        type={f.kind === 'kickoff' ? 'datetime-local' : 'text'}
        inputMode={f.kind === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {f.label}
        {f.optional && ' (optional)'}
      </label>
      {input}
      {help && (
        <span id={`${id}-help`} className="cta__note">
          {help}
        </span>
      )}
    </div>
  )
}
