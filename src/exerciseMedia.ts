import type { Exercise } from './data'
import { selectedVariant } from './trainingHistory'

export type ExerciseDemo = { src: string; sourceName: string; sourceUrl: string }

// Map movements and equipment explicitly, rather than sharing art by muscle.
// GIFs are loaded directly from their public providers; no API key is needed.
const exerciseDb = (id: string): ExerciseDemo => ({
  src: `https://static.exercisedb.dev/media/${id}.gif`,
  sourceName: 'ExerciseDB', sourceUrl: 'https://exercisedb.dev/',
})
const fitnessProgramer = (path: string, exercise: string): ExerciseDemo => ({
  src: `https://fitnessprogramer.com/wp-content/uploads/${path}.gif`,
  sourceName: 'Fitness Programer', sourceUrl: `https://fitnessprogramer.com/exercise/${exercise}/`,
})
const cableLateral = exerciseDb('wEulIzp')
const dumbbellLateral = exerciseDb('DsgkuIt')

export const exerciseDemos: Record<string, Record<string, ExerciseDemo>> = {
  'wide-pulldown': { 'wide-pulldown': exerciseDb('RVwzP10') },
  'incline-press': { 'incline-press': exerciseDb('ns0SIbU') },
  'lateral-free': { cable: cableLateral, dumbbells: dumbbellLateral },
  'cable-row': { 'cable-row': exerciseDb('Tq6gbK6') },
  'skull-cable': {
    rope: fitnessProgramer('2022/02/Cable-Rope-Lying-on-Floor-Tricep-Extension', 'cable-rope-lying-tricep-extension'),
    ez: exerciseDb('uxJcFUU'),
  },
  'direct-curl': { ez: exerciseDb('6TG6x2w'), dumbbells: exerciseDb('NbVPDMW') },
  'squat-legpress': { squat: exerciseDb('iYzB0Cz'), 'leg-press': exerciseDb('2Qh2J1e') },
  stiff: { dumbbells: exerciseDb('5eLRITT'), barbell: exerciseDb('wQ2c4XD') },
  'leg-ext': { 'leg-ext': exerciseDb('my33uHU') },
  'lying-leg-curl': { 'lying-leg-curl': exerciseDb('17lJ1kr') },
  'calf-any': { standing: exerciseDb('ykUOVze'), seated: exerciseDb('bOOdeyc') },
  'core-choice': { hanging: exerciseDb('I3tsCnC'), plank: fitnessProgramer('2021/02/plank', 'plank') },
  'db-ohp': { 'db-ohp': exerciseDb('znQUdHY') },
  'db-row': { 'db-row': exerciseDb('C0MA9bC') },
  'straight-pull': { 'straight-pull': exerciseDb('x69MAlq') },
  'reverse-fly': { machine: exerciseDb('myfUsKf'), dumbbells: exerciseDb('EAs3xL9') },
  'cable-lateral': { 'cable-lateral': cableLateral },
  hammer: { hammer: exerciseDb('slDvUAU') },
  rope: { rope: exerciseDb('dU605di') },
  'bulgarian-lunge': { bulgarian: exerciseDb('qx4fgX7'), lunge: exerciseDb('RRWFUcw') },
  'neutral-pulldown': { 'neutral-pulldown': exerciseDb('4c9BhzB') },
  'flat-press': { barbell: exerciseDb('EIeI8Vf'), dumbbells: exerciseDb('SpYC0Kp') },
  'lateral-drop': { cable: cableLateral, dumbbells: dumbbellLateral },
  preacher: { dumbbell: exerciseDb('jivWf8n'), barbell: exerciseDb('qOgPVf6') },
  'french-bench': { french: exerciseDb('PdmaD0N'), 'bench-dip': exerciseDb('RrLske5') },
  rollout: { wheel: exerciseDb('NAgVB3t'), ball: fitnessProgramer('2021/08/swiss-ball-rollout', 'swiss-ball-rollout') },
}

export function getExerciseDemo(exercise: Exercise, mode?: 'reps' | 'seconds') {
  const variant = selectedVariant(exercise, mode)
  const variants = Object.hasOwn(exerciseDemos, exercise.id) ? exerciseDemos[exercise.id] : undefined
  const demo = variants && Object.hasOwn(variants, variant.id) ? variants[variant.id] : undefined
  return { demo, variant }
}
