import { duration, totalSets } from './data'
import type { Day, Muscle } from './data'

const upperMuscles: Muscle[] = ['Shoulders', 'Back', 'Chest', 'Triceps', 'Biceps']
const lowerMuscles: Muscle[] = ['Quads', 'Hamstrings', 'Calves', 'Glutes']
export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function analyzeProgram(days: Day[]) {
  const sessions = days.map(day => {
    const muscles = [...new Set(day.exercises.map(exercise => exercise.muscle))]
    const upper = muscles.some(muscle => upperMuscles.includes(muscle))
    const lower = muscles.some(muscle => lowerMuscles.includes(muscle))
    const focus = upper && lower ? 'Full body' : upper ? 'Upper body' : lower ? 'Lower body' : muscles.length ? 'Core' : 'No exercises yet'
    return { day, muscles, upper, lower, focus, sets: totalSets(day), minutes: day.exercises.length ? duration(day) : 0 }
  })
  const active = sessions.filter(session => session.sets > 0)
  const muscleTotals = new Map<Muscle, { muscle: Muscle; sets: number; sessions: number }>()
  for (const { day, muscles } of active) {
    for (const muscle of muscles) {
      const previous = muscleTotals.get(muscle) ?? { muscle, sets: 0, sessions: 0 }
      muscleTotals.set(muscle, {
        muscle,
        sets: previous.sets + day.exercises.filter(exercise => exercise.muscle === muscle).reduce((sum, exercise) => sum + exercise.sets, 0),
        sessions: previous.sessions + 1,
      })
    }
  }
  return {
    sessions,
    active,
    totalSets: active.reduce((sum, session) => sum + session.sets, 0),
    upperSessions: active.filter(session => session.upper).length,
    lowerSessions: active.filter(session => session.lower).length,
    restDays: weekdays.filter(weekday => !active.some(({ day }) => day.weekday === weekday)),
    muscles: [...muscleTotals.values()].sort((a, b) => b.sets - a.sets),
  }
}
