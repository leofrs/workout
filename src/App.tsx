import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BookOpen, Check, CheckCheck,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, Dumbbell, Flame, HelpCircle, History,
  LayoutGrid, ListFilter, Menu, MoreHorizontal, Play, Plus, Search, Settings2,
  StickyNote, Target, Timer, Trash2, TrendingUp, Trophy, X,
} from 'lucide-react'
import { Anatomy } from './components/Anatomy'
import { ExerciseArt } from './components/ExerciseArt'
import { Modal } from './components/Modal'
import { ProgramExplanation } from './components/ProgramExplanation'
import { ExercisePrescription } from './components/ExercisePrescription'
import { ExerciseMemory } from './components/ExerciseMemory'
import { WorkoutDetails } from './components/WorkoutDetails'
import { BackupManager } from './components/BackupManager'
import { createSession, exerciseVariants, finishRecord, initialLogs, recoverSession, snapshotExercise, switchVariant } from './trainingHistory'
import { analyzeProgram, weekdays } from './programInsights'
import { LanguageSwitcher, matchesTranslatedSearch, useLanguage } from './i18n'
import { catalog, clockTime, commitStored, currentProgramName, duration, initialDays, programDescription, readStored, repTarget, saveStored, totalSets } from './data'
import type { Day, Exercise, ExerciseVariant, LoggedSet, Preferences, RirValue, Session, WorkoutRecord } from './data'

type Page = 'program' | 'library' | 'history'
type Dialog = 'add' | 'preferences' | 'finish' | 'summary' | 'rename' | 'explanation' | 'backup' | null
const muscleColors: Record<string, string> = { Quads: '#c3f47a', Hamstrings: '#a7c58a', Back: '#87a672', Biceps: '#687e5c', Triceps: '#4e6148', Core: '#3d4b39' }

