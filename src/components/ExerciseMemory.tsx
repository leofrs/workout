import type { Exercise, ExerciseSnapshot, ExerciseVariant, WorkoutRecord } from '../data'
import { useLanguage } from '../i18n'
import { exerciseVariants, previousExercise } from '../trainingHistory'

export function ExerciseMemory({ exercise, snapshot, history, unit, active, locked, onVariantChange, onNoteChange }: {
  exercise: Exercise; snapshot: ExerciseSnapshot; history: WorkoutRecord[]; unit: 'kg' | 'lb'; active: boolean; locked: boolean
  onVariantChange: (variant: ExerciseVariant) => void; onNoteChange: (note: string) => void
}) {
  const { t, locale } = useLanguage()
  const options = exerciseVariants(exercise)
  const previous = previousExercise(history, snapshot, unit)
  return <div className="exercise-memory">
    {!exercise.timedAlternative && options.length > 1 && <label className="form-label">{t('Exercise variant')}<select aria-label={t('Variant for {exercise}', { exercise: t(exercise.name) })} value={snapshot.variant.id} disabled={locked} onChange={event => {
      const variant = options.find(option => option.id === event.target.value)
      if (variant) onVariantChange(variant)
    }}>{!options.some(option => option.id === snapshot.variant.id) && <option value={snapshot.variant.id}>{t(snapshot.variant.name)}</option>}{options.map(option => <option key={option.id} value={option.id}>{t(option.name)}</option>)}</select><small>{t('Loads are kept separately for each variant. Choose before completing a set.')}</small></label>}
    <aside className="previous-workout" aria-label={t('Last comparable workout for {exercise}', { exercise: t(exercise.name) })}>
      <h4>{t('Last comparable workout')}</h4>
      {previous ? <>
        <p>{new Date(previous.record.finishedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} · {t(previous.exercise.variant.name)} · {previous.record.unit}</p>
        <ul>{previous.exercise.logs.map((set, index) => set.done && <li key={index}><strong>{t('Set {number}', { number: index + 1 })}</strong><span>{snapshot.mode === 'seconds' ? `${set.reps} ${t('seconds')}` : `${Number(set.weight).toLocaleString(locale)} ${unit} × ${set.reps} ${t('reps')}${set.rir !== undefined ? ` · ${set.rir === 'unknown' ? t("RIR: Don't know") : `${t('RIR')} ${set.rir}`}` : ''}`}</span></li>)}</ul>
        {previous.exercise.note && <p className="whitespace-pre-wrap">{previous.exercise.note}</p>}
        {active && snapshot.mode !== 'seconds' && <p>{t('Previous completed-set loads are filled in when this exercise starts. Edit them freely; sets are never marked complete automatically.')}</p>}
      </> : <p>{t('No completed sets for this exercise, variant and weight unit yet. Your first workout will become your reference.')}</p>}
    </aside>
    {active && <label className="form-label">{t('Exercise note')}<textarea aria-label={t('Note for {exercise}', { exercise: t(exercise.name) })} maxLength={2000} value={snapshot.note} placeholder={t('Add a note about this exercise…')} onChange={event => onNoteChange(event.target.value)} /></label>}
  </div>
}
