import { useEffect, useState } from 'react'
import { CalendarDays, CheckCheck, Clock3, Target } from 'lucide-react'
import { programDescription, programGuidelines, readStored, saveStored } from '../data'
import type { Day } from '../data'
import { useLanguage } from '../i18n'
import { analyzeProgram } from '../programInsights'
import { Modal } from './Modal'

type TrainingContext = { goal: '' | 'muscle' | 'strength' | 'consistency'; days: string; minutes: string }
const emptyContext: TrainingContext = { goal: '', days: '', minutes: '' }
const goals = {
  muscle: 'Building muscle: distributing your sets across the week gives you a clear way to organize work for each muscle. The breakdown below shows which muscles receive the most direct work in your current plan.',
  strength: 'Building strength: recurring movements give you opportunities to compare the weights and reps you log. Your split organizes practice; the loads and progression still need to match your goal.',
  consistency: 'Building consistency: having a defined focus for each day makes it easier to know what to train next. A schedule you can repeat matters, so compare this plan with your available days and time below.',
}
const sessionRoles: Record<string, string> = {
  'Upper body': 'Groups upper-body exercises into a focused session, leaving lower-body work to other days.',
  'Lower body': 'Gives lower-body exercises their own session, separate from the upper-body sessions.',
  'Full body': 'Combines upper- and lower-body work in one session, adding another weekly session for both regions.',
  Core: 'Concentrates the session on core exercises.',
}

