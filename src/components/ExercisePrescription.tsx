import { repTarget } from '../data'
import type { Exercise } from '../data'
import { useLanguage } from '../i18n'

export function ExercisePrescription({ exercise }: { exercise: Exercise }) {
  const { t } = useLanguage()
  return <>
    <p><strong>{exercise.sets} {t('sets')}</strong><span>×</span>{repTarget(exercise)} {t('reps')}{exercise.perSide && <span>· {t('per side')}</span>}{exercise.timedAlternative && <span>/ {exercise.timedAlternative}s {t('Plank')}</span>}</p>
    <p className="prescription-rest">{exercise.rest === 0 ? t('No rest') : t('Rest: {seconds}s', { seconds: exercise.rest ?? 90 })}<span>·</span>{t(exercise.equipment)}</p>
    {exercise.technique && <p className="prescription-technique">{t(exercise.technique)}</p>}
  </>
}
