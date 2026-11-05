import { currentProgramName, currentProgramVersion, initialDays, readStored } from './data'

// Run once before React mounts so a returning browser also receives the new plan.
export function activateCurrentProgram() {
  if (readStored<string>('program-version', '') === currentProgramVersion) return
  try {
    const keys = ['days', 'selected', 'program-name', 'custom-program-name', 'session']
    const previous = Object.fromEntries(keys.map(key => [key, readStored(key, null)]))
    if (previous.days || previous.session) {
      localStorage.setItem('form:program-backup:before-v-taper-1', JSON.stringify({ savedAt: Date.now(), ...previous }))
    }
    localStorage.setItem('form:days', JSON.stringify(initialDays))
    localStorage.setItem('form:program-name', JSON.stringify(currentProgramName))
    localStorage.setItem('form:custom-program-name', 'false')
    localStorage.setItem('form:selected', '3')
    localStorage.setItem('form:session', 'null')
    localStorage.setItem('form:program-version', JSON.stringify(currentProgramVersion))
  } catch { /* The default V-Taper plan also works when browser storage is unavailable. */ }
}