export function ProgramExplanation({ days, name, onClose }: { days: Day[]; name: string; onClose: () => void }) {
  const { t } = useLanguage()
  const [context, setContext] = useState<TrainingContext>(() => readStored('training-context', emptyContext))
  useEffect(() => saveStored('training-context', context), [context])
  const insights = analyzeProgram(days)
  const overTime = context.minutes ? insights.active.filter(session => session.minutes > Number(context.minutes)) : []

  return <Modal title={t('Understand your program')} onClose={onClose} wide>
    <p className="modal-intro">{t('See how {program} organizes your training and how it fits your routine.', { program: name })}</p>
    <div className="storage-note"><Target size={17} /><div><p>{t(programDescription)}</p><p className="mt-1 font-semibold">{t('Source: treino_v_taper.md')}</p></div></div>

    <section className="explanation-section" aria-labelledby="split-heading">
      <h3 id="split-heading"><CalendarDays size={17} />{t('The logic behind your split')}</h3>
      <div className="explanation-stats">
        <div><strong>{insights.active.length}</strong><span>{t('training days / week')}</span></div>
        <div><strong>{insights.totalSets}</strong><span>{t('planned sets / week')}</span></div>
        <div><strong>{insights.restDays.length}</strong><span>{t('days without a session')}</span></div>
      </div>
      {insights.active.length ? <>
        <p>{t('Your current exercises train the upper body in {upper} sessions and the lower body in {lower} sessions each week. Sessions that include both count toward both totals.', { upper: insights.upperSessions, lower: insights.lowerSessions })}</p>
        <p>{t('This spreads the work across different days instead of putting every exercise into one session. The session focus below comes from the exercises currently in your plan.')}</p>
      </> : <p>{t('Your program has no exercises yet. Add movements to see the split, weekly workload, and how it fits your routine.')}</p>}
      {insights.restDays.length > 0 && <p><strong>{t('Days without planned training:')}</strong> {insights.restDays.map(weekday => t(weekday)).join(', ')}. {t('These are spaces in your schedule for recovery or other activities.')}</p>}
    </section>

    <section className="explanation-section" aria-labelledby="context-heading">
      <h3 id="context-heading"><Target size={17} />{t('How it fits you')}</h3>
      <p>{t('Add your goal and availability for a more personal explanation. These optional details are saved in this browser; changing them updates this explanation and keeps your workouts as they are.')}</p>
      <div className="preferences-form explanation-fields">
        <label>{t('Your training goal')}<select aria-label={t('Your training goal')} value={context.goal} onChange={event => setContext(current => ({ ...current, goal: event.target.value as TrainingContext['goal'] }))}>
          <option value="">{t('Choose a goal (optional)')}</option>
          <option value="muscle">{t('Build muscle')}</option><option value="strength">{t('Build strength')}</option><option value="consistency">{t('Build consistency')}</option>
        </select></label>
        <label>{t('Available days per week')}<select aria-label={t('Available days per week')} value={context.days} onChange={event => setContext(current => ({ ...current, days: event.target.value }))}>
          <option value="">{t('Not specified')}</option>{Array.from({ length: 7 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
        </select></label>
        <label>{t('Time per session')}<select aria-label={t('Time per session')} value={context.minutes} onChange={event => setContext(current => ({ ...current, minutes: event.target.value }))}>
          <option value="">{t('Not specified')}</option>{[30, 45, 60, 75, 90, 120].map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}
        </select></label>
      </div>
      <div className="explanation-fit" aria-live="polite" aria-atomic="true">
        {!context.goal && !context.days && !context.minutes && <p>{t('For now, this explanation describes your current program. Choose your goal and routine above to check how they line up with this split.')}</p>}
        {context.goal && <p>{t(goals[context.goal])}</p>}
        {!insights.active.length && (context.days || context.minutes) && <p>{t('Add exercises before assessing whether this program fits your available days and time.')}</p>}
        {insights.active.length > 0 && context.days && <p className={Number(context.days) < insights.active.length ? 'fit-attention' : ''}>{t(Number(context.days) < insights.active.length
          ? 'Your plan has {planned} training days, but you have {available} available. This split exceeds your weekly availability; review the number of sessions to make the routine workable.'
          : 'Your {planned} planned training days fit within your {available} available days per week. This makes the schedule compatible with the availability you entered.', { planned: insights.active.length, available: context.days })}</p>}
        {insights.active.length > 0 && context.minutes && <p className={overTime.length ? 'fit-attention' : ''}>{overTime.length
          ? t('{count} sessions are estimated to exceed your {minutes}-minute limit: {days}. Review their duration or exercise count to fit your routine.', { count: overTime.length, minutes: context.minutes, days: overTime.map(({ day }) => t(day.name)).join(', ') })
          : t('All planned sessions are estimated to fit within your {minutes}-minute limit.', { minutes: context.minutes })} {t('Times are estimates; your pace and rest periods can change them.')}</p>}
      </div>
    </section>

    <section className="explanation-section" aria-labelledby="sessions-heading">
      <h3 id="sessions-heading"><Clock3 size={17} />{t('The role of each session')}</h3>
      <div className="explanation-sessions">{insights.sessions.map(({ day, focus, muscles, sets, minutes }) => <article key={day.id}>
        <div><span>{t(day.weekday)}</span><h4>{t(day.name)}</h4><p>{t(focus)} · {sets} {t('sets')} · ~{minutes} min</p></div>
        <div>{muscles.length ? <>{day.purpose && <p className="mb-2"><strong>{t('Protocol objective:')}</strong> {t(day.purpose)}</p>}<p>{t(sessionRoles[focus])}</p><p className="mt-2">{t('Direct muscle focus: {muscles}.', { muscles: muscles.map(muscle => t(muscle)).join(', ') })}</p></> : <p>{t('Add exercises to define this session’s role.')}</p>}</div>
      </article>)}</div>
    </section>

    {insights.muscles.length > 0 && <section className="explanation-section" aria-labelledby="workload-heading">
      <h3 id="workload-heading">{t('Where your weekly work goes')}</h3>
      <p>{t('More direct sets means more of your plan is dedicated to that muscle. Compare this emphasis with your priorities.')}</p>
      <table className="explanation-table"><caption className="sr-only">{t('Weekly direct sets and sessions by muscle')}</caption><thead><tr><th scope="col">{t('Muscle')}</th><th scope="col">{t('Sets')}</th><th scope="col">{t('Sessions')}</th></tr></thead><tbody>{insights.muscles.map(({ muscle, sets, sessions }) => <tr key={muscle}><th scope="row">{t(muscle)}</th><td>{sets}</td><td>{sessions}</td></tr>)}</tbody></table>
      <p className="explanation-footnote">{t('Counts use each exercise’s primary muscle only. Other muscles may also participate; these numbers do not represent all the work they receive.')}</p>
    </section>}
    <section className="explanation-section" aria-labelledby="protocol-heading"><h3 id="protocol-heading">{t('Protocol guidelines')}</h3><ul className="list-disc space-y-2 pl-4 text-xs leading-6 text-[#687d61]">{programGuidelines.map(guideline => <li key={guideline}>{t(guideline)}</li>)}</ul></section>
    <div className="storage-note"><CheckCheck size={17} /><p>{t('This explanation follows your current exercises, sets, and schedule. It describes the plan’s structure; your goal and availability help you assess its fit, without guaranteeing individual results.')}</p></div>
    <button className="primary-button full-width" onClick={onClose}>{t('Back to my program')}</button>
  </Modal>
}
