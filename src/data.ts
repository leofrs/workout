export type Muscle = 'Shoulders' | 'Back' | 'Chest' | 'Triceps' | 'Biceps' | 'Quads' | 'Hamstrings' | 'Calves' | 'Core' | 'Glutes'
export type ExerciseVariant = { id: string; name: string; equipment: string; mode?: 'reps' | 'seconds' }
export type Exercise = {
  id: string
  name: string
  muscle: Muscle
  equipment: string
  sets: number
  reps: number
  repMin?: number
  rest?: number
  timedAlternative?: number
  perSide?: boolean
  technique?: string
  variantId?: string
  kind: 'squat' | 'curl' | 'press' | 'pull' | 'raise' | 'crunch' | 'dip' | 'hinge'
  tip: string
}
export type Day = { id: string; name: string; label: string; short: string; weekday: string; exercises: Exercise[]; note: string; purpose?: string }

export const currentProgramVersion = 'v-taper-1'
export const currentProgramName = 'V-Taper & Arms'
export const programDescription = 'A four-day plan focused on a V-shaped physique: shoulders, back, arms, and balanced legs.'

// Prescriptions transcribed from treino_v_taper.md, in the same order.
export const catalog: Exercise[] = [
  {"id": "wide-pulldown", "name": "Wide-Grip Lat Pulldown", "muscle": "Back", "equipment": "Cable", "sets": 4, "reps": 12, "rest": 90, "kind": "pull", "tip": "Pull your elbows toward your hips; feel your lats open.", "repMin": 8},
  {"id": "incline-press", "name": "Incline Dumbbell Press", "muscle": "Chest", "equipment": "Dumbbells", "sets": 3, "reps": 10, "rest": 90, "kind": "press", "tip": "Use a 30° to 45° incline. Focus on the clavicular portion of the chest.", "repMin": 8},
  {"id": "lateral-free", "name": "Lateral Raise (Cable or Dumbbells)", "muscle": "Shoulders", "equipment": "Cable or dumbbells", "sets": 4, "reps": 15, "rest": 60, "kind": "raise", "tip": "Control the eccentric phase: lower for 2 to 3 seconds.", "repMin": 12},
  {"id": "cable-row", "name": "Seated Cable Row (Neutral Grip)", "muscle": "Back", "equipment": "Cable", "sets": 3, "reps": 12, "rest": 90, "kind": "pull", "tip": "Keep your elbows close to your ribs.", "repMin": 10},
  {"id": "skull-cable", "name": "Cable Skull Crusher (Rope or EZ Bar)", "muscle": "Triceps", "equipment": "Cable", "sets": 3, "reps": 12, "rest": 60, "kind": "press", "tip": "Focus on the long head of the triceps for arm volume.", "repMin": 10},
  {"id": "direct-curl", "name": "Standing Curl (EZ Bar or Dumbbells)", "muscle": "Biceps", "equipment": "EZ bar or dumbbells", "sets": 3, "reps": 12, "rest": 60, "kind": "curl", "tip": "Keep your elbows fixed beside your torso.", "repMin": 10},
  {"id": "squat-legpress", "name": "Back Squat or 45° Leg Press", "muscle": "Quads", "equipment": "Barbell or leg press", "sets": 4, "reps": 10, "rest": 120, "kind": "squat", "tip": "Use full range without losing the natural curve of your lower back.", "repMin": 8},
  {"id": "stiff", "name": "Stiff-Leg Deadlift (Dumbbells or Barbell)", "muscle": "Hamstrings", "equipment": "Dumbbells or barbell", "sets": 3, "reps": 12, "rest": 90, "kind": "hinge", "tip": "Stretch your hamstrings; keep your back straight.", "repMin": 10},
  {"id": "leg-ext", "name": "Leg Extension", "muscle": "Quads", "equipment": "Machine", "sets": 3, "reps": 15, "rest": 60, "kind": "curl", "tip": "Hold the contraction at the top of each rep for 1 second.", "repMin": 12},
  {"id": "lying-leg-curl", "name": "Lying Leg Curl", "muscle": "Hamstrings", "equipment": "Machine", "sets": 3, "reps": 12, "rest": 60, "kind": "curl", "tip": "Control the movement without lifting your hips off the bench.", "repMin": 10},
  {"id": "calf-any", "name": "Standing or Seated Calf Raise", "muscle": "Calves", "equipment": "Machine", "sets": 4, "reps": 15, "rest": 45, "kind": "raise", "tip": "Pause for 1 second in the most stretched position."},
  {"id": "core-choice", "name": "Plank / Hanging Leg Raise", "muscle": "Core", "equipment": "Mat or pull-up bar", "sets": 3, "reps": 20, "rest": 45, "kind": "crunch", "tip": "Hanging leg raise: 15–20 reps; plank: 45 seconds. The protocol asks to avoid weighted oblique exercises to preserve the waistline.", "repMin": 15, "timedAlternative": 45},
  {"id": "db-ohp", "name": "Dumbbell Shoulder Press", "muscle": "Shoulders", "equipment": "Dumbbells", "sets": 3, "reps": 10, "rest": 90, "kind": "press", "tip": "Lower to ear level, keeping your elbows aligned.", "repMin": 8},
  {"id": "db-row", "name": "Single-Arm Dumbbell Row", "muscle": "Back", "equipment": "Dumbbells", "sets": 3, "reps": 12, "rest": 60, "kind": "pull", "tip": "Pull your elbow back in an arc. Rest 60 seconds for each side.", "repMin": 8, "perSide": true},
  {"id": "straight-pull", "name": "Cable Straight-Arm Pulldown", "muscle": "Back", "equipment": "Cable", "sets": 3, "reps": 15, "rest": 60, "kind": "pull", "tip": "Direct isolation of the latissimus dorsi.", "repMin": 12},
  {"id": "reverse-fly", "name": "Reverse Fly (Machine or Dumbbells)", "muscle": "Shoulders", "equipment": "Machine or dumbbells", "sets": 3, "reps": 15, "rest": 60, "kind": "raise", "tip": "Activate the rear deltoid for shoulder thickness.", "repMin": 12},
  {"id": "cable-lateral", "name": "Cable Lateral Raise", "muscle": "Shoulders", "equipment": "Cable", "sets": 4, "reps": 15, "rest": 45, "kind": "raise", "tip": "Set the cable at knee height to maintain continuous tension.", "repMin": 12},
  {"id": "hammer", "name": "Dumbbell Hammer Curl", "muscle": "Biceps", "equipment": "Dumbbells", "sets": 3, "reps": 12, "rest": 60, "kind": "curl", "tip": "Focus on the brachialis for arm width from the front.", "repMin": 10},
  {"id": "rope", "name": "Cable Rope Triceps Extension", "muscle": "Triceps", "equipment": "Cable", "sets": 3, "reps": 15, "rest": 60, "kind": "press", "tip": "Spread the rope at the end of the extension.", "repMin": 12},
  {"id": "bulgarian-lunge", "name": "Bulgarian Split Squat or Lunge", "muscle": "Quads", "equipment": "Dumbbells", "sets": 3, "reps": 12, "rest": 90, "kind": "squat", "tip": "Stability and volume for the lower body. Perform 10–12 reps per leg.", "repMin": 10, "perSide": true},
  {"id": "neutral-pulldown", "name": "Triangle-Grip Lat Pulldown", "muscle": "Back", "equipment": "Cable", "sets": 3, "reps": 12, "rest": 75, "kind": "pull", "tip": "Focus on contraction through the middle of the back.", "repMin": 10},
  {"id": "flat-press", "name": "Flat Bench Press (Barbell or Dumbbells)", "muscle": "Chest", "equipment": "Barbell or dumbbells", "sets": 3, "reps": 10, "rest": 90, "kind": "press", "tip": "A strength foundation for the whole chest.", "repMin": 8},
  {"id": "lateral-drop", "name": "Lateral Raise (Final Drop Set)", "muscle": "Shoulders", "equipment": "Cable or dumbbells", "sets": 4, "reps": 15, "rest": 45, "kind": "raise", "tip": "15 reps per set, with a drop set on the last set.", "technique": "Final set: drop set"},
  {"id": "preacher", "name": "Preacher Curl (Dumbbell or Barbell)", "muscle": "Biceps", "equipment": "Dumbbell or barbell", "sets": 3, "reps": 12, "rest": 0, "kind": "curl", "tip": "Perform with the French press or bench dip as an arm superset. No rest between the two exercises.", "repMin": 10, "technique": "Arm superset · A1 · no rest"},
  {"id": "french-bench", "name": "French Press or Bench Dip", "muscle": "Triceps", "equipment": "Dumbbell or bench", "sets": 3, "reps": 12, "rest": 60, "kind": "press", "tip": "Complete the arm superset after the preacher curl. Rest 60 seconds after both exercises.", "repMin": 10, "technique": "Arm superset · A2 · rest 60s after both"},
  {"id": "rollout", "name": "Ab Wheel or Stability Ball Rollout", "muscle": "Core", "equipment": "Ab wheel or stability ball", "sets": 3, "reps": 15, "rest": 45, "kind": "crunch", "tip": "Deep core strengthening.", "repMin": 12},
]

