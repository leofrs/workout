import { commitStored, currentProgramName, currentProgramVersion, initialDays, readStored } from './data'
import type { Day, Exercise, ExerciseSnapshot, Preferences, Session, WorkoutRecord } from './data'

export type Backup = {
  app: 'FORM'; formatVersion: 1; exportedAt: string
  data: { days: Day[]; history: WorkoutRecord[]; preferences: Preferences; programName: string; customProgramName: boolean; selected: number; programVersion: string; session: Session | null; language: 'en' | 'pt-BR'; trainingContext: unknown; archives: Record<string, unknown> }
}
export type ImportMode = 'history' | 'restore'
export const maxBackupBytes = 5 * 1024 * 1024
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const str = (value: unknown, max = 2000): value is string => typeof value === 'string' && value.length <= max
const num = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
const int = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => num(value, min, max) && Number.isInteger(value)
const unit = (value: unknown) => value === 'kg' || value === 'lb'
const mode = (value: unknown) => value === 'reps' || value === 'seconds'
const unique = (items: { id: string }[]) => new Set(items.map(item => item.id)).size === items.length
function ensure(condition: unknown): asserts condition { if (!condition) throw new Error('Invalid backup file. No data was changed.') }

function safeJSON(value: unknown, depth = 0): boolean {
  if (depth > 30) return false
  if (value === null || typeof value === 'boolean' || str(value, maxBackupBytes) || num(value, -Number.MAX_SAFE_INTEGER)) return true
  if (Array.isArray(value)) return value.every(item => safeJSON(item, depth + 1))
  return isObject(value) && Object.entries(value).every(([key, item]) => !['__proto__', 'constructor', 'prototype'].includes(key) && safeJSON(item, depth + 1))
}

function validExercise(value: unknown): value is Exercise {
  if (!isObject(value)) return false
  return str(value.id, 128) && !!value.id && !['__proto__', 'constructor', 'prototype'].includes(value.id) && str(value.name, 200) && !!value.name && str(value.equipment, 200)
    && ['Shoulders', 'Back', 'Chest', 'Triceps', 'Biceps', 'Quads', 'Hamstrings', 'Calves', 'Core', 'Glutes'].includes(String(value.muscle))
    && ['squat', 'curl', 'press', 'pull', 'raise', 'crunch', 'dip', 'hinge'].includes(String(value.kind))
    && int(value.sets, 1, 8) && int(value.reps, 1, 100) && str(value.tip, 4000)
    && (value.repMin === undefined || int(value.repMin, 1, Number(value.reps)))
    && (value.rest === undefined || int(value.rest, 0, 3600)) && (value.timedAlternative === undefined || int(value.timedAlternative, 1, 999))
    && (value.perSide === undefined || typeof value.perSide === 'boolean') && (value.technique === undefined || str(value.technique, 1000))
    && (value.variantId === undefined || str(value.variantId, 128))
}

function validSnapshot(value: unknown): value is ExerciseSnapshot {
  if (!isObject(value) || !validExercise(value.prescription) || !isObject(value.variant)) return false
  return str(value.variant.id, 128) && !!value.variant.id && str(value.variant.name, 200) && str(value.variant.equipment, 200)
    && (value.variant.mode === undefined || mode(value.variant.mode)) && mode(value.mode)
    && (value.variant.mode === undefined || value.variant.mode === value.mode)
    && (value.mode !== 'seconds' || int(value.prescription.timedAlternative, 1, 999)) && str(value.note)
}

function validLogs(value: unknown): boolean {
  return Array.isArray(value) && value.length <= 8 && value.every(set => isObject(set) && typeof set.done === 'boolean'
    && str(set.weight, 32) && (set.weight === '' || num(Number(set.weight), set.done ? 0 : -1000000, set.done ? 2000 : 1000000))
    && str(set.reps, 32) && (set.done ? int(Number(set.reps), 1, 999) : set.reps === '' || num(Number(set.reps), -1000000, 1000000))
    && (set.rir === undefined || (typeof set.rir === 'string' && ['0', '1', '2', '3', '4+', 'unknown'].includes(set.rir))))
}

