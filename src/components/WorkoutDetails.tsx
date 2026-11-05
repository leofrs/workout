import { repTarget } from '../data'
import type { WorkoutRecord } from '../data'
import { useLanguage } from '../i18n'

export function WorkoutDetails({ record }: { record: WorkoutRecord }) {
  const { t, locale } = useLanguage()
  if (!record.details) return <div className="storage-note"><p>{t('Summary only: this workout was saved before detailed history. Its original sets and prescription are unavailable.')}</p></div>
  const details = record.details
  return <section className="workout-details" aria-label={t('Workout details')}>
    <h3>{t('Workout details')}</h3>
    <p>{t(details.programName)} · {t(details.weekday)} · {t('Program version')}: {details.programVersion}</p>
    {details.recovered && <p className="storage-note">{t('This session started before detailed history. The prescription was captured when the app was updated; unrecorded variants are identified below.')}</p>}
    {details.note && <div className="saved-workout-note"><strong>{t('Workout note')}</strong><p>{details.note}</p></div>}
    {details.exercises.map((exercise, index) => <details className="saved-exercise" key={exercise.prescription.id} open={index === 0}>
      <summary><span>{t(exercise.variant.name)}</span><small>{exercise.logs.filter(set => set.done).length}/{exercise.prescription.sets} {t('sets')}</small></summary>
      <div className="saved-exercise-body">
        <p>{t(exercise.prescription.name)} · {t(exercise.variant.equipment)}</p>
        <p>{t('Original prescription')}: {exercise.prescription.sets} × {exercise.mode === 'seconds' ? `${exercise.prescription.timedAlternative}s` : `${repTarget(exercise.prescription)} ${t('reps')}`}{exercise.prescription.perSide && ` · ${t('per side')}`} · {exercise.prescription.rest === 0 ? t('No rest') : t('Rest: {seconds}s', { seconds: exercise.prescription.rest ?? 90 })}</p>
        {exercise.prescription.technique && <p>{t(exercise.prescription.technique)}</p>}
        <table className="saved-sets-table"><caption className="sr-only">{t('Recorded sets for {exercise}', { exercise: t(exercise.variant.name) })}</caption><thead><tr><th scope="col">{t('SET')}</th><th scope="col">{exercise.mode === 'seconds' ? t('SECONDS') : `${t('Weight')} (${record.unit})`}</th>{exercise.mode !== 'seconds' && <th scope="col">{t('REPS')}</th>}{exercise.mode !== 'seconds' && <th scope="col">{t('RIR')}</th>}<th scope="col">{t('Status')}</th></tr></thead><tbody>{exercise.logs.map((set, setIndex) => <tr key={setIndex}><th scope="row">{setIndex + 1}</th><td>{exercise.mode === 'seconds' ? set.reps || '—' : set.weight === '' && !set.done ? '—' : Number(set.weight).toLocaleString(locale)}</td>{exercise.mode !== 'seconds' && <td>{set.reps || '—'}</td>}{exercise.mode !== 'seconds' && <td>{set.rir !== undefined ? (set.rir === 'unknown' ? t("Don't know") : set.rir) : '—'}</td>}<td>{set.done ? t('Completed') : t('Not completed')}</td></tr>)}</tbody></table>
        {!exercise.logs.length && <p>{t('No sets recorded for this exercise.')}</p>}
        {exercise.note && <div className="saved-workout-note"><strong>{t('Exercise note')}</strong><p>{exercise.note}</p></div>}
      </div>
    </details>)}
  </section>
}
