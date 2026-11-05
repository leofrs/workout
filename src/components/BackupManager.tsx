import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { applyBackup, createBackup, importPreview, maxBackupBytes, parseBackup } from '../backup'
import type { Backup, ImportMode } from '../backup'
import { useLanguage } from '../i18n'
import { Modal } from './Modal'

export function BackupManager({ data, onClose }: { data: Partial<Backup['data']>; onClose: () => void }) {
  const { t, locale } = useLanguage()
  const [backup, setBackup] = useState<Backup | null>(null)
  const [filename, setFilename] = useState('')
  const [importMode, setImportMode] = useState<ImportMode>('history')
  const [error, setError] = useState('')
  const [exported, setExported] = useState(false)
  const request = useRef(0)
  const preview = backup ? importPreview(backup, data.history ?? []) : null

  function download() {
    setError('')
    try {
      const current = createBackup(data)
      const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `form-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExported(true)
    } catch { setError('Could not export the backup. Your current data was not changed.') }
  }

  return <Modal title={t('Backup and restore')} onClose={onClose} wide>
    <p className="modal-intro">{t('Download a copy of your program, history, preferences and active session. Keep a separate file for each tester.')}</p>
    <section className="backup-section"><h3>{t('Export your data')}</h3><p>{t('The JSON file stays with you. It can restore your data in another browser without an account.')}</p><button className="secondary-button" onClick={download}><Download size={16} />{t('Download backup')}</button>{exported && <p role="status">{t('Backup downloaded.')}</p>}</section>
    <section className="backup-section"><h3>{t('Import a backup')}</h3><p>{t('Choose a FORM JSON backup, up to 5 MB. You can review it before importing. Existing workouts are kept; matching IDs are never duplicated or overwritten.')}</p>
      <label className="backup-file-label"><Upload size={16} /><span>{t('Choose backup file')}</span><input type="file" accept="application/json,.json" aria-label={t('Choose backup file')} onChange={async event => {
        const file = event.target.files?.[0]
        const ticket = ++request.current
        setBackup(null); setError(''); setFilename('')
        if (!file) return
        try {
          if (file.size > maxBackupBytes) throw new Error('Backup files must be 5 MB or smaller.')
          const parsed = parseBackup(await file.text())
          if (ticket === request.current) { setBackup(parsed); setFilename(file.name) }
        } catch (cause) { if (ticket === request.current) setError(cause instanceof Error ? cause.message : 'Invalid backup file. No data was changed.') }
      }} /></label>
      {backup && preview && <div className="backup-preview" aria-label={t('Import preview')}>
        <h4>{t('Import preview')}</h4><p className="break-all">{filename}</p><p>{t('Exported on {date}', { date: new Date(backup.exportedAt).toLocaleString(locale) })}</p><p>{backup.data.programName} · {backup.data.days.length} {t('training days / week')}</p>
        <dl><div><dt>{t('Workouts to add')}</dt><dd>{preview.added}</dd></div><div><dt>{t('Existing workout IDs skipped')}</dt><dd>{preview.duplicates}</dd></div><div><dt>{t('Different versions kept unchanged')}</dt><dd>{preview.conflicts}</dd></div></dl>
        <label className="form-label">{t('What to import')}<select aria-label={t('What to import')} value={importMode} onChange={event => setImportMode(event.target.value as ImportMode)}><option value="history">{t('Add history only')}</option><option value="restore">{t('Restore program and preferences too')}</option></select></label>
        <p>{importMode === 'history' ? t('Your program, preferences and session stay as they are. Only new workout records are added.') : t('The file replaces your current program, notes, preferences, language and training context. Your existing workout history is kept and merged with the file. Download your current backup first if you want to keep these settings.')}</p>
        {backup.data.session && <p>{importMode === 'restore' ? t('The active session saved in the file will be restored, including its original start time.') : t('The session saved in the file is not imported when adding history only.')}</p>}
        {data.session && <p className="backup-error" role="status">{t('Finish or discard your current session before importing.')}</p>}
        <button className="primary-button full-width" disabled={!!data.session} onClick={() => {
          try { applyBackup(backup, importMode); window.location.reload() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Import failed. No data was changed.') }
        }}>{t('Confirm import')}</button>
      </div>}
    </section>
    {error && <p className="backup-error" role="alert">{t(error)}</p>}
  </Modal>
}
