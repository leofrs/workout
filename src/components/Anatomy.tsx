import type { Muscle } from '../data'
import { useLanguage } from '../i18n'

type Part = { d: string; muscle?: Muscle }
const frontParts: Part[] = [
  { d: 'M49 32 45 39 36 43 47 47 58 41 69 47 80 43 71 39 67 32Z' },
  { d: 'M35 45Q25 44 22 60L24 68 36 60 40 49Z', muscle: 'Shoulders' },
  { d: 'M81 45Q91 44 94 60L92 68 80 60 76 49Z', muscle: 'Shoulders' },
  { d: 'M42 47 56 44 56 66Q45 69 35 61Z', muscle: 'Chest' },
  { d: 'M74 47 60 44 60 66Q71 69 81 61Z', muscle: 'Chest' },
  { d: 'M24 69 34 63 34 79 25 92 20 88Z', muscle: 'Biceps' },
  { d: 'M92 69 82 63 82 79 91 92 96 88Z', muscle: 'Biceps' },
  { d: 'M21 91 26 95 20 115 14 122 11 118Z' },
  { d: 'M95 91 90 95 96 115 102 122 105 118Z' },
  { d: 'M37 66 44 71 43 96 39 104 35 82Z', muscle: 'Core' },
  { d: 'M79 66 72 71 73 96 77 104 81 82Z', muscle: 'Core' },
  ...[0, 1, 2].flatMap(i => [{ d: `M46 ${70 + i * 11} 56 ${70 + i * 11} 56 ${78 + i * 11} 45 ${78 + i * 11}Z`, muscle: 'Core' as Muscle }, { d: `M60 ${70 + i * 11} 70 ${70 + i * 11} 71 ${78 + i * 11} 60 ${78 + i * 11}Z`, muscle: 'Core' as Muscle }]),
  { d: 'M44 103 56 105 56 117 49 125 40 109Z', muscle: 'Core' },
  { d: 'M72 103 60 105 60 117 67 125 76 109Z', muscle: 'Core' },
  { d: 'M38 112 47 129 43 164 34 174 30 155 32 130Z', muscle: 'Quads' },
  { d: 'M50 128 56 122 55 151 48 170 46 161Z', muscle: 'Quads' },
  { d: 'M78 112 69 129 73 164 82 174 86 155 84 130Z', muscle: 'Quads' },
  { d: 'M66 128 60 122 61 151 68 170 70 161Z', muscle: 'Quads' },
  { d: 'M34 181 42 180 44 191 38 216 33 219 30 199Z', muscle: 'Calves' },
  { d: 'M82 181 74 180 72 191 78 216 83 219 86 199Z', muscle: 'Calves' },
]
const backParts: Part[] = [
  { d: 'M49 33 46 41 36 46 49 59 57 70 57 45Z', muscle: 'Back' },
  { d: 'M67 33 70 41 80 46 67 59 59 70 59 45Z', muscle: 'Back' },
  { d: 'M34 46Q25 45 22 61L25 69 37 61 41 52Z', muscle: 'Shoulders' },
  { d: 'M82 46Q91 45 94 61L91 69 79 61 75 52Z', muscle: 'Shoulders' },
  { d: 'M24 71 34 64 34 81 25 93 20 87Z', muscle: 'Triceps' },
  { d: 'M92 71 82 64 82 81 91 93 96 87Z', muscle: 'Triceps' },
  { d: 'M21 92 26 96 20 115 14 122 11 118Z' },
  { d: 'M95 92 90 96 96 115 102 122 105 118Z' },
  { d: 'M37 64 54 72 55 105 45 99 37 84Z', muscle: 'Back' },
  { d: 'M79 64 62 72 61 105 71 99 79 84Z', muscle: 'Back' },
  { d: 'M47 101 55 108 55 115 40 111Z', muscle: 'Back' },
  { d: 'M69 101 61 108 61 115 76 111Z', muscle: 'Back' },
  { d: 'M39 114Q48 111 56 118L56 133Q42 140 33 131Z', muscle: 'Glutes' },
  { d: 'M77 114Q68 111 60 118L60 133Q74 140 83 131Z', muscle: 'Glutes' },
  { d: 'M33 136 43 140 42 168 35 174 30 155Z', muscle: 'Hamstrings' },
  { d: 'M47 141 55 137 53 160 46 176 44 166Z', muscle: 'Hamstrings' },
  { d: 'M83 136 73 140 74 168 81 174 86 155Z', muscle: 'Hamstrings' },
  { d: 'M69 141 61 137 63 160 70 176 72 166Z', muscle: 'Hamstrings' },
  { d: 'M34 181Q44 177 44 191L39 207 34 203 30 193Z', muscle: 'Calves' },
  { d: 'M82 181Q72 177 72 191L77 207 82 203 86 193Z', muscle: 'Calves' },
]
const outline = 'M49 32 46 39 33 44Q23 44 20 60L18 78 15 94 8 116 8 125 12 129 17 125 22 115 30 96 34 82 36 103 30 127 28 151 30 173 28 197 31 220 28 231 29 236 44 236 44 231 40 221 45 198 47 178 56 152 58 134 60 152 69 178 71 198 76 221 72 231 72 236 87 236 88 231 85 220 88 197 86 173 88 151 86 127 80 103 82 82 86 96 94 115 99 125 104 129 108 125 108 116 101 94 98 78 96 60Q93 44 83 44L70 39 67 32Z'

export function Anatomy({ muscles, compact = false }: { muscles: Muscle[]; compact?: boolean }) {
  const { t } = useLanguage()
  return <div className={`anatomy ${compact ? 'anatomy-compact' : ''}`} aria-label={t('Muscles worked: {muscles}', { muscles: muscles.map(muscle => t(muscle)).join(', ') })}>
    {(['front', 'back'] as const).map(side => <div className="anatomy-view" key={side}>
      <svg viewBox="0 0 116 244" role="img" aria-label={t('{side} muscle diagram', { side: t(side) })}>
        <ellipse cx="58" cy="16" rx="12" ry="15" fill="#525252" />
        <path d="M49 27V37L58 42 67 37V27" fill="#404040" />
        <path d={outline} fill="#363636" stroke="#171717" strokeWidth="1.2" />
        {(side === 'front' ? frontParts : backParts).map((part, i) => <path key={i} d={part.d} fill={part.muscle && muscles.includes(part.muscle) ? 'rgb(var(--accent))' : '#525252'} stroke="#262626" strokeWidth="1" strokeLinejoin="round" />)}
        <path d="M58 43V113M33 176 40 177M76 177 83 176" fill="none" stroke="#262626" strokeWidth="1.5" />
      </svg>
      <span>{t(side)}</span>
    </div>)}
  </div>
}
