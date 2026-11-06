import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Pause, Play, RefreshCw } from 'lucide-react'
import type { Exercise } from '../data'
import { getExerciseDemo } from '../exerciseMedia'
import type { ExerciseDemo } from '../exerciseMedia'
import { useLanguage } from '../i18n'

export function ExerciseArt({ exercise, mode }: { exercise: Exercise; mode?: 'reps' | 'seconds' }) {
  const { demo, variant } = getExerciseDemo(exercise, mode)
  return <ExerciseAnimation key={`${exercise.id}:${variant.id}`} demo={demo} name={variant.name} tip={exercise.tip} />
}

function ExerciseAnimation({ demo, name, tip }: { demo?: ExerciseDemo; name: string; tip: string }) {
  const { t } = useLanguage()
  const container = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const still = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  // A displayed canvas can freeze a cross-origin GIF without reading/exporting
  // its pixels. The paused view therefore always shows the same exercise.
  function captureFrame() {
    const img = image.current
    const canvas = still.current
    if (!img?.naturalWidth || !canvas) return
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')?.drawImage(img, 0, 0)
  }

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { captureFrame(); setPlaying(!preference.matches) }
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) captureFrame()
      setVisible(entry.isIntersecting && !document.hidden)
    })
    const element = container.current
    if (element) observer.observe(element)
    const update = () => {
      if (document.hidden) { captureFrame(); setVisible(false) }
      else if (element) { observer.unobserve(element); observer.observe(element) }
    }
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  const label = t('Demonstration of {exercise}', { exercise: t(name) })
  const animate = playing && visible
  const failed = !demo || status === 'error'

  return <div className="exercise-art exercise-demo" ref={container} aria-busy={!failed && status === 'loading'}>
    {demo && !failed && <div className="exercise-demo-visual">
      <canvas ref={still} role="img" aria-label={label} aria-hidden={animate || status !== 'ready'} className={animate ? 'is-hidden' : ''} />
      <img key={attempt} ref={image} src={visible && (playing || status !== 'ready') ? demo.src : undefined}
        alt={label} aria-hidden={!animate || status !== 'ready'} className={animate && status === 'ready' ? '' : 'is-hidden'}
        decoding="async" referrerPolicy="no-referrer"
        onLoad={() => { captureFrame(); setStatus('ready') }} onError={() => setStatus('error')} />
    </div>}
    {failed ? <div className="exercise-demo-message" role="status">
      <span>{t('Demonstration unavailable.')}</span><small>{t(tip)}</small>
      {demo && <button type="button" className="text-button" onClick={() => { setAttempt(value => value + 1); setStatus('loading') }}><RefreshCw size={14} />{t('Try again')}</button>}
    </div> : status === 'loading' && <div className="exercise-demo-message" role="status"><LoaderCircle size={20} className="animate-spin" /><span>{t('Loading demonstration…')}</span></div>}
    <div className="exercise-demo-controls">
      {!failed && <button type="button" className="exercise-demo-toggle" disabled={status !== 'ready'} aria-pressed={playing}
        aria-label={t(playing ? 'Pause demonstration of {exercise}' : 'Play demonstration of {exercise}', { exercise: t(name) })}
        onClick={() => { captureFrame(); setPlaying(value => !value) }}>
        {playing ? <Pause size={14} /> : <Play size={14} />}<span>{t(playing ? 'Pause' : 'Play')}</span>
      </button>}
      <span className="exercise-demo-name" title={t(name)}>{t(name)}</span>
      {demo && <a className="exercise-demo-source" href={demo.sourceUrl} target="_blank" rel="noreferrer" aria-label={t('Demonstration source: {source}', { source: demo.sourceName })}>{demo.sourceName}</a>}
    </div>
  </div>
}