function validMetadata(value: Record<string, unknown>) {
  return value.schemaVersion === 1 && str(value.programName, 200) && str(value.programVersion, 128) && str(value.weekday, 32) && str(value.note)
    && (value.recovered === undefined || typeof value.recovered === 'boolean')
}

function validRecord(value: unknown): value is WorkoutRecord {
  if (!isObject(value) || !str(value.id, 128) || !value.id || !str(value.name, 200) || !str(value.dayId, 128) || !num(value.finishedAt, 1, 8640000000000000)
    || !int(value.seconds) || !int(value.sets) || !num(value.volume) || !unit(value.unit) || !int(value.exercises)) return false
  if (value.details === undefined) return true
  const details = value.details
  if (!isObject(details) || !validMetadata(details) || !Array.isArray(details.exercises) || details.exercises.length > 200) return false
  if (!details.exercises.every(exercise => {
    if (!isObject(exercise)) return false
    const logs = exercise.logs
    return validSnapshot(exercise) && validLogs(logs) && (logs as unknown[]).length <= exercise.prescription.sets
  })) return false
  const exercises = details.exercises as (ExerciseSnapshot & { logs: { weight: string; reps: string; done: boolean }[] })[]
  if (new Set(exercises.map(item => item.prescription.id)).size !== exercises.length) return false
  const sets = exercises.flatMap(exercise => exercise.logs.filter(set => set.done))
  const volume = exercises.filter(exercise => exercise.mode !== 'seconds').flatMap(exercise => exercise.logs).filter(set => set.done).reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0)
  return sets.length === value.sets && exercises.filter(exercise => exercise.logs.some(set => set.done)).length === value.exercises && Math.abs(volume - Number(value.volume)) < 0.000001
}

function validSession(value: unknown, days: Day[], preferences: Preferences): value is Session | null {
  if (value === null) return true
  if (!isObject(value) || !str(value.dayId, 128) || !str(value.name, 200) || !num(value.startedAt, 1, 8640000000000000) || !isObject(value.logs)
    || (value.unit !== undefined && value.unit !== preferences.unit)) return false
  const day = days.find(day => day.id === value.dayId)
  if (!day || Object.keys(value.logs).length > 200 || !Object.values(value.logs).every(validLogs)) return false
  if (value.modes !== undefined && (!isObject(value.modes) || !Object.values(value.modes).every(mode))) return false
  if (value.details === undefined) return Object.keys(value.logs).every(id => day.exercises.some(exercise => exercise.id === id))
  const details = value.details
  if (!isObject(details) || !validMetadata(details) || !isObject(details.snapshots) || Object.keys(details.snapshots).length > 200) return false
  if (!Object.entries(details.snapshots).every(([id, snapshot]) => validSnapshot(snapshot) && snapshot.prescription.id === id)) return false
  const snapshots = details.snapshots as Record<string, ExerciseSnapshot>
  return Object.entries(value.logs).every(([id, logs]) => snapshots[id] && (logs as unknown[]).length <= snapshots[id].prescription.sets
    && (!isObject(value.modes) || value.modes[id] === undefined || value.modes[id] === snapshots[id].mode))
}