export const initialDays: Day[] = [
  {
    "id": "upper-1",
    "name": "Upper 1",
    "label": "Lat width & lateral deltoids",
    "short": "Upper 1",
    "weekday": "Monday",
    "exerciseIds": [
      "wide-pulldown",
      "incline-press",
      "lateral-free",
      "cable-row",
      "skull-cable",
      "direct-curl"
    ],
    "note": "",
    "purpose": "Widen the upper torso and begin the weekly arm work."
  },
  {
    "id": "lower",
    "name": "Lower & Core",
    "label": "Leg strength & trunk stability",
    "short": "Lower & Core",
    "weekday": "Tuesday",
    "exerciseIds": [
      "squat-legpress",
      "stiff",
      "leg-ext",
      "lying-leg-curl",
      "calf-any",
      "core-choice"
    ],
    "note": "",
    "purpose": "Dense, functional legs while preserving the waistline."
  },
  {
    "id": "upper-2",
    "name": "Upper 2",
    "label": "Back thickness, rear delts & arms",
    "short": "Upper 2",
    "weekday": "Thursday",
    "exerciseIds": [
      "db-ohp",
      "db-row",
      "straight-pull",
      "reverse-fly",
      "cable-lateral",
      "hammer",
      "rope"
    ],
    "note": "",
    "purpose": "Build back thickness and three-dimensional shoulders."
  },
  {
    "id": "full-body",
    "name": "Full Body",
    "label": "Global maintenance & aesthetic finisher",
    "short": "Full Body",
    "weekday": "Friday",
    "exerciseIds": [
      "bulgarian-lunge",
      "neutral-pulldown",
      "flat-press",
      "lateral-drop",
      "preacher",
      "french-bench",
      "rollout"
    ],
    "note": "",
    "purpose": "Add weekly frequency for aesthetic priorities without fatiguing the central nervous system."
  }
].map(({ exerciseIds, ...day }) => ({ ...day, exercises: exerciseIds.map(id => ({ ...catalog.find(exercise => exercise.id === id)! })) }))

