import { useRef } from 'react'
import { CheckCheck, Timer } from 'lucide-react'
import { clockTime } from '../data'
import { useLanguage } from '../i18n'

export function RestTimer({ remaining, duration }: { remaining: number; duration: number }) {
  const { t } = useLanguage()
  // Keep a stable scale even when recovering a legacy rest without a duration.
  const total = useRef(Math.max(1, duration, remaining)).current
  const complete = remaining === 0
  const offset = complete ? 0 : 100 * (1 - Math.min(1, remaining / total))

  return <div className={`rest-timer-display ${complete ? 'is-complete' : ''}`}>
    <svg className="rest-timer-ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle className="rest-timer-track" cx="60" cy="60" r="54" />
      <circle className="rest-timer-progress" cx="60" cy="60" r="54" pathLength="100" strokeDasharray="100" strokeDashoffset={offset} />
    </svg>
    <div className="rest-timer-face">
      {complete ? <CheckCheck size={24} aria-hidden="true" /> : <Timer size={24} aria-hidden="true" />}
      <div className="rest-countdown" role="timer" aria-label={t('Rest timer')} aria-live="off">{clockTime(remaining)}</div>
      <span>{t(complete ? 'Ready to continue' : 'Rest remaining')}</span>
    </div>
  </div>
}