export function parseBackup(text: string): Backup {
  ensure(new Blob([text]).size <= maxBackupBytes)
  let raw: unknown
  try { raw = JSON.parse(text) } catch { throw new Error('Invalid backup file. No data was changed.') }
  ensure(isObject(raw) && raw.app === 'FORM')
  if (raw.formatVersion !== 1) throw new Error('Unsupported backup version. No data was changed.')
  ensure(safeJSON(raw) && str(raw.exportedAt, 64) && Number.isFinite(Date.parse(raw.exportedAt)) && isObject(raw.data))
  const data = raw.data
  ensure(Array.isArray(data.days) && data.days.length > 0 && data.days.length <= 30)
  ensure(data.days.every(day => isObject(day) && str(day.id, 128) && !!day.id && str(day.name, 200) && str(day.label, 200) && str(day.short, 200)
    && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(String(day.weekday)) && str(day.note)
    && (day.purpose === undefined || str(day.purpose, 2000)) && Array.isArray(day.exercises) && day.exercises.length <= 200 && day.exercises.every(validExercise) && unique(day.exercises)))
  ensure(unique(data.days as Day[]) && Array.isArray(data.history) && data.history.length <= 20000 && data.history.every(validRecord) && unique(data.history as WorkoutRecord[]))
  ensure(isObject(data.preferences) && str(data.preferences.name, 30) && unit(data.preferences.unit) && int(data.preferences.rest, 0, 3600))
  ensure(str(data.programName, 200) && typeof data.customProgramName === 'boolean' && int(data.selected, 0, data.days.length - 1) && str(data.programVersion, 128))
  ensure(data.language === 'en' || data.language === 'pt-BR')
  ensure(data.trainingContext === null || (isObject(data.trainingContext) && ['', 'muscle', 'strength', 'consistency'].includes(String(data.trainingContext.goal))
    && ['', '1', '2', '3', '4', '5', '6', '7'].includes(String(data.trainingContext.days)) && ['', '30', '45', '60', '75', '90', '120'].includes(String(data.trainingContext.minutes))))
  ensure(isObject(data.archives) && Object.keys(data.archives).every(key => key.startsWith('program-backup:') && key.length <= 200))
  ensure(validSession(data.session, data.days as Day[], data.preferences as Preferences))
  return raw as Backup
}

export function createBackup(overrides: Partial<Backup['data']> = {}): Backup {
  let archives: Record<string, unknown> = {}
  try { archives = Object.fromEntries(Object.keys(localStorage).filter(key => key.startsWith('form:program-backup:')).map(key => [key.slice(5), readStored(key.slice(5), null)])) } catch { /* Export in-memory data even when storage is unavailable. */ }
  const backup: Backup = {
    app: 'FORM', formatVersion: 1, exportedAt: new Date().toISOString(),
    data: { days: readStored('days', initialDays), history: readStored('history', []), preferences: readStored('preferences', { name: 'Alex', unit: 'kg', rest: 90 }),
      programName: readStored('program-name', currentProgramName), customProgramName: readStored('custom-program-name', false), selected: readStored('selected', 3),
      programVersion: readStored('program-version', currentProgramVersion), session: readStored('session', null), language: readStored('language', 'en'), trainingContext: readStored('training-context', null), archives, ...overrides },
  }
  return parseBackup(JSON.stringify(backup))
}

export function importPreview(backup: Backup, history: WorkoutRecord[]) {
  const current = new Map(history.map(record => [record.id, record]))
  return {
    added: backup.data.history.filter(record => !current.has(record.id)).length,
    duplicates: backup.data.history.filter(record => current.has(record.id)).length,
    conflicts: backup.data.history.filter(record => current.has(record.id) && JSON.stringify(current.get(record.id)) !== JSON.stringify(record)).length,
  }
}

// Validate everything before writing. Roll back only touched keys on a storage failure.
export function applyBackup(backup: Backup, importMode: ImportMode) {
  const validated = parseBackup(JSON.stringify(backup))
  if (readStored('session', null)) throw new Error('Finish or discard your current session before importing.')
  const history = readStored<WorkoutRecord[]>('history', [])
  const existing = new Set(history.map(record => record.id))
  const merged = [...history, ...validated.data.history.filter(record => !existing.has(record.id))].sort((a, b) => b.finishedAt - a.finishedAt)
  const values: Record<string, unknown> = { history: merged }
  if (importMode === 'restore') {
    const data = validated.data
    Object.assign(values, { days: data.days, selected: data.selected, preferences: data.preferences, 'program-name': data.programName,
      'custom-program-name': data.customProgramName, 'program-version': currentProgramVersion, session: data.session, language: data.language, 'training-context': data.trainingContext })
    for (const [key, value] of Object.entries(data.archives)) if (localStorage.getItem(`form:${key}`) === null) values[key] = value
  }
  const result = commitStored(values)
  if (!result.ok) throw new Error(result.recovered ? 'Import failed. The previous data was restored. Free browser storage and try again.' : 'Import failed and browser storage prevented full recovery. Keep this page open and export a backup before continuing.')
}
