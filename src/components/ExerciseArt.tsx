import type { Exercise } from '../data'

export function ExerciseArt({ kind }: { kind: Exercise['kind'] }) {
  return <div className={`exercise-art art-${kind}`} aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 55H56" stroke="rgb(var(--muted))" strokeWidth="1.2" />
    {kind === 'squat' ? <>
      <path d="M14 51V12h27M38 9v9M42 9v9M11 12h7M46 54 53 17" stroke="rgb(var(--muted))" strokeWidth="2" />
      <circle cx="33" cy="21" r="4.5" fill="rgb(var(--secondary))" stroke="none" /><path d="m31 28-5 12 12 4-4 10m-6-15-8 6 4 9m7-25 9 3 3-9" strokeWidth="4" />
    </> : kind === 'curl' ? <>
      <path d="M15 37h16l13 8M15 26v27M10 53h15M40 45v9" stroke="rgb(var(--muted))" />
      <circle cx="28" cy="18" r="4.5" fill="rgb(var(--secondary))" stroke="none" /><path d="m27 25-2 12 17 2 5 11m-22-13 2 15m4-26 5 10 10-7" strokeWidth="4" /><path d="m43 25 6 7m-9-4 5-4m1 9 5-4" stroke="rgb(var(--accent-ink))" />
    </> : kind === 'pull' ? <>
      <path d="M12 53V9h40v44M15 13h34M46 14v18l-9 9" stroke="rgb(var(--muted))" strokeWidth="1.8" />
      <circle cx="28" cy="23" r="4.5" fill="rgb(var(--secondary))" stroke="none" /><path d="m28 30 2 13-9 10m9-10 12 10m-14-22 9 7 5-5" strokeWidth="4" /><path d="m39 31 8 4" stroke="rgb(var(--accent-ink))" />
    </> : kind === 'press' || kind === 'raise' ? <>
      <circle cx="32" cy="18" r="4.5" fill="rgb(var(--secondary))" stroke="none" /><path d="M32 26v14m0 0-9 14m9-14 9 14" strokeWidth="4" />
      {kind === 'press' ? <><path d="m29 28-8-9V12m14 16 8-9V12" strokeWidth="3.5" /><path d="M15 10h34M18 6v8M46 6v8" stroke="rgb(var(--accent-ink))" /></> : <><path d="m29 28-11 8-8-4m25-4 11 8 8-4" strokeWidth="3.5" /><path d="m7 28 5 8m40 0 5-8" stroke="rgb(var(--accent-ink))" /></>}
    </> : kind === 'crunch' ? <>
      <path d="M12 53V10h40M47 11v19l-9 2" stroke="rgb(var(--muted))" strokeWidth="1.8" />
      <circle cx="33" cy="29" r="4.5" fill="rgb(var(--secondary))" stroke="none" /><path d="m28 33-6 9 13 7 11 2m-24-9 9-5 7-5m-15 13-3 8h14" strokeWidth="4" />
    </> : kind === 'dip' ? <>
      <path d="M13 54V31h11m27 23V31H40" stroke="rgb(var(--muted))" /><circle cx="33" cy="15" r="4.5" fill="rgb(var(--secondary))" stroke="none" /><path d="m32 23-2 15 8 9-7 6m-1-15-7 9 7 6M29 25l-9-2v10m15-8 9-2v10" strokeWidth="3.5" />
    </> : <>
      <path d="m15 53 17-24 14 24M24 39h18" stroke="rgb(var(--muted))" /><circle cx="17" cy="25" r="4.5" fill="rgb(var(--secondary))" stroke="none" /><path d="m23 29 14 8 7 15m-7-15 13 10 4 6m-30-23-4 12 11 3" strokeWidth="4" />
    </>}
  </svg></div>
}