function App() {
  const { locale, t } = useLanguage()
  const [days, setDays] = useState<Day[]>(() => readStored('days', initialDays))
  const [selected, setSelected] = useState(() => {
    const savedSession = readStored<Session | null>('session', null)
    const sessionIndex = days.findIndex(day => day.id === savedSession?.dayId)
    const todayIndex = days.findIndex(day => day.weekday === weekdays[(new Date().getDay() + 6) % 7])
    return sessionIndex >= 0 ? sessionIndex : todayIndex >= 0 ? todayIndex : readStored('selected', 0)
  })
  const [page, setPage] = useState<Page>('program')
  const [preferences, setPreferences] = useState<Preferences>(() => readStored('preferences', { name: 'Alex', unit: 'kg', rest: 90 }))
  const [session, setSession] = useState<Session | null>(() => recoverSession(readStored<Session | null>('session', null), days, preferences.unit, readStored('program-name', currentProgramName), preferences.rest))
  const [history, setHistory] = useState<WorkoutRecord[]>(() => readStored('history', []))
  const [storageError, setStorageError] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [exerciseMenu, setExerciseMenu] = useState<string | null>(null)
  const [programMenu, setProgramMenu] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All muscles')
  const [toast, setToast] = useState<{ message: string; values?: Record<string, string> } | null>(null)
  const [now, setNow] = useState(Date.now())
  const [restUntil, setRestUntil] = useState<number | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [notifications, setNotifications] = useState(false)
  const [programName, setProgramName] = useState(() => readStored('program-name', currentProgramName))
  const [customProgramName, setCustomProgramName] = useState(() => readStored('custom-program-name', false))
  const displayedProgramName = !customProgramName && programName === currentProgramName ? t(programName) : programName
  const [newName, setNewName] = useState('')
  const [summary, setSummary] = useState<WorkoutRecord | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const [feedIndex, setFeedIndex] = useState(0)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const day = days[Math.min(selected, days.length - 1)]
  const active = session?.dayId === day.id
  const category = analyzeProgram([day]).sessions[0].focus
  const scheduledToday = day.weekday === weekdays[(new Date(now).getDay() + 6) % 7]
  const muscles = [...new Set(day.exercises.map(e => e.muscle))]
  const setCount = totalSets(day)
  const doneCount = active ? Object.values(session.logs).flat().filter(s => s.done).length : 0
  const elapsed = session ? Math.max(0, Math.floor((now - session.startedAt) / 1000)) : 0
  const restSeconds = restUntil ? Math.max(0, Math.ceil((restUntil - now) / 1000)) : 0

  useEffect(() => { if (!saveStored('days', days)) setStorageError(true) }, [days])
  useEffect(() => { if (!saveStored('selected', selected)) setStorageError(true) }, [selected])
  useEffect(() => { if (!saveStored('preferences', preferences)) setStorageError(true) }, [preferences])
  useEffect(() => { if (!saveStored('session', session)) setStorageError(true) }, [session])
  useEffect(() => { if (!saveStored('history', history)) setStorageError(true) }, [history])
  useEffect(() => { if (!saveStored('program-name', programName)) setStorageError(true) }, [programName])
  useEffect(() => { if (!saveStored('custom-program-name', customProgramName)) setStorageError(true) }, [customProgramName])
  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), session ? 1000 : 60_000)
    return () => clearInterval(interval)
  }, [session?.startedAt])
  useEffect(() => () => clearTimeout(toastTimeout.current), [])
  useEffect(() => {
    if (!exerciseMenu && !programMenu && !notifications) return
    const close = () => { setExerciseMenu(null); setProgramMenu(false); setNotifications(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [exerciseMenu, programMenu, notifications])

  useEffect(() => {
    setFeedIndex(0)
    if (!active) return
    const frame = requestAnimationFrame(() => {
      const feed = feedRef.current
      if (!feed) return
      const nextIndex = day.exercises.findIndex(exercise => session?.logs[exercise.id]?.some(set => !set.done))
      const card = feed.children[Math.max(0, nextIndex)] as HTMLElement | undefined
      if (card) feed.scrollTop = card.offsetTop
      feed.scrollIntoView({ block: 'start', behavior: 'instant' })
      feed.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [active, day.id, page])

  function scrollToExercise(index: number) {
    const feed = feedRef.current
    const card = feed?.children[index] as HTMLElement | undefined
    if (!feed || !card) return
    feed.scrollTo({ top: card.offsetTop, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  function notify(message: string, values?: Record<string, string>) {
    setToast({ message, values })
    clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 3800)
  }
  function goTo(next: Page) { setPage(next); setMobileNav(false); setSearch(''); setFilter('All muscles') }
  function selectDay(index: number) { setSelected(index); setExpanded(null); setShowNote(false); setExerciseMenu(null) }
  function updateDay(update: (current: Day) => Day) { setDays(current => current.map(d => d.id === day.id ? update(d) : d)) }
  function startSession() {
    if (session) {
      const index = days.findIndex(d => d.id === session.dayId)
      if (index >= 0) selectDay(index)
      setPage('program'); setExpanded(null)
      requestAnimationFrame(() => feedRef.current?.scrollIntoView({ block: 'start' }))
      return
    }
    setSession(createSession(day, preferences.unit, programName, preferences.rest, history))
    setExpanded(null); setNow(Date.now())
  }
  function updateSet(id: string, index: number, patch: Partial<LoggedSet>) {
    setSession(current => {
      if (!current) return null
      const updatedSets = current.logs[id].map((s, i) => {
        if (i !== index) return s
        const next = { ...s, ...patch }
        if ('rir' in patch && patch.rir === undefined) {
          delete next.rir
        }
        return next
      })
      return { ...current, logs: { ...current.logs, [id]: updatedSets } }
    })
    if (patch.done) {
      const exercise = day.exercises.find(exercise => exercise.id === id)
      const rest = exercise?.rest ?? preferences.rest
      const completedAt = Date.now()
      setNow(completedAt)
      setRestUntil(rest > 0 ? completedAt + rest * 1000 : null)
      if (rest === 0) {
        setExpanded(null)
        const nextIndex = day.exercises.findIndex(exercise => exercise.id === id) + 1
        requestAnimationFrame(() => scrollToExercise(nextIndex))
      }
    }
  }
  function chooseVariant(exercise: Exercise, variant: ExerciseVariant) {
    if (active && session.logs[exercise.id]?.some(set => set.done)) return
    updateDay(current => ({ ...current, exercises: current.exercises.map(item => item.id === exercise.id ? { ...item, variantId: variant.id } : item) }))
    if (active) setSession(current => current ? switchVariant(current, exercise, variant, preferences.rest, history) : null)
  }
  function noteExercise(id: string, note: string) {
    setSession(current => current?.details ? { ...current, details: { ...current.details, snapshots: { ...current.details.snapshots, [id]: { ...current.details.snapshots[id], note } } } } : current)
  }
  function addExercise(exercise: Exercise) {
    if (day.exercises.some(e => e.id === exercise.id)) return
    updateDay(d => ({ ...d, exercises: [...d.exercises, { ...exercise }] }))
    if (active) setSession(current => {
      if (!current?.details) return current
      const snapshot = snapshotExercise(exercise, preferences.rest)
      return { ...current, logs: { ...current.logs, [exercise.id]: initialLogs(snapshot, history, current.unit ?? preferences.unit) }, modes: { ...current.modes, [exercise.id]: snapshot.mode }, details: { ...current.details, snapshots: { ...current.details.snapshots, [exercise.id]: snapshot } } }
    })
    notify('{exercise} added to {day}.', { exercise: exercise.name, day: day.name })
  }
  function removeExercise(id: string) {
    if (active && session.logs[id]?.some(set => set.done)) return
    updateDay(d => ({ ...d, exercises: d.exercises.filter(e => e.id !== id) }))
    if (active) setSession(current => {
      if (!current) return null
      const logs = { ...current.logs }; delete logs[id]
      return { ...current, logs }
    })
    setExerciseMenu(null); notify("Exercise removed from this day.")
  }
  function finishSession() {
    if (!session) return
    const record = finishRecord(session, elapsed)
    const next = [record, ...history]
    if (!commitStored({ history: next, session: null }).ok) {
      setStorageError(true)
      notify('Could not save the workout. Your session is still open; export a backup before closing the app.')
      return
    }
    setToast(null); setHistory(next); setSummary(record); setSession(null); setRestUntil(null); setExpanded(null); setDialog('summary')
  }
  const filteredExercises = catalog.filter(e => matchesTranslatedSearch(e.name, search) && (filter === 'All muscles' || e.muscle === filter))
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7) + weekOffset * 7)
  const weekDates = Array.from({ length: 7 }, (_, i) => { const date = new Date(weekStart); date.setDate(date.getDate() + i); return date })
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7)
  const weeklyWorkouts = history.filter(h => h.finishedAt >= weekStart.getTime() && h.finishedAt < weekEnd.getTime())
  const focusedMuscles = [...new Set(day.exercises.map(e => e.muscle))].map(muscle => ({ muscle, sets: day.exercises.filter(e => e.muscle === muscle).reduce((sum, e) => sum + e.sets, 0) })).sort((a, b) => b.sets - a.sets)

  return <div className={`app-shell ${session ? 'has-session' : ''}`}>
    {mobileNav && <div className="nav-scrim" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); goTo('program') }} aria-label={t("FORM home")}><span className="brand-mark"><i /><i /><i /></span>FORM<span className="brand-dot">®</span></a>
      <div className="workspace-label">{t("YOUR WORKSPACE")}</div>
      <nav className="main-nav" aria-label={t("Main navigation")}>
        <button onClick={() => goTo('program')} className={page === 'program' ? 'selected' : ''}><LayoutGrid size={18} />{t("My program")}<span className="nav-active-dot" /></button>
        <button onClick={() => goTo('library')} className={page === 'library' ? 'selected' : ''}><Dumbbell size={18} />{t("Exercise library")}<span className="nav-count">{catalog.length}</span></button>
        <button onClick={() => goTo('history')} className={page === 'history' ? 'selected' : ''}><History size={18} />{t("Workout history")}</button>
      </nav>
      <div className="sidebar-program"><span className="workspace-label">{t("CURRENT PROGRAM")}</span><button onClick={() => goTo('program')}><span className="program-mini-icon"><Dumbbell size={17} /></span><span>{displayedProgramName}<small>{t("4 days a week")}</small></span><ChevronRight size={15} /></button></div>
      <div className="sidebar-bottom">
        <div className="motivation-card"><span className="motivation-icon"><TrendingUp size={20} /></span><h3>{t("Built one rep at a time.")}</h3><p>{t("Small steps. Consistent effort.")}<br />{t("A stronger you.")}</p><span className="motivation-line" /></div>
        <button className="preferences-button" onClick={() => setDialog('preferences')}><Settings2 size={17} />{t("Preferences")}</button>
        <div className="sidebar-footer"><span className="online-dot" />{storageError ? t("Unsaved changes — download a backup") : t("All changes saved locally")}</div>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar">
        <div className="breadcrumb"><button className="mobile-menu icon-button" aria-label={t("Open navigation")} onClick={() => setMobileNav(true)}><Menu size={21} /></button><span>{t("Your workspace")}</span><ChevronRight size={13} /><strong>{page === 'program' ? t("My program") : page === 'library' ? t("Exercise library") : t("Workout history")}</strong></div>
        <div className="topbar-right"><LanguageSwitcher /><span className="today-label">{new Date(now).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="topbar-divider" /><div className="popover-anchor"><button className="icon-button notification-button" aria-label={t("Notifications")} aria-expanded={notifications} onClick={e => { e.stopPropagation(); setNotifications(v => !v) }}><Bell size={18} /><span /></button>{notifications && <div className="popover notification-popover" onClick={e => e.stopPropagation()}><h3>{t("A little reminder")}</h3><p>{t("Consistency starts with showing up. Your next session is ready when you are.")}</p><span><CheckCheck size={14} />{t("You’re all caught up")}</span></div>}</div><button className="avatar" onClick={() => setDialog('preferences')} aria-label={t("Edit profile")}>{preferences.name.slice(0, 1).toUpperCase()}</button></div>
      </header>

      <main>
        {storageError && <div className="persistence-warning" role="alert"><p>{t('Some changes could not be saved in this browser. Keep this page open and download a backup of your current data.')}</p><button className="secondary-button" onClick={() => setDialog('backup')}>{t('Backup and restore')}</button></div>}
        {page === 'program' ? <>
          <div className="page-heading"><div><div className="eyebrow"><span />{t("YOUR TRAINING, WITH INTENTION")}</div><div className="title-row"><h1>{displayedProgramName}</h1><span className="program-badge">{t("4-day program")}</span></div><p>{t(programDescription)}</p></div><div className="heading-actions"><div className="popover-anchor"><button className="secondary-button square-button" aria-label={t("Program options")} aria-expanded={programMenu} onClick={e => { e.stopPropagation(); setProgramMenu(v => !v) }}><MoreHorizontal size={20} /></button>{programMenu && <div className="popover menu-popover" onClick={e => e.stopPropagation()}><button onClick={() => { setNewName(displayedProgramName); setDialog('rename'); setProgramMenu(false) }}><StickyNote size={15} />{t("Rename program")}</button><button onClick={() => { setPage('history'); setProgramMenu(false) }}><History size={15} />{t("View workout history")}</button></div>}</div><button className="primary-button heading-start" onClick={() => active ? setDialog('finish') : startSession()} disabled={!session && !day.exercises.length}>{active ? <Check size={16} /> : <Play size={15} fill="currentColor" />}{active ? t("Finish workout") : session ? t("Resume workout") : t("Start workout")}<ArrowUpRight size={17} /></button></div></div>

          <section className="workout-hero" aria-label={t('{day} workout overview', { day: t(day.name) })}>
            <div className="hero-copy"><div className="hero-eyebrow"><span className="lime-dot" />{scheduledToday ? t("TODAY’S WORKOUT") : t("SELECTED WORKOUT")}</div><h2>{t("Day")} {selected + 1}<span> / </span>{t(day.name)}</h2><p>{t(day.label)}.</p><div className="hero-stats"><span><Dumbbell size={15} />{day.exercises.length} {t("exercises")}</span><i /><span><Clock3 size={15} />{duration(day)} min</span></div><div className="focus-tags">{[t(category), t("Strength")].map(tag => <span key={tag}>{tag}</span>)}</div></div>
            <div className="hero-figure"><div className="figure-glow" /><Anatomy muscles={muscles} /></div>
            <span className="hero-watermark">FORM</span>
          </section>

          <div className="day-tabs" role="tablist" aria-label={t("Workout days")}>{days.map((d, i) => <button key={d.id} id={`tab-${d.id}`} role="tab" aria-selected={selected === i} aria-controls="day-panel" className={`day-tab ${selected === i ? 'active' : ''}`} onClick={() => selectDay(i)} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const next = (i + (e.key === 'ArrowRight' ? 1 : days.length - 1)) % days.length; selectDay(next); document.getElementById(`tab-${days[next].id}`)?.focus() } }} tabIndex={selected === i ? 0 : -1}><div className="day-tab-top"><span>{t("DAY 0")}{i + 1}</span><span className="day-indicator">{history.some(h => h.dayId === d.id) ? <Check size={11} /> : selected === i ? <span /> : null}</span></div><h3>{t(d.name)}</h3><span className="day-tab-weekday">{t(d.weekday)}</span><div className="day-tab-bottom"><span>{d.exercises.length} {t("exercises")}</span><span>~{duration(d)} min</span></div></button>)}</div>

          <div className="dashboard-grid" id="day-panel" role="tabpanel" aria-labelledby={`tab-${day.id}`}>
            <div className="workout-column">
              <section className={`exercise-section ${active ? 'training-section' : ''}`}><div className="section-heading"><div><h2>{t("Exercises")}<span>{day.exercises.length.toString().padStart(2, '0')}</span></h2><p>{t("One exercise at a time. Scroll down to keep going.")}</p></div><button className="add-exercise-button" onClick={() => { setSearch(''); setFilter('All muscles'); setDialog('add') }}><Plus size={16} />{t("Add exercise")}</button></div>
                <button className={`workout-note-button ${showNote ? 'note-open' : ''}`} onClick={() => setShowNote(v => !v)}><StickyNote size={15} /><span>{day.note ? t("View workout note") : t("Add a workout note")}{day.note && <span className="note-dot" />}</span><ChevronDown size={14} /></button>
                {showNote && <div className="note-field"><textarea aria-label={t("Workout note")} placeholder={t("How are you feeling? Add a cue, a goal, or a reminder…")} value={day.note} onChange={e => {
                  const note = e.target.value
                  updateDay(d => ({ ...d, note }))
                  if (active) setSession(current => current?.details ? { ...current, details: { ...current.details, note } } : current)
                }} maxLength={2000} /><span>{t("Saved automatically")}</span></div>}
                {active && <div className="feed-toolbar"><div><button className="icon-button" aria-label={t('Back to workout overview')} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowLeft size={17} /></button><span className="live-dot" /><strong>{t('Exercise {current} of {total}', { current: feedIndex + 1, total: day.exercises.length })}</strong><span>{doneCount}/{setCount} {t('sets completed')}</span></div><div><button className="icon-button" aria-label={t('Previous exercise')} disabled={feedIndex === 0} onClick={() => scrollToExercise(feedIndex - 1)}><ChevronLeft size={18} /></button><button className="icon-button" aria-label={t('Next exercise')} disabled={feedIndex >= day.exercises.length - 1} onClick={() => scrollToExercise(feedIndex + 1)}><ChevronRight size={18} /></button></div></div>}
                <div className={`exercise-list ${active ? 'training-feed' : 'feed-preview'}`} ref={feedRef} key={day.id} role={active ? 'region' : undefined} aria-label={active ? t('Workout exercise feed') : undefined} tabIndex={active ? 0 : undefined} onScroll={event => {
                  const feed = event.currentTarget
                  const cards = Array.from(feed.children) as HTMLElement[]
                  const visibleHeight = (card: HTMLElement) => Math.max(0, Math.min(card.offsetTop + card.offsetHeight, feed.scrollTop + feed.clientHeight) - Math.max(card.offsetTop, feed.scrollTop))
                  const visibleIndex = cards.reduce((best, card, index) => visibleHeight(card) > visibleHeight(cards[best]) ? index : best, 0)
                  setFeedIndex(visibleIndex)
                }}>{day.exercises.map((exercise, index) => {
                  const isExpanded = expanded === exercise.id
                  const logs = active ? session.logs[exercise.id] : undefined
                  const snapshot = (active ? session.details?.snapshots[exercise.id] : undefined) ?? snapshotExercise(exercise, preferences.rest)
                  const timed = snapshot.mode === 'seconds'
                  const allDone = !!logs?.length && logs.every(s => s.done)
                  return <article key={exercise.id} data-exercise-id={exercise.id} aria-label={t(exercise.name)} className={`exercise-card ${isExpanded ? 'expanded' : ''} ${allDone ? 'exercise-done' : ''}`}>
                    <div className="feed-art" role="img" aria-label={t('Illustration of {exercise}', { exercise: t(exercise.name) })}><ExerciseArt kind={exercise.kind} /><span className="feed-art-category">{t(category)}</span><span className="feed-art-number">{String(index + 1).padStart(2, '0')} / {String(day.exercises.length).padStart(2, '0')}</span>{allDone && <span className="feed-art-done"><CheckCheck size={15} />{t('Completed')}</span>}</div>
                    <div className="exercise-card-main"><span className="exercise-number">{allDone ? <Check size={14} /> : (index + 1).toString().padStart(2, '0')}</span><button className="exercise-open" aria-label={`${isExpanded ? t("Collapse") : t("Expand")} ${t(exercise.name)}`} aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded ? null : exercise.id)}><div className="exercise-copy"><h3>{t(exercise.name)}</h3><ExercisePrescription exercise={exercise} /></div></button><span className="muscle-tag">{t(exercise.muscle)}</span><div className="popover-anchor exercise-options"><button className="icon-button" aria-label={t('Options for {exercise}', { exercise: t(exercise.name) })} onClick={e => { e.stopPropagation(); setExerciseMenu(exerciseMenu === exercise.id ? null : exercise.id) }}><MoreHorizontal size={19} /></button>{exerciseMenu === exercise.id && <div className="popover menu-popover" onClick={e => e.stopPropagation()}><button onClick={() => { setExpanded(exercise.id); setExerciseMenu(null) }}><Settings2 size={15} />{active ? t("Log sets") : t("Edit sets & reps")}</button><button disabled={index === 0 || !!active} onClick={() => { updateDay(d => { const exercises = [...d.exercises]; [exercises[index - 1], exercises[index]] = [exercises[index], exercises[index - 1]]; return { ...d, exercises } }); setExerciseMenu(null) }}><ArrowUpRight size={15} />{t("Move up")}</button><button className="danger-text" disabled={!!active && !!logs?.some(set => set.done)} onClick={() => removeExercise(exercise.id)}><Trash2 size={15} />{t("Remove exercise")}</button></div>}</div><button className="icon-button exercise-chevron" aria-label={t('{action} details for {exercise}', { action: isExpanded ? t('Hide') : t('Show'), exercise: t(exercise.name) })} onClick={() => setExpanded(isExpanded ? null : exercise.id)}><ChevronDown size={16} className={isExpanded ? 'rotated' : ''} /></button></div>
                    {(isExpanded || active) && <div className="exercise-details">{logs ? <>{exercise.timedAlternative && <label className="logging-mode">{t('Logging mode')}<select aria-label={t('Logging mode')} value={timed ? 'seconds' : 'reps'} disabled={logs.some(set => set.done)} onChange={event => {
                      const mode = event.target.value as 'reps' | 'seconds'
                      const variant = exerciseVariants(exercise).find(variant => variant.mode === mode)
                      if (variant) chooseVariant(exercise, variant)
                    }}><option value="reps">{t('Hanging leg raise (reps)')}</option><option value="seconds">{t('Plank (seconds)')}</option></select></label>}<div className={`set-table ${timed ? 'set-table-timed' : 'set-table-reps'}`}><div className="set-table-header"><span>{t("SET")}</span><span>{t("WEIGHT (")}{preferences.unit})</span><span>{timed ? t("SECONDS") : t("REPS")}</span>{!timed && <span>{t("RIR")}</span>}<span>{t("DONE")}</span></div>{logs.map((set, setIndex) => <div className={`set-table-row ${set.done ? 'set-done' : ''}`} key={setIndex}><span>{setIndex + 1}</span><input type="number" min="0" max="2000" step="0.5" placeholder="0" disabled={timed} aria-label={t('{exercise} set {set} weight', { exercise: t(exercise.name), set: setIndex + 1 })} value={set.weight} onChange={e => updateSet(exercise.id, setIndex, { weight: e.target.value })} /><input type="number" min="1" max="999" aria-label={t(timed ? '{exercise} set {set} seconds' : '{exercise} set {set} reps', { exercise: t(exercise.name), set: setIndex + 1 })} value={set.reps} onChange={e => updateSet(exercise.id, setIndex, { reps: e.target.value })} />{!timed && <select className="set-rir-select" aria-label={t('{exercise} set {set} RIR', { exercise: t(exercise.name), set: setIndex + 1 })} value={set.rir ?? ''} onChange={e => { const val = e.target.value as RirValue | ''; updateSet(exercise.id, setIndex, { rir: val ? val : undefined }) }}><option value="">—</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4+">4+</option><option value="unknown">{t("Don't know")}</option></select>}<button className="set-checkbox" aria-label={t('{action} {exercise} set {set}', { action: set.done ? t('Unmark') : t('Complete'), exercise: t(exercise.name), set: setIndex + 1 })} aria-pressed={set.done} disabled={!set.done && (!set.reps || Number(set.reps) < 1 || Number(set.weight) < 0 || Number(set.weight) > 2000 || Number(set.reps) > 999 || !Number.isInteger(Number(set.reps)))} onClick={() => updateSet(exercise.id, setIndex, { done: !set.done })}><Check size={16} /></button></div>)}</div><p className="set-helper">{t("For bodyweight movements, leave weight at 0.")}</p>{!timed && isExpanded && <details className="rir-guide"><summary><HelpCircle size={13} /><span>{t("What is RIR? Repetitions in Reserve guide")}</span></summary><div className="rir-guide-content"><p>{t("RIR is your personal estimate of how many more clean repetitions you could have performed before failure or technical breakdown. It is completely optional and subjective — never train to failure just to test or guess this number.")}</p><div className="rir-examples"><div><span className="rir-badge">0</span><p>{t("0 reps in reserve — maximum effort with proper form. Could not complete another rep safely.")}</p></div><div><span className="rir-badge">1</span><p>{t("1 rep in reserve — very hard. Could complete exactly 1 more rep with good technique.")}</p></div><div><span className="rir-badge">2</span><p>{t("2 reps in reserve — hard, effective stimulus. 2 more reps possible before losing form.")}</p></div><div><span className="rir-badge">3</span><p>{t("3 reps in reserve — moderate effort. 3 more reps left.")}</p></div><div><span className="rir-badge">4+</span><p>{t("4 or more reps in reserve — light set or warm-up.")}</p></div><div><span className="rir-badge">{t("Don't know")}</span><p>{t("Unsure — completely normal, especially when starting a new movement or load.")}</p></div><div><span className="rir-badge">—</span><p>{t("Blank / optional — leave blank whenever you prefer not to rate effort.")}</p></div></div><p className="rir-evidence-note">{t("Evidence note: Studies show that leaving 1–3 reps in reserve produces muscle growth comparable to training to complete failure, with faster recovery and lower injury risk.")}</p></div></details>}</> : <div className="exercise-edit"><label>{t("Sets")}<select aria-label={t('Sets for {exercise}', { exercise: t(exercise.name) })} value={exercise.sets} disabled={!!session} onChange={e => updateDay(d => ({ ...d, exercises: d.exercises.map(ex => ex.id === exercise.id ? { ...ex, sets: Number(e.target.value) } : ex) }))}>{Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><span>×</span><label>{t("Target reps")}<input type="number" aria-label={t('Target reps for {exercise}', { exercise: t(exercise.name) })} min="1" max="100" value={exercise.reps} disabled={!!session} onChange={e => updateDay(d => ({ ...d, exercises: d.exercises.map(ex => ex.id === exercise.id ? { ...ex, repMin: undefined, reps: Math.min(100, Math.max(1, Number(e.target.value))) } : ex) }))} /></label><span className="edit-saved"><Check size={13} />{t("Auto-saved")}</span></div>}{isExpanded && <div className="exercise-extra-details"><p className="exercise-tip"><Target size={15} /><span>{t(exercise.tip)}</span></p><ExerciseMemory exercise={exercise} snapshot={snapshot} history={history} unit={session?.unit ?? preferences.unit} active={!!active} locked={!!logs?.some(set => set.done)} onVariantChange={variant => chooseVariant(exercise, variant)} onNoteChange={note => noteExercise(exercise.id, note)} /></div>}</div>}
                    {active && <div className="feed-card-footer"><span>{logs?.filter(set => set.done).length ?? 0}/{exercise.sets} {t('sets completed')}</span><button className="text-button" onClick={() => index < day.exercises.length - 1 ? scrollToExercise(index + 1) : setDialog('finish')}>{index < day.exercises.length - 1 ? t('Next exercise') : t('Review workout')}{index < day.exercises.length - 1 ? <ArrowDown size={15} /> : <CheckCheck size={15} />}</button></div>}
                  </article>
                })}</div>
                {!day.exercises.length && <div className="empty-state"><Dumbbell size={28} /><h3>{t("Make this day your own.")}</h3><p>{t("Add your first exercise to get started.")}</p><button className="primary-button" onClick={() => setDialog('add')}><Plus size={16} />{t("Add exercise")}</button></div>}
                <div className="workout-list-footer"><span><CheckCheck size={15} />{t("A little stronger than yesterday.")}</span><span>{setCount} {t("total sets")}</span></div>
              </section>
            </div>

            <aside className="insights-column" aria-label={t("Workout insights")}>
              <section className="insight-card week-card"><div className="card-heading"><h3>{t("Your week")}</h3><div className="week-controls"><button className="icon-button" aria-label={t("Previous week")} onClick={() => setWeekOffset(v => v - 1)}><ChevronLeft size={14} /></button><button className="icon-button" aria-label={t("Next week")} onClick={() => setWeekOffset(v => v + 1)}><ChevronRight size={14} /></button></div></div><p className="week-range">{weekDates[0].toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {weekDates[6].toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</p><div className="week-calendar">{weekDates.map((date, i) => {
                const completed = history.some(h => new Date(h.finishedAt).toDateString() === date.toDateString())
                const isToday = date.toDateString() === new Date(now).toDateString()
                const planned = days.some(day => day.weekday === weekdays[i] && day.exercises.length > 0)
                return <div className={`calendar-day ${isToday ? 'today' : ''} ${planned ? 'planned' : ''} ${completed ? 'completed' : ''}`} key={i} title={`${date.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}${completed ? t(" — workout completed") : planned ? t(" — training day") : t(" — rest day")}`}><span>{date.toLocaleDateString(locale, { weekday: 'narrow' })}</span><div>{completed ? <Check size={14} /> : date.getDate()}</div><i /></div>
              })}</div><div className="week-progress"><div><span><strong>{weeklyWorkouts.length}</strong>{t("/ 4 workouts")}</span><span>{weeklyWorkouts.length >= 4 ? t("Goal reached!") : t("Keep showing up")}</span></div><div className="progress-track"><span style={{ width: `${Math.min(100, weeklyWorkouts.length / 4 * 100)}%` }} /></div></div></section>

              <section className={`insight-card session-card ${active ? 'session-active' : ''}`}><div className="card-heading"><h3>{active ? t("Workout in progress") : t("Session overview")}</h3><span className="small-icon"><Timer size={17} /></span></div>{active && <div className="active-session-time"><span className="live-dot" />{clockTime(elapsed)}<span>{t("elapsed")}</span></div>}<div className="session-stats"><div><span>{t("EXERCISES")}</span><strong>{day.exercises.length.toString().padStart(2, '0')}<Dumbbell size={17} /></strong></div><div><span>{t("TOTAL SETS")}</span><strong>{active ? `${doneCount}/${setCount}` : setCount}<LayoutGrid size={16} /></strong></div></div><div className="session-time"><Clock3 size={16} /><span>{active ? t("Every rep counts. You’ve got this.") : t("Estimated duration")}{!active && <strong>~{duration(day)} min</strong>}</span></div>{active && <div className="progress-track session-progress"><span style={{ width: `${setCount ? doneCount / setCount * 100 : 0}%` }} /></div>}<button className="primary-button session-start" disabled={!session && !day.exercises.length} onClick={() => active ? setDialog('finish') : startSession()}>{active ? <Check size={15} /> : <Play size={14} fill="currentColor" />}{active ? t("Finish workout") : session ? t("Resume workout") : t("Let’s get started")}<ArrowRight size={17} /></button><p className="session-footnote">{active ? t("Your sets are saved as you go.") : t("Your only competition is you.")}</p></section>

              <section className="insight-card muscle-card"><div className="card-heading"><h3>{t("Muscle focus")}</h3><Target size={17} /></div><p>{t("A balanced approach to getting stronger.")}</p><div className="muscle-distribution">{focusedMuscles.map(({ muscle, sets }, i) => <span key={muscle} style={{ width: `${sets / setCount * 100}%`, background: muscleColors[muscle] || ['#c3f47a', '#a7c58a', '#87a672', '#687e5c', '#4e6148', '#3d4b39'][i % 6] }} title={`${t(muscle)}: ${sets} ${t("sets")}`} />)}</div><div className="muscle-legend">{focusedMuscles.map(({ muscle, sets }, i) => <div key={muscle}><span><i style={{ background: muscleColors[muscle] || ['#c3f47a', '#a7c58a', '#87a672', '#687e5c', '#4e6148', '#3d4b39'][i % 6] }} />{t(muscle)}</span><span>{sets} {t("sets")}</span></div>)}</div></section>
              <div className="rest-reminder"><span><Flame size={16} /></span><p>{t("Progress happens between sessions, too.")}<br /><strong>{t("Recover well. Come back stronger.")}</strong></p></div>
            </aside>
          </div>
          <section className="program-explainer" aria-label={t('About your training split')}>
            <span className="program-mini-icon"><BookOpen size={20} /></span>
            <div><h2>{t('A purpose behind every training day.')}</h2><p>{t('Understand your split, its muscle focus, and how it fits your goal and routine.')}</p></div>
            <button className="secondary-button" onClick={() => setDialog('explanation')}><BookOpen size={16} />{t('Understand your program')}<ArrowRight size={15} /></button>
          </section>
        </> : page === 'library' ? <>
          <div className="page-heading"><div><div className="eyebrow"><span />{t("FIND YOUR NEXT MOVEMENT")}</div><h1>{t("Exercise library")}</h1><p>{t("Your essentials for building strength, one movement at a time.")}</p></div><span className="program-badge">{catalog.length} {t("movements")}</span></div>
          <div className="library-toolbar"><label className="search-field"><Search size={17} /><input placeholder={t("Search exercises…")} aria-label={t("Search exercise library")} value={search} onChange={e => setSearch(e.target.value)} />{search && <button className="icon-button" aria-label={t("Clear search")} onClick={() => setSearch('')}><X size={15} /></button>}</label><label className="filter-select"><ListFilter size={16} /><select aria-label={t("Filter exercises by muscle")} value={filter} onChange={e => setFilter(e.target.value)}>{['All muscles', ...new Set(catalog.map(e => e.muscle))].map(m => <option key={m} value={m}>{t(m)}</option>)}</select></label></div>
          <div className="library-grid">{filteredExercises.map(exercise => <article className="library-card" key={exercise.id}><div className="library-card-art"><ExerciseArt kind={exercise.kind} /><span className="muscle-tag">{t(exercise.muscle)}</span></div><h3>{t(exercise.name)}</h3><p className="library-equipment">{t(exercise.equipment)} <span>·</span> {exercise.sets} {t("sets")} × {repTarget(exercise)} {t("reps")}{exercise.timedAlternative && ` / ${exercise.timedAlternative}s`} <span>·</span> {exercise.rest === 0 ? t("No rest") : t("Rest: {seconds}s", { seconds: exercise.rest ?? 90 })}</p><p className="library-tip">{t(exercise.tip)}</p><button className="secondary-button" disabled={day.exercises.some(e => e.id === exercise.id)} onClick={() => addExercise(exercise)}>{day.exercises.some(e => e.id === exercise.id) ? <Check size={15} /> : <Plus size={15} />}{day.exercises.some(e => e.id === exercise.id) ? t('In {day}', { day: t(day.name) }) : t('Add to {day}', { day: t(day.name) })}</button></article>)}</div>{!filteredExercises.length && <div className="empty-state"><Search size={30} /><h3>{t("No exercises found.")}</h3><p>{t("Try a different name or muscle group.")}</p><button className="secondary-button" onClick={() => { setSearch(''); setFilter('All muscles') }}>{t("Clear filters")}</button></div>}
        </> : <>
          <div className="page-heading"><div><div className="eyebrow"><span />{t("EVERY SESSION IS A STEP FORWARD")}</div><h1>{t("Workout history")}</h1><p>{t("A record of the work you put in. Be proud of your progress.")}</p></div><span className="program-badge">{history.length} {t("sessions")}</span></div>
          <div className="history-toolbar"><button className="secondary-button" onClick={() => setDialog('backup')}>{t('Backup and restore')}</button><span>{t('View a session to inspect its exercises and sets.')}</span></div>
          <div className="history-stats"><div className="insight-card"><Dumbbell size={21} /><span>{t("WORKOUTS COMPLETED")}</span><strong>{history.length}</strong></div><div className="insight-card"><Clock3 size={21} /><span>{t("MINUTES TRAINED")}</span><strong>{Math.round(history.reduce((sum, h) => sum + h.seconds, 0) / 60)}</strong></div><div className="insight-card"><TrendingUp size={21} /><span>{t("SETS COMPLETED")}</span><strong>{history.reduce((sum, h) => sum + h.sets, 0)}</strong></div></div>
          {history.length ? <div className="history-list">{history.map(record => <article className="history-record" key={record.id}><div className="history-record-icon"><CheckCheck size={23} /></div><div><h3>{t(record.name)}</h3><span className="history-detail-badge">{record.details ? t("Detailed history") : t("Summary only")}</span><p>{new Date(record.finishedAt).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p></div><div className="history-record-stats"><span><Clock3 size={14} />{clockTime(record.seconds)}</span><span><Dumbbell size={14} />{record.sets} {t("sets")}</span><span>{record.volume.toLocaleString(locale)} {record.unit}</span></div><button className="icon-button" aria-label={t('View {day} summary', { day: t(record.name) })} onClick={() => { setSummary(record); setDialog('summary') }}><ArrowUpRight size={20} /></button></article>)}</div> : <div className="empty-state history-empty"><span className="empty-state-art"><History size={36} /></span><h2>{t("Your story starts with one session.")}</h2><p>{t("Finish your first workout and you’ll find it here.")}<br />{t("Future you will thank you for showing up.")}</p><button className="primary-button" onClick={() => goTo('program')}>{t("Go to my program")}<ArrowRight size={16} /></button></div>}
        </>}
        <footer className="page-footer"><span>{t("Made for the work you put in.")}</span><span>{t("YOUR PLAN. YOUR PACE.")}<span className="footer-mark">F↗</span></span></footer>
      </main>
    </div>

    {session && <div className="active-workout-bar"><button className="active-workout-label" onClick={startSession}><span className="live-dot" /><strong>{t(session.name)}</strong><span>{clockTime(elapsed)}</span><ArrowUpRight size={15} /></button>{restSeconds > 0 ? <div className="rest-timer" role="timer" aria-label={t("Rest timer")}><Timer size={15} /><span>{t("Rest")} <strong>{clockTime(restSeconds)}</strong></span><button onClick={() => setRestUntil(null)}>{t("Skip")}<X size={13} /></button></div> : <span className="rest-ready">{t("Ready for your next set.")}</span>}<button className="primary-button" onClick={() => setDialog('finish')}>{t("Finish")}<Check size={15} /></button></div>}

    {toast && <div className="toast" role="status"><span><Check size={15} /></span>{t(toast.message, Object.fromEntries(Object.entries(toast.values ?? {}).map(([key, value]) => [key, t(value)])))}<button className="icon-button" aria-label={t("Dismiss notification")} onClick={() => setToast(null)}><X size={15} /></button></div>}

    {dialog === 'backup' && <BackupManager data={{ days, history, preferences, session, programName, customProgramName, selected }} onClose={() => setDialog(null)} />}

    {dialog === 'explanation' && <ProgramExplanation days={days} name={displayedProgramName} onClose={() => setDialog(null)} />}

    {dialog === 'add' && <Modal title={t("Build your workout")} onClose={() => setDialog(null)} wide><p className="modal-intro">{t('Add a movement to Day {number} · {day}.', { number: selected + 1, day: t(day.name) })}</p><div className="modal-search"><label className="search-field"><Search size={17} /><input placeholder={t("Search exercises…")} aria-label={t("Search exercises to add")} value={search} onChange={e => setSearch(e.target.value)} autoFocus /></label><select aria-label={t("Filter available exercises")} value={filter} onChange={e => setFilter(e.target.value)}>{['All muscles', ...new Set(catalog.map(e => e.muscle))].map(m => <option key={m} value={m}>{t(m)}</option>)}</select></div><div className="add-exercise-list">{filteredExercises.map(exercise => { const added = day.exercises.some(e => e.id === exercise.id); return <div className="add-exercise-row" key={exercise.id}><ExerciseArt kind={exercise.kind} /><div><h3>{t(exercise.name)}</h3><p>{t(exercise.muscle)} · {t(exercise.equipment)} · {exercise.sets} × {repTarget(exercise)}</p></div><button className={`icon-button ${added ? 'added-check' : 'add-plus'}`} aria-label={added ? t('{exercise} already added', { exercise: t(exercise.name) }) : t('Add {exercise}', { exercise: t(exercise.name) })} disabled={added} onClick={() => addExercise(exercise)}>{added ? <Check size={18} /> : <Plus size={18} />}</button></div> })}{!filteredExercises.length && <p className="no-results">{t("No movements found. Try another search.")}</p>}</div><div className="modal-footer"><span>{day.exercises.length} {t("exercises in this workout")}</span><button className="primary-button" onClick={() => { setDialog(null); setSearch(''); setFilter('All muscles') }}>{t("Done")}<Check size={15} /></button></div></Modal>}

    {dialog === 'preferences' && <Modal title={t("Make it yours")} onClose={() => setDialog(null)}><p className="modal-intro">{t("A few details for your training space.")}</p><div className="preferences-form"><label>{t("Your name")}<input value={preferences.name} maxLength={30} placeholder={t("Your name")} onChange={e => setPreferences(p => ({ ...p, name: e.target.value }))} /></label><label>{t("Weight unit")}<select value={preferences.unit} disabled={!!session} onChange={e => setPreferences(p => ({ ...p, unit: e.target.value as 'kg' | 'lb' }))}><option value="kg">{t("Kilograms (kg)")}</option><option value="lb">{t("Pounds (lb)")}</option></select>{session && <small>{t("Finish your current session to change units.")}</small>}</label><label>{t("Rest between sets")}<select value={preferences.rest} onChange={e => setPreferences(p => ({ ...p, rest: Number(e.target.value) }))}><option value={30}>{t("30 seconds")}</option><option value={60}>{t("60 seconds")}</option><option value={90}>{t("90 seconds")}</option><option value={120}>{t("2 minutes")}</option><option value={180}>{t("3 minutes")}</option></select></label></div><div className="storage-note"><CheckCheck size={17} /><p>{t("Your program and workouts are saved in this browser. No account needed.")}</p></div><button className="primary-button full-width" onClick={() => { setDialog(null); notify("Preferences saved. Make yourself at home.") }}>{t("Save preferences")}<Check size={16} /></button></Modal>}

    {dialog === 'rename' && <Modal title={t("Name your program")} onClose={() => setDialog(null)}><p className="modal-intro">{t("Give your training plan a name that feels like you.")}</p><form onSubmit={e => { e.preventDefault(); if (newName.trim()) { setProgramName(newName.trim()); setCustomProgramName(true); setDialog(null); notify("Program name updated.") } }}><label className="form-label">{t("Program name")}<input autoFocus maxLength={40} value={newName} onChange={e => setNewName(e.target.value)} required /></label><button className="primary-button full-width" type="submit">{t("Save name")}<Check size={15} /></button></form></Modal>}

    {dialog === 'finish' && session && <Modal title={t("Ready to call it a workout?")} onClose={() => setDialog(null)}><p className="modal-intro">{t("Every bit of effort adds up. Here’s your session so far.")}</p><div className="finish-stats"><div><Timer size={22} /><strong>{clockTime(elapsed)}</strong><span>{t("Time trained")}</span></div><div><CheckCheck size={22} /><strong>{Object.values(session.logs).flat().filter(s => s.done).length}</strong><span>{t("Sets completed")}</span></div></div>{Object.values(session.logs).flat().some(s => s.done) ? <p className="finish-message">{t("Your completed sets will be saved to your workout history.")}</p> : <p className="finish-message">{t("You haven’t logged any sets yet. You can keep training or discard this session.")}</p>}<button className="primary-button full-width" onClick={() => { if (Object.values(session.logs).flat().some(s => s.done)) finishSession(); else { setSession(null); setRestUntil(null); setDialog(null); notify("Session discarded. Your program is ready for next time.") } }}>{Object.values(session.logs).flat().some(s => s.done) ? t("Save & finish workout") : t("Discard empty session")}<Check size={16} /></button><button className="text-button full-width" onClick={() => setDialog(null)}><ArrowLeft size={15} />{t("Keep training")}</button></Modal>}

    {dialog === 'summary' && summary && <Modal title={t("That’s work well done.")} onClose={() => setDialog(null)} wide={!!summary.details}><div className="summary-art"><Trophy size={39} /></div><h3 className="summary-title">{t("You showed up for yourself.")}</h3><p className="summary-subtitle">{t(summary.name)} · {new Date(summary.finishedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</p><div className="summary-stats"><div><strong>{clockTime(summary.seconds)}</strong><span>{t("Duration")}</span></div><div><strong>{summary.sets}</strong><span>{t("Sets logged")}</span></div><div><strong>{summary.volume.toLocaleString(locale)}<small>{summary.unit}</small></strong><span>{t("Total volume")}</span></div></div><WorkoutDetails record={summary} /><p className="summary-message">{t("Give yourself a moment. Rest up, refuel, and come back a little stronger.")}</p><button className="primary-button full-width" onClick={() => { setDialog(null); goTo('history') }}>{t("View workout history")}<ArrowRight size={16} /></button></Modal>}
  </div>
}

export default App