export const programGuidelines = [
  'Visual priority: lateral deltoids and lats, with 2–3 weekly stimuli, according to the protocol.',
  'Protocol rest-day practice: stomach vacuum in the morning while fasting, 3–4 sets of 20–30 seconds.',
  'Progressive overload: log weights and reps. Increase the load once you reach the top of the rep range with good form.',
]

export type RirValue = '0' | '1' | '2' | '3' | '4+' | 'unknown'
export type LoggedSet = { weight: string; reps: string; done: boolean; rir?: RirValue }
export type ExerciseSnapshot = { prescription: Exercise; variant: ExerciseVariant; mode: 'reps' | 'seconds'; note: string }
export type SessionDetails = { schemaVersion: 1; programName: string; programVersion: string; weekday: string; note: string; recovered?: boolean; snapshots: Record<string, ExerciseSnapshot> }
export type Session = { dayId: string; name: string; startedAt: number; logs: Record<string, LoggedSet[]>; modes?: Record<string, 'reps' | 'seconds'>; unit?: 'kg' | 'lb'; details?: SessionDetails }
export type WorkoutExerciseRecord = ExerciseSnapshot & { logs: LoggedSet[] }
export type WorkoutDetails = Omit<SessionDetails, 'snapshots'> & { exercises: WorkoutExerciseRecord[] }
export type WorkoutRecord = { id: string; name: string; dayId: string; finishedAt: number; seconds: number; sets: number; volume: number; unit: 'kg' | 'lb'; exercises: number; details?: WorkoutDetails }
export type Preferences = { name: string; unit: 'kg' | 'lb'; rest: number }

export function readStored<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(`form:${key}`); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
export function saveStored(key: string, value: unknown) {
  try { localStorage.setItem(`form:${key}`, JSON.stringify(value)); return true } catch { return false }
}
export function commitStored(values: Record<string, unknown>): { ok: boolean; recovered: boolean } {
  let previous: Map<string, string | null>
  try { previous = new Map(Object.keys(values).map(key => [`form:${key}`, localStorage.getItem(`form:${key}`)])) } catch { return { ok: false, recovered: true } }
  try {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(`form:${key}`, JSON.stringify(value))
    return { ok: true, recovered: true }
  } catch {
    let recovered = true
    for (const [key, value] of previous) {
      try { if (value === null) localStorage.removeItem(key); else if (localStorage.getItem(key) !== value) localStorage.setItem(key, value) } catch { recovered = false }
    }
    return { ok: false, recovered }
  }
}
export const totalSets = (day: Day) => day.exercises.reduce((sum, e) => sum + e.sets, 0)
export const duration = (day: Day) => Math.round(day.exercises.reduce((minutes, exercise) => minutes + exercise.sets * (1 + (exercise.rest ?? 90) / 60) + 1.75, 0))
export const repTarget = (exercise: Exercise) => exercise.repMin && exercise.repMin !== exercise.reps ? `${exercise.repMin}–${exercise.reps}` : String(exercise.reps)
export const clockTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
