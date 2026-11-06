import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BookOpen, Check, CheckCheck,
  ChevronLeft, ChevronRight, Clock3, Dumbbell, History,
  LayoutGrid, ListFilter, Maximize2, Menu, Minimize2, MoreHorizontal, Play, Plus, Search, Settings2,
  StickyNote, Timer, TrendingUp, Trophy, X,
} from 'lucide-react'
import { ExerciseArt } from './components/ExerciseArt'
import { RestTimer } from './components/RestTimer'
import { Modal } from './components/Modal'
import { ProgramExplanation } from './components/ProgramExplanation'
import { WorkoutDetails } from './components/WorkoutDetails'
import { BackupManager } from './components/BackupManager'
import { createSession, finishRecord, recoverSession, snapshotExercise } from './trainingHistory'
import { analyzeProgram, weekdays } from './programInsights'
import { LanguageSwitcher, matchesTranslatedSearch, useLanguage } from './i18n'
import { ThemeToggle } from './theme'
import { catalog, clockTime, commitStored, currentProgramName, duration, initialDays, readStored, repTarget, saveStored, totalSets } from './data'
import type { Day, Exercise, Preferences, Session, WorkoutRecord } from './data'

type Page = 'program' | 'library' | 'history'
type Dialog = 'preferences' | 'finish' | 'summary' | 'rename' | 'explanation' | 'backup' | null
type Rest = { sessionStartedAt: number; until: number; nextExerciseId: string; nextSet: number; duration?: number }

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
  const [workoutOpen, setWorkoutOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [programMenu, setProgramMenu] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All muscles')
  const [toast, setToast] = useState<{ message: string; values?: Record<string, string> } | null>(null)
  const [now, setNow] = useState(Date.now())
  const [rest, setRest] = useState<Rest | null>(() => {
    const saved = readStored<Rest | null>('rest', null)
    return saved?.sessionStartedAt === session?.startedAt ? saved : null
  })
  const [notifications, setNotifications] = useState(false)
  const [programName, setProgramName] = useState(() => readStored('program-name', currentProgramName))
  const [customProgramName, setCustomProgramName] = useState(() => readStored('custom-program-name', false))
  const displayedProgramName = !customProgramName && programName === currentProgramName ? t(programName) : programName
  const [newName, setNewName] = useState('')
  const [summary, setSummary] = useState<WorkoutRecord | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const nextSetRef = useRef<Rest | null>(null)
  const [feedIndex, setFeedIndex] = useState(0)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const day = days[Math.min(selected, days.length - 1)]
  const active = session?.dayId === day.id
  const fullscreen = focusMode && active && workoutOpen && page === 'program'
  const category = analyzeProgram([day]).sessions[0].focus
  const trainingDays = days.map((day, index) => ({ day, index })).filter(({ day }) => day.exercises.length > 0)
  const setCount = totalSets(day)
  const doneCount = active ? Object.values(session.logs).flat().filter(s => s.done).length : 0
  const elapsed = session ? Math.max(0, Math.floor((now - session.startedAt) / 1000)) : 0
  const restSeconds = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0
  const nextRestExercise = rest ? days.find(day => day.id === session?.dayId)?.exercises.find(exercise => exercise.id === rest.nextExerciseId) : undefined

  useEffect(() => { if (!saveStored('days', days)) setStorageError(true) }, [days])
  useEffect(() => { if (!saveStored('selected', selected)) setStorageError(true) }, [selected])
  useEffect(() => { if (!saveStored('preferences', preferences)) setStorageError(true) }, [preferences])
  useEffect(() => { if (!saveStored('session', session)) setStorageError(true) }, [session])
  useEffect(() => { if (!saveStored('history', history)) setStorageError(true) }, [history])
  useEffect(() => { if (!saveStored('rest', rest)) setStorageError(true) }, [rest])
  useEffect(() => { if (!saveStored('program-name', programName)) setStorageError(true) }, [programName])
  useEffect(() => { if (!saveStored('custom-program-name', customProgramName)) setStorageError(true) }, [customProgramName])
  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), session ? 1000 : 60_000)
    return () => clearInterval(interval)
  }, [session?.startedAt])
  useEffect(() => () => clearTimeout(toastTimeout.current), [])
  useEffect(() => {
    if (!fullscreen) return
    document.documentElement.classList.add('workout-is-fullscreen')
    const exit = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !rest && !dialog) setFocusMode(false)
    }
    document.addEventListener('keydown', exit)
    return () => {
      document.documentElement.classList.remove('workout-is-fullscreen')
      document.removeEventListener('keydown', exit)
    }
  }, [fullscreen, rest, dialog])
  useEffect(() => {
    if (!programMenu && !notifications) return
    const close = () => { setProgramMenu(false); setNotifications(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [programMenu, notifications])

  useEffect(() => {
    if (!workoutOpen || page !== 'program' || rest) return
    setFeedIndex(0)
    const frame = requestAnimationFrame(() => {
      const feed = feedRef.current
      if (!feed) return
      const nextSet = nextSetRef.current
      const nextIndex = day.exercises.findIndex(exercise => nextSet ? exercise.id === nextSet.nextExerciseId : session?.logs[exercise.id]?.some(set => !set.done))
      const card = feed.children[Math.max(0, nextIndex)] as HTMLElement | undefined
      if (card) feed.scrollTop = card.offsetTop
      if (active) {
        feed.scrollIntoView({ block: 'start', behavior: 'instant' })
        const button = nextSet ? feed.querySelector<HTMLElement>(`[data-exercise-id="${nextSet.nextExerciseId}"] .set-complete-button[data-set-index="${nextSet.nextSet}"]`) : null
        const focusTarget = button ?? feed
        focusTarget.focus({ preventScroll: true })
        nextSetRef.current = null
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [active, day.id, page, workoutOpen, rest, fullscreen])

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
  function goTo(next: Page) { setFocusMode(false); setPage(next); setWorkoutOpen(false); setMobileNav(false); setSearch(''); setFilter('All muscles') }
  function leaveWorkout() { setFocusMode(false); setWorkoutOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }) }
  function selectDay(index: number) { setSelected(index); setWorkoutOpen(true); setFeedIndex(0); window.scrollTo({ top: 0, behavior: 'instant' }) }
  function updateDay(update: (current: Day) => Day) { setDays(current => current.map(d => d.id === day.id ? update(d) : d)) }
  function startSession() {
    setFocusMode(true)
    setMobileNav(false)
    if (session) {
      const index = days.findIndex(d => d.id === session.dayId)
      if (index >= 0) selectDay(index)
      setPage('program')
      requestAnimationFrame(() => feedRef.current?.scrollIntoView({ block: 'start' }))
      return
    }
    // A completion-only session uses the prescription without borrowing previous loads.
    setSession(createSession(day, preferences.unit, programName, preferences.rest, []))
    setNow(Date.now())
  }
  function continueAfterRest() {
    nextSetRef.current = rest
    setRest(null)
    if (!session) return
    const index = days.findIndex(day => day.id === session.dayId)
    if (index >= 0) selectDay(index)
    setPage('program')
  }
  function toggleSet(id: string, index: number) {
    if (!active || !session.logs[id]?.[index] || rest) return
    const original = session.logs[id][index]
    const exercise = session.details?.snapshots[id]?.prescription ?? day.exercises.find(exercise => exercise.id === id)!
    const timed = (session.details?.snapshots[id]?.mode ?? session.modes?.[id]) === 'seconds'
    const logs = { ...session.logs, [id]: session.logs[id].map((set, i) => i !== index ? set : original.done ? { ...set, done: false } : { weight: '', reps: String(timed ? exercise.timedAlternative ?? exercise.reps : exercise.reps), done: true }) }
    setSession({ ...session, logs })
    if (original.done) return
    const exerciseIndex = day.exercises.findIndex(exercise => exercise.id === id)
    const unfinished = (exercise: Exercise) => logs[exercise.id]?.some(set => !set.done)
    const restDuration = exercise.rest ?? preferences.rest
    // Supersets alternate A1 and A2 before the rest after A2.
    const paired = restDuration === 0 ? day.exercises[exerciseIndex + 1] : day.exercises[exerciseIndex - 1]?.rest === 0 ? day.exercises[exerciseIndex - 1] : undefined
    const next = paired && unfinished(paired) ? paired : unfinished(day.exercises[exerciseIndex]) ? day.exercises[exerciseIndex] : [...day.exercises.slice(exerciseIndex + 1), ...day.exercises.slice(0, exerciseIndex)].find(unfinished)
    if (!next) { setDialog('finish'); return }
    if (restDuration === 0) { requestAnimationFrame(() => scrollToExercise(day.exercises.indexOf(next))); return }
    const completedAt = Date.now()
    setNow(completedAt)
    setRest({ sessionStartedAt: session.startedAt, until: completedAt + restDuration * 1000, duration: restDuration, nextExerciseId: next.id, nextSet: logs[next.id].findIndex(set => !set.done) + 1 })
  }
  function addExercise(exercise: Exercise) {
    if (session) { notify('Finish your current workout before changing the program.'); return }
    if (day.exercises.some(e => e.id === exercise.id)) return
    updateDay(d => ({ ...d, exercises: [...d.exercises, { ...exercise }] }))
    notify('{exercise} added to {day}.', { exercise: exercise.name, day: day.name })
  }
  function finishSession() {
    if (!session) return
    const record = finishRecord(session, elapsed)
    const next = [record, ...history]
    if (!commitStored({ history: next, session: null, rest: null }).ok) {
      setStorageError(true)
      notify('Could not save the workout. Your session is still open; export a backup before closing the app.')
      return
    }
    setFocusMode(false); setToast(null); setHistory(next); setSummary(record); setSession(null); setRest(null); setDialog('summary')
  }
  const filteredExercises = catalog.filter(e => matchesTranslatedSearch(e.name, search) && (filter === 'All muscles' || e.muscle === filter))

  return <div className={`app-shell ${session ? 'has-session' : ''} ${fullscreen ? 'is-workout-fullscreen' : ''}`}>
    {mobileNav && <div className="nav-scrim" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); goTo('program') }} aria-label={t("FORM home")}><span className="brand-mark"><i /><i /><i /></span>FORM<span className="brand-dot">®</span></a>
      <div className="workspace-label">{t("YOUR WORKSPACE")}</div>
      <nav className="main-nav" aria-label={t("Main navigation")}>
        <button onClick={() => goTo('program')} className={page === 'program' ? 'selected' : ''}><LayoutGrid size={18} />{t("My program")}<span className="nav-active-dot" /></button>
        <button onClick={() => goTo('library')} className={page === 'library' ? 'selected' : ''}><Dumbbell size={18} />{t("Exercise library")}<span className="nav-count">{catalog.length}</span></button>
        <button onClick={() => goTo('history')} className={page === 'history' ? 'selected' : ''}><History size={18} />{t("Workout history")}</button>
      </nav>
      <div className="sidebar-program"><span className="workspace-label">{t("CURRENT PROGRAM")}</span><button onClick={() => goTo('program')}><span className="program-mini-icon"><Dumbbell size={17} /></span><span>{displayedProgramName}<small>{t('{count} training days', { count: trainingDays.length })}</small></span><ChevronRight size={15} /></button></div>
      <div className="sidebar-bottom">
        <div className="motivation-card"><span className="motivation-icon"><TrendingUp size={20} /></span><h3>{t("Built one rep at a time.")}</h3><p>{t("Small steps. Consistent effort.")}<br />{t("A stronger you.")}</p><span className="motivation-line" /></div>
        <button className="preferences-button" onClick={() => setDialog('preferences')}><Settings2 size={17} />{t("Preferences")}</button>
        <div className="sidebar-footer"><span className="online-dot" />{storageError ? t("Unsaved changes — download a backup") : t("All changes saved locally")}</div>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar">
        <div className="breadcrumb"><button className="mobile-menu icon-button" aria-label={t("Open navigation")} onClick={() => setMobileNav(true)}><Menu size={21} /></button><span>{t("Your workspace")}</span><ChevronRight size={13} /><strong>{page === 'program' ? t("My program") : page === 'library' ? t("Exercise library") : t("Workout history")}</strong></div>
        <div className="topbar-right">{!fullscreen && <><ThemeToggle /><LanguageSwitcher /></>}<span className="today-label">{new Date(now).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="topbar-divider" /><div className="popover-anchor"><button className="icon-button notification-button" aria-label={t("Notifications")} aria-expanded={notifications} onClick={e => { e.stopPropagation(); setNotifications(v => !v) }}><Bell size={18} /><span /></button>{notifications && <div className="popover notification-popover" onClick={e => e.stopPropagation()}><h3>{t("A little reminder")}</h3><p>{t("Consistency starts with showing up. Your next session is ready when you are.")}</p><span><CheckCheck size={14} />{t("You’re all caught up")}</span></div>}</div><button className="avatar" onClick={() => setDialog('preferences')} aria-label={t("Edit profile")}>{preferences.name.slice(0, 1).toUpperCase()}</button></div>
      </header>

      <main>
        {storageError && <div className="persistence-warning" role="alert"><p>{t('Some changes could not be saved in this browser. Keep this page open and download a backup of your current data.')}</p><button className="secondary-button" onClick={() => setDialog('backup')}>{t('Backup and restore')}</button></div>}
        {page === 'program' ? <>
          <div className="page-heading"><div><div className="eyebrow"><span />{t("YOUR TRAINING, WITH INTENTION")}</div><h1>{workoutOpen ? t(day.weekday) : displayedProgramName}</h1><p>{workoutOpen ? t(day.name) : t('Choose a training day to get started.')}</p></div><div className="heading-actions"><div className="popover-anchor"><button className="secondary-button square-button" aria-label={t("Program options")} aria-expanded={programMenu} onClick={e => { e.stopPropagation(); setProgramMenu(v => !v) }}><MoreHorizontal size={20} /></button>{programMenu && <div className="popover menu-popover" onClick={e => e.stopPropagation()}><button onClick={() => { setNewName(displayedProgramName); setDialog('rename'); setProgramMenu(false) }}><StickyNote size={15} />{t("Rename program")}</button><button onClick={() => { setDialog('explanation'); setProgramMenu(false) }}><BookOpen size={15} />{t('Understand your program')}</button></div>}</div></div></div>
          {!workoutOpen ? <section className="training-days" aria-label={t('Your training days')}>
            {trainingDays.map(({ day: trainingDay, index }) => {
              const isToday = trainingDay.weekday === weekdays[(new Date(now).getDay() + 6) % 7]
              const inProgress = session?.dayId === trainingDay.id
              return <button key={trainingDay.id} className={`training-day-card ${isToday ? 'is-today' : ''}`} onClick={() => selectDay(index)}>
                <div className="training-day-top"><span className="program-mini-icon"><Dumbbell size={22} /></span>{inProgress ? <span className="training-day-badge"><span className="live-dot" />{t('In progress')}</span> : isToday ? <span className="training-day-badge">{t('Today')}</span> : null}</div>
                <h2>{t(trainingDay.weekday)}</h2><h3>{t(trainingDay.name)}</h3><p>{t(trainingDay.label)}</p>
                <div className="training-day-stats"><span>{trainingDay.exercises.length} {t('exercises')}</span><span><Clock3 size={14} />~{duration(trainingDay)} min</span></div>
                <div className="training-day-link">{inProgress ? t('Resume workout') : t('View workout')}<ArrowRight size={18} /></div>
              </button>
            })}
            {!trainingDays.length && <div className="empty-state"><Dumbbell size={28} /><h2>{t('No active training days yet.')}</h2><p>{t('Add exercises from the library to build your first day.')}</p><button className="primary-button" onClick={() => goTo('library')}>{t('Exercise library')}<ArrowRight size={16} /></button></div>}
          </section> : <div className="daily-workout">
            {fullscreen && <header className="workout-focus-header">
              <div className="workout-focus-top"><button className="icon-button" aria-label={t('Exit full screen')} title={t('Exit full screen')} onClick={() => setFocusMode(false)}><Minimize2 size={20} /></button><div className="workout-focus-title"><h1>{t(day.weekday)}</h1><p>{t(day.name)}</p></div><ThemeToggle /><LanguageSwitcher /></div>
              <div className="workout-focus-summary"><div className="workout-elapsed"><span className="workout-clock-icon"><Clock3 size={22} /></span><div><span>{t('Workout duration')}</span><output aria-label={t('Workout duration')} aria-live="off">{clockTime(elapsed)}</output></div></div><div className="workout-focus-progress"><span>{t('{done} of {total} sets completed', { done: doneCount, total: setCount })}</span><progress aria-label={t('Sets completed')} max={Math.max(1, setCount)} value={doneCount} /></div><button className="primary-button" aria-label={t('Finish workout')} onClick={() => setDialog('finish')}><CheckCheck size={18} />{t('Finish')}</button></div>
            </header>}
            <div className="daily-workout-actions"><button className="secondary-button" onClick={leaveWorkout}><ArrowLeft size={16} />{t('All training days')}</button><span>{day.exercises.length} {t('exercises')} · {setCount} {t('sets')}</span>{active && <button className="secondary-button" onClick={() => setFocusMode(true)}><Maximize2 size={16} />{t('Full screen')}</button>}</div>
            <section className="daily-start-panel"><div><span className="eyebrow">{t(category)}</span><h2>{active ? t('Workout in progress') : t('Your workout is ready.')}</h2><p>{active ? t('{done} of {total} sets completed', { done: doneCount, total: setCount }) : t('Follow the prescribed sets and mark each one complete.')}</p></div><button className="primary-button daily-start" onClick={() => active ? setDialog('finish') : startSession()} disabled={!session && !day.exercises.length}>{active ? <CheckCheck size={20} /> : <Play size={20} fill="currentColor" />}{active ? t('Finish workout') : session ? t('Resume workout') : t('Start workout')}<ArrowRight size={19} /></button></section>
            <section className={`exercise-section ${active ? 'training-section' : ''}`}>
              <div className="feed-toolbar"><div><button className="icon-button" aria-label={t('Back to training days')} onClick={leaveWorkout}><ArrowLeft size={17} /></button>{active && <span className="live-dot" />}<strong>{t('Exercise {current} of {total}', { current: feedIndex + 1, total: day.exercises.length })}</strong><span>{active ? `${doneCount}/${setCount} ${t('sets completed')}` : t('Your daily exercises')}</span></div><div><button className="icon-button" aria-label={t('Previous exercise')} disabled={feedIndex === 0} onClick={() => scrollToExercise(feedIndex - 1)}><ChevronLeft size={18} /></button><button className="icon-button" aria-label={t('Next exercise')} disabled={feedIndex >= day.exercises.length - 1} onClick={() => scrollToExercise(feedIndex + 1)}><ChevronRight size={18} /></button></div></div>
              <div className="exercise-list training-feed simple-feed" ref={feedRef} key={day.id} role="region" aria-label={t('Workout exercise feed')} tabIndex={0} onScroll={event => {
                const feed = event.currentTarget
                const cards = Array.from(feed.children) as HTMLElement[]
                const visibleHeight = (card: HTMLElement) => Math.max(0, Math.min(card.offsetTop + card.offsetHeight, feed.scrollTop + feed.clientHeight) - Math.max(card.offsetTop, feed.scrollTop))
                setFeedIndex(cards.reduce((best, card, index) => visibleHeight(card) > visibleHeight(cards[best]) ? index : best, 0))
              }}>{day.exercises.map((exercise, index) => {
                const logs = active ? session.logs[exercise.id] : undefined
                const snapshot = (active ? session.details?.snapshots[exercise.id] : undefined) ?? snapshotExercise(exercise, preferences.rest)
                const prescription = snapshot.prescription
                const timed = snapshot.mode === 'seconds'
                const target = timed ? `${prescription.timedAlternative ?? prescription.reps} ${t('seconds')}` : `${repTarget(prescription)} ${t('reps')}`
                const allDone = !!logs?.length && logs.every(set => set.done)
                return <article key={exercise.id} data-exercise-id={exercise.id} aria-label={t(exercise.name)} className={`exercise-card ${allDone ? 'exercise-done' : ''}`}>
                  <div className="feed-art"><ExerciseArt exercise={prescription} mode={snapshot.mode} /><span className="feed-art-category">{t(exercise.muscle)}</span><span className="feed-art-number">{String(index + 1).padStart(2, '0')} / {String(day.exercises.length).padStart(2, '0')}</span>{allDone && <span className="feed-art-done"><CheckCheck size={15} />{t('Completed')}</span>}</div>
                  <div className="simple-exercise-heading"><h3>{t(exercise.name)}</h3><p><strong>{logs?.length ?? prescription.sets} {t('sets')}</strong><span>×</span>{target}{prescription.perSide && <span>· {t('per side')}</span>}</p>{prescription.technique && <small>{t(prescription.technique)}</small>}</div>
                  <div className="simple-set-list">{Array.from({ length: logs?.length ?? prescription.sets }, (_, setIndex) => {
                    const done = logs?.[setIndex].done ?? false
                    return <button key={setIndex} data-set-index={setIndex + 1} className={`set-complete-button ${done ? 'is-complete' : ''}`} aria-label={t('{action} {exercise} set {set}', { action: done ? t('Unmark') : t('Complete'), exercise: t(exercise.name), set: setIndex + 1 })} aria-pressed={done} disabled={!active || !!rest} onClick={() => toggleSet(exercise.id, setIndex)}><span className="set-number">{setIndex + 1}</span><span>{t('Set {number}', { number: setIndex + 1 })}<small>{target}</small></span><span className="set-complete-label">{done ? t('Completed') : t('Complete set')}</span><span className="set-check"><Check size={18} /></span></button>
                  })}{!active && <p className="set-helper">{t(session ? 'Resume your current workout to complete sets.' : 'Start the workout to complete your sets.')}</p>}</div>
                  <div className="feed-card-footer"><span>{logs?.filter(set => set.done).length ?? 0}/{logs?.length ?? prescription.sets} {t('sets completed')}</span><button className="text-button" disabled={index === day.exercises.length - 1 && !active} onClick={() => index < day.exercises.length - 1 ? scrollToExercise(index + 1) : setDialog('finish')}>{index < day.exercises.length - 1 ? t('Next exercise') : t('Review workout')}{index < day.exercises.length - 1 ? <ArrowDown size={15} /> : <CheckCheck size={15} />}</button></div>
                </article>
              })}</div>
            </section>
          </div>}
        </> : page === 'library' ? <>
          <div className="page-heading"><div><div className="eyebrow"><span />{t("FIND YOUR NEXT MOVEMENT")}</div><h1>{t("Exercise library")}</h1><p>{t("Your essentials for building strength, one movement at a time.")}</p></div><span className="program-badge">{catalog.length} {t("movements")}</span></div>
          <div className="library-toolbar"><label className="search-field"><Search size={17} /><input placeholder={t("Search exercises…")} aria-label={t("Search exercise library")} value={search} onChange={e => setSearch(e.target.value)} />{search && <button className="icon-button" aria-label={t("Clear search")} onClick={() => setSearch('')}><X size={15} /></button>}</label><label className="filter-select"><ListFilter size={16} /><select aria-label={t("Filter exercises by muscle")} value={filter} onChange={e => setFilter(e.target.value)}>{['All muscles', ...new Set(catalog.map(e => e.muscle))].map(m => <option key={m} value={m}>{t(m)}</option>)}</select></label></div>
          <div className="library-grid">{filteredExercises.map(exercise => <article className="library-card" key={exercise.id}><div className="library-card-art"><ExerciseArt exercise={exercise} /><span className="muscle-tag">{t(exercise.muscle)}</span></div><h3>{t(exercise.name)}</h3><p className="library-equipment">{t(exercise.equipment)} <span>·</span> {exercise.sets} {t("sets")} × {repTarget(exercise)} {t("reps")}{exercise.timedAlternative && ` / ${exercise.timedAlternative}s`} <span>·</span> {exercise.rest === 0 ? t("No rest") : t("Rest: {seconds}s", { seconds: exercise.rest ?? 90 })}</p><p className="library-tip">{t(exercise.tip)}</p><button className="secondary-button" disabled={!!session || day.exercises.some(e => e.id === exercise.id)} onClick={() => addExercise(exercise)}>{day.exercises.some(e => e.id === exercise.id) ? <Check size={15} /> : <Plus size={15} />}{day.exercises.some(e => e.id === exercise.id) ? t('In {day}', { day: t(day.name) }) : t('Add to {day}', { day: t(day.name) })}</button></article>)}</div>{!filteredExercises.length && <div className="empty-state"><Search size={30} /><h3>{t("No exercises found.")}</h3><p>{t("Try a different name or muscle group.")}</p><button className="secondary-button" onClick={() => { setSearch(''); setFilter('All muscles') }}>{t("Clear filters")}</button></div>}
        </> : <>
          <div className="page-heading"><div><div className="eyebrow"><span />{t("EVERY SESSION IS A STEP FORWARD")}</div><h1>{t("Workout history")}</h1><p>{t("A record of the work you put in. Be proud of your progress.")}</p></div><span className="program-badge">{history.length} {t("sessions")}</span></div>
          <div className="history-toolbar"><button className="secondary-button" onClick={() => setDialog('backup')}>{t('Backup and restore')}</button><span>{t('View a session to inspect its exercises and sets.')}</span></div>
          <div className="history-stats"><div className="insight-card"><Dumbbell size={21} /><span>{t("WORKOUTS COMPLETED")}</span><strong>{history.length}</strong></div><div className="insight-card"><Clock3 size={21} /><span>{t("MINUTES TRAINED")}</span><strong>{Math.round(history.reduce((sum, h) => sum + h.seconds, 0) / 60)}</strong></div><div className="insight-card"><TrendingUp size={21} /><span>{t("SETS COMPLETED")}</span><strong>{history.reduce((sum, h) => sum + h.sets, 0)}</strong></div></div>
          {history.length ? <div className="history-list">{history.map(record => <article className="history-record" key={record.id}><div className="history-record-icon"><CheckCheck size={23} /></div><div><h3>{t(record.name)}</h3><span className="history-detail-badge">{record.details ? t("Detailed history") : t("Summary only")}</span><p>{new Date(record.finishedAt).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p></div><div className="history-record-stats"><span><Clock3 size={14} />{clockTime(record.seconds)}</span><span><Dumbbell size={14} />{record.sets} {t("sets")}</span><span>{record.volume.toLocaleString(locale)} {record.unit}</span></div><button className="icon-button" aria-label={t('View {day} summary', { day: t(record.name) })} onClick={() => { setSummary(record); setDialog('summary') }}><ArrowUpRight size={20} /></button></article>)}</div> : <div className="empty-state history-empty"><span className="empty-state-art"><History size={36} /></span><h2>{t("Your story starts with one session.")}</h2><p>{t("Finish your first workout and you’ll find it here.")}<br />{t("Future you will thank you for showing up.")}</p><button className="primary-button" onClick={() => goTo('program')}>{t("Go to my program")}<ArrowRight size={16} /></button></div>}
        </>}
        <footer className="page-footer"><span>{t("Made for the work you put in.")}</span><span>{t("YOUR PLAN. YOUR PACE.")}<span className="footer-mark">F↗</span></span></footer>
      </main>
    </div>

    {session && <div className="active-workout-bar"><button className="active-workout-label" onClick={startSession}><span className="live-dot" /><strong>{t(session.name)}</strong><span>{clockTime(elapsed)}</span><ArrowUpRight size={15} /></button><span className="rest-ready">{t('Your sets are saved as you go.')}</span><button className="primary-button" onClick={() => setDialog('finish')}>{t('Finish')}<Check size={15} /></button></div>}

    {rest && session && <Modal title={t(restSeconds > 0 ? 'Time to rest' : 'Rest complete')} onClose={continueAfterRest}>
      <div className={`rest-dialog ${restSeconds === 0 ? 'rest-finished' : ''}`}><p role="status">{t(restSeconds > 0 ? 'Set completed. Take a breath.' : 'Ready for your next set.')}</p><RestTimer key={rest.until} remaining={restSeconds} duration={rest.duration ?? restSeconds} />{nextRestExercise && <div className="rest-next"><span>{t('Up next')}</span><strong>{t(nextRestExercise.name)}</strong><small>{t('Set {number}', { number: rest.nextSet })}</small></div>}<button className="primary-button full-width" onClick={continueAfterRest}>{t(restSeconds > 0 ? 'Skip rest' : 'Continue workout')}<ArrowRight size={18} /></button></div>
    </Modal>}

    {toast && <div className="toast" role="status"><span><Check size={15} /></span>{t(toast.message, Object.fromEntries(Object.entries(toast.values ?? {}).map(([key, value]) => [key, t(value)])))}<button className="icon-button" aria-label={t("Dismiss notification")} onClick={() => setToast(null)}><X size={15} /></button></div>}

    {dialog === 'backup' && <BackupManager data={{ days, history, preferences, session, programName, customProgramName, selected }} onClose={() => setDialog(null)} />}

    {dialog === 'explanation' && <ProgramExplanation days={days} name={displayedProgramName} onClose={() => setDialog(null)} />}

    {dialog === 'preferences' && <Modal title={t("Make it yours")} onClose={() => setDialog(null)}><p className="modal-intro">{t("A few details for your training space.")}</p><div className="preferences-form"><label>{t("Your name")}<input value={preferences.name} maxLength={30} placeholder={t("Your name")} onChange={e => setPreferences(p => ({ ...p, name: e.target.value }))} /></label><label>{t("Weight unit")}<select value={preferences.unit} disabled={!!session} onChange={e => setPreferences(p => ({ ...p, unit: e.target.value as 'kg' | 'lb' }))}><option value="kg">{t("Kilograms (kg)")}</option><option value="lb">{t("Pounds (lb)")}</option></select>{session && <small>{t("Finish your current session to change units.")}</small>}</label><label>{t("Rest between sets")}<select value={preferences.rest} onChange={e => setPreferences(p => ({ ...p, rest: Number(e.target.value) }))}><option value={30}>{t("30 seconds")}</option><option value={60}>{t("60 seconds")}</option><option value={90}>{t("90 seconds")}</option><option value={120}>{t("2 minutes")}</option><option value={180}>{t("3 minutes")}</option></select></label></div><div className="storage-note"><CheckCheck size={17} /><p>{t("Your program and workouts are saved in this browser. No account needed.")}</p></div><button className="primary-button full-width" onClick={() => { setDialog(null); notify("Preferences saved. Make yourself at home.") }}>{t("Save preferences")}<Check size={16} /></button></Modal>}

    {dialog === 'rename' && <Modal title={t("Name your program")} onClose={() => setDialog(null)}><p className="modal-intro">{t("Give your training plan a name that feels like you.")}</p><form onSubmit={e => { e.preventDefault(); if (newName.trim()) { setProgramName(newName.trim()); setCustomProgramName(true); setDialog(null); notify("Program name updated.") } }}><label className="form-label">{t("Program name")}<input autoFocus maxLength={40} value={newName} onChange={e => setNewName(e.target.value)} required /></label><button className="primary-button full-width" type="submit">{t("Save name")}<Check size={15} /></button></form></Modal>}

    {dialog === 'finish' && session && <Modal title={t("Ready to call it a workout?")} onClose={() => setDialog(null)}><p className="modal-intro">{t("Every bit of effort adds up. Here’s your session so far.")}</p><div className="finish-stats"><div><Timer size={22} /><strong>{clockTime(elapsed)}</strong><span>{t("Time trained")}</span></div><div><CheckCheck size={22} /><strong>{Object.values(session.logs).flat().filter(s => s.done).length}</strong><span>{t("Sets completed")}</span></div></div>{Object.values(session.logs).flat().some(s => s.done) ? <p className="finish-message">{t("Your completed sets will be saved to your workout history.")}</p> : <p className="finish-message">{t("You haven’t logged any sets yet. You can keep training or discard this session.")}</p>}<button className="primary-button full-width" onClick={() => { if (Object.values(session.logs).flat().some(s => s.done)) finishSession(); else { setFocusMode(false); setSession(null); setRest(null); setDialog(null); notify("Session discarded. Your program is ready for next time.") } }}>{Object.values(session.logs).flat().some(s => s.done) ? t("Save & finish workout") : t("Discard empty session")}<Check size={16} /></button><button className="text-button full-width" onClick={() => setDialog(null)}><ArrowLeft size={15} />{t("Keep training")}</button></Modal>}

    {dialog === 'summary' && summary && <Modal title={t("That’s work well done.")} onClose={() => setDialog(null)} wide={!!summary.details}><div className="summary-art"><Trophy size={39} /></div><h3 className="summary-title">{t("You showed up for yourself.")}</h3><p className="summary-subtitle">{t(summary.name)} · {new Date(summary.finishedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</p><div className="summary-stats"><div><strong>{clockTime(summary.seconds)}</strong><span>{t("Duration")}</span></div><div><strong>{summary.sets}</strong><span>{t("Sets logged")}</span></div><div><strong>{summary.volume.toLocaleString(locale)}<small>{summary.unit}</small></strong><span>{t("Total volume")}</span></div></div><WorkoutDetails record={summary} /><p className="summary-message">{t("Give yourself a moment. Rest up, refuel, and come back a little stronger.")}</p><button className="primary-button full-width" onClick={() => { setDialog(null); goTo('history') }}>{t("View workout history")}<ArrowRight size={16} /></button></Modal>}
  </div>
}

export default App
