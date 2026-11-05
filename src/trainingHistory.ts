import { currentProgramVersion } from './data'
import type { Day, Exercise, ExerciseSnapshot, ExerciseVariant, LoggedSet, Session, WorkoutExerciseRecord, WorkoutRecord } from './data'

const variants: Record<string, ExerciseVariant[]> = {
  'lateral-free': [{ id: 'cable', name: 'Cable Lateral Raise', equipment: 'Cable' }, { id: 'dumbbells', name: 'Dumbbell Lateral Raise', equipment: 'Dumbbells' }],
  'skull-cable': [{ id: 'rope', name: 'Cable Skull Crusher — Rope', equipment: 'Cable' }, { id: 'ez', name: 'Cable Skull Crusher — EZ Bar', equipment: 'Cable' }],
  'direct-curl': [{ id: 'ez', name: 'EZ-Bar Standing Curl', equipment: 'EZ bar' }, { id: 'dumbbells', name: 'Dumbbell Standing Curl', equipment: 'Dumbbells' }],
  'squat-legpress': [{ id: 'squat', name: 'Back Squat', equipment: 'Barbell' }, { id: 'leg-press', name: '45° Leg Press', equipment: 'Machine' }],
  stiff: [{ id: 'dumbbells', name: 'Dumbbell Stiff-Leg Deadlift', equipment: 'Dumbbells' }, { id: 'barbell', name: 'Barbell Stiff-Leg Deadlift', equipment: 'Barbell' }],
  'calf-any': [{ id: 'standing', name: 'Standing Calf Raise', equipment: 'Machine' }, { id: 'seated', name: 'Seated Calf Raise', equipment: 'Machine' }],
  'core-choice': [{ id: 'hanging', name: 'Hanging Leg Raise', equipment: 'Pull-up bar', mode: 'reps' }, { id: 'plank', name: 'Plank', equipment: 'Mat', mode: 'seconds' }],
  'reverse-fly': [{ id: 'machine', name: 'Machine Reverse Fly', equipment: 'Machine' }, { id: 'dumbbells', name: 'Dumbbell Reverse Fly', equipment: 'Dumbbells' }],
  'bulgarian-lunge': [{ id: 'bulgarian', name: 'Bulgarian Split Squat', equipment: 'Dumbbells' }, { id: 'lunge', name: 'Lunge', equipment: 'Dumbbells' }],
  'flat-press': [{ id: 'barbell', name: 'Barbell Flat Bench Press', equipment: 'Barbell' }, { id: 'dumbbells', name: 'Dumbbell Flat Bench Press', equipment: 'Dumbbells' }],
  'lateral-drop': [{ id: 'cable', name: 'Cable Lateral Raise', equipment: 'Cable' }, { id: 'dumbbells', name: 'Dumbbell Lateral Raise', equipment: 'Dumbbells' }],
  preacher: [{ id: 'dumbbell', name: 'Dumbbell Preacher Curl', equipment: 'Dumbbells' }, { id: 'barbell', name: 'Barbell Preacher Curl', equipment: 'Barbell' }],
  'french-bench': [{ id: 'french', name: 'French Press', equipment: 'Dumbbells' }, { id: 'bench-dip', name: 'Bench Dip', equipment: 'Bench' }],
  rollout: [{ id: 'wheel', name: 'Ab Wheel Rollout', equipment: 'Ab wheel' }, { id: 'ball', name: 'Stability Ball Rollout', equipment: 'Stability ball' }],
}

export const exerciseVariants = (exercise: Exercise): ExerciseVariant[] => Object.hasOwn(variants, exercise.id) ? variants[exercise.id] : [{ id: exercise.id, name: exercise.name, equipment: exercise.equipment }]
export function selectedVariant(exercise: Exercise, mode?: 'reps' | 'seconds') {
  const options = exerciseVariants(exercise)
  return (exercise.timedAlternative && mode ? options.find(option => (option.mode ?? 'reps') === mode) : options.find(option => option.id === exercise.variantId)) ?? options[0]
}

export function snapshotExercise(exercise: Exercise, rest: number, mode?: 'reps' | 'seconds'): ExerciseSnapshot {
  const variant = selectedVariant(exercise, mode)
  return { prescription: { ...exercise, rest: exercise.rest ?? rest, variantId: variant.id }, variant: { ...variant }, mode: variant.mode ?? mode ?? 'reps', note: '' }
}

export function previousExercise(history: WorkoutRecord[], snapshot: ExerciseSnapshot, unit: 'kg' | 'lb') {
  for (const record of [...history].sort((a, b) => b.finishedAt - a.finishedAt)) {
    if (record.unit !== unit) continue
    const exercise = record.details?.exercises.find(item => item.prescription.id === snapshot.prescription.id && item.variant.id === snapshot.variant.id && item.mode === snapshot.mode && item.logs.some(set => set.done))
    if (exercise) return { record, exercise }
  }
  return null
}

export function initialLogs(snapshot: ExerciseSnapshot, history: WorkoutRecord[], unit: 'kg' | 'lb'): LoggedSet[] {
  const previous = previousExercise(history, snapshot, unit)
  return Array.from({ length: snapshot.prescription.sets }, (_, index) => ({
    weight: snapshot.mode === 'seconds' ? '' : previous?.exercise.logs[index]?.done ? previous.exercise.logs[index].weight : '',
    reps: String(snapshot.mode === 'seconds' ? snapshot.prescription.timedAlternative : snapshot.prescription.reps),
    done: false,
  }))
}

export function createSession(day: Day, unit: 'kg' | 'lb', programName: string, rest: number, history: WorkoutRecord[]): Session {
  const snapshots = Object.fromEntries(day.exercises.map(exercise => [exercise.id, snapshotExercise(exercise, rest)]))
  return {
    dayId: day.id, name: day.name, startedAt: Date.now(), unit,
    logs: Object.fromEntries(Object.entries(snapshots).map(([id, snapshot]) => [id, initialLogs(snapshot, history, unit)])),
    modes: Object.fromEntries(Object.entries(snapshots).map(([id, snapshot]) => [id, snapshot.mode])),
    details: { schemaVersion: 1, programName, programVersion: currentProgramVersion, weekday: day.weekday, note: day.note, snapshots },
  }
}

// Old summaries remain untouched. Recover only an ongoing session, marking the
// prescription as captured at upgrade time because its original snapshot is unknown.
export function recoverSession(session: Session | null, days: Day[], unit: 'kg' | 'lb', programName: string, rest: number): Session | null {
  if (!session || session.details) return session
  const day = days.find(day => day.id === session.dayId)
  if (!day) return session
  if (Object.keys(session.logs).some(id => !day.exercises.some(exercise => exercise.id === id))) return { ...session, unit }
  const current = createSession(day, unit, programName, rest, [])
  if (current.details) {
    current.details.recovered = true
    for (const exercise of day.exercises) {
      const snapshot = snapshotExercise(exercise, rest, session.modes?.[exercise.id])
      if (!exercise.timedAlternative && exerciseVariants(exercise).length > 1) snapshot.variant = { id: 'unrecorded', name: 'Variant not recorded', equipment: exercise.equipment }
      current.details.snapshots[exercise.id] = snapshot
    }
  }
  return { ...current, ...session, unit, details: current.details }
}

export function switchVariant(session: Session, exercise: Exercise, variant: ExerciseVariant, rest: number, history: WorkoutRecord[]): Session {
  if (session.logs[exercise.id]?.some(set => set.done) || !session.details) return session
  const snapshot = snapshotExercise({ ...exercise, variantId: variant.id }, rest, variant.mode)
  snapshot.note = session.details.snapshots[exercise.id]?.note ?? ''
  return {
    ...session,
    modes: { ...session.modes, [exercise.id]: snapshot.mode },
    logs: { ...session.logs, [exercise.id]: initialLogs(snapshot, history, session.unit ?? 'kg') },
    details: { ...session.details, snapshots: { ...session.details.snapshots, [exercise.id]: snapshot } },
  }
}

export function finishRecord(session: Session, seconds: number): WorkoutRecord {
  const exercises: WorkoutExerciseRecord[] = Object.entries(session.details?.snapshots ?? {}).map(([id, snapshot]) => ({
    ...snapshot,
    logs: (session.logs[id] ?? []).map(set => {
      const copy: LoggedSet = { weight: set.weight, reps: set.reps, done: set.done }
      if (set.rir !== undefined) copy.rir = set.rir
      return copy
    }),
  }))
  const completed = Object.values(session.logs).flat().filter(set => set.done)
  return {
    id: crypto.randomUUID(), name: session.name, dayId: session.dayId, finishedAt: Date.now(), seconds,
    sets: completed.length, exercises: Object.values(session.logs).filter(sets => sets.some(set => set.done)).length,
    volume: Object.entries(session.logs).filter(([id]) => (session.details?.snapshots[id]?.mode ?? session.modes?.[id]) !== 'seconds').flatMap(([, sets]) => sets).filter(set => set.done).reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0),
    unit: session.unit ?? 'kg',
    ...(session.details ? { details: { schemaVersion: 1 as const, programName: session.details.programName, programVersion: session.details.programVersion, weekday: session.details.weekday, note: session.details.note, recovered: session.details.recovered, exercises } } : {}),
  }
}
