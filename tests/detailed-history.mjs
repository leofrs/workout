import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

export async function checkDetailedHistory(browser, baseURL) {
  const contexts = []
  const errors = []
  const fresh = async () => {
    const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } })
    contexts.push(context)
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(baseURL)
    await page.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    return page
  }
  const navigate = async (page, name) => {
    const exit = page.getByRole('button', { name: 'Sair da tela cheia', exact: true })
    if (await exit.isVisible()) await exit.click()
    const menu = page.getByRole('button', { name: 'Abrir navegação', exact: true })
    if (await menu.isVisible()) await menu.click()
    await page.getByRole('navigation').getByRole('button', { name, exact: true }).click()
  }
  const close = page => page.getByRole('button', { name: 'Fechar janela', exact: true }).click()
  const start = async page => {
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()

  }
  const finish = async page => {
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).first().click()
    await page.getByRole('button', { name: 'Salvar e finalizar treino', exact: true }).click()
    await page.getByRole('dialog', { name: 'Treino concluído. Bom trabalho!' }).waitFor()
  }
  const discard = async page => {
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).first().click()
    await page.getByRole('button', { name: 'Descartar treino vazio', exact: true }).click()
  }
  const history = page => page.evaluate(() => JSON.parse(localStorage.getItem('form:history')))
  const storage = page => page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('form:')).sort(([a], [b]) => a.localeCompare(b))))
  const openBackup = async page => {
    await navigate(page, 'Histórico de treinos')
    await page.locator('.history-toolbar').getByRole('button', { name: 'Backup e restauração', exact: true }).click()
  }
  const upload = (page, payload, name = 'backup.json') => page.getByLabel('Escolher arquivo de backup', { exact: true }).setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload)) })
  const download = async (page, path) => {
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Baixar backup', exact: true }).click()
    await (await pending).saveAs(path)
    return JSON.parse(await readFile(path, 'utf8'))
  }
  try {
    const page = await fresh()
    // Legacy summaries survive independently of the new optional details.
    await page.evaluate(() => localStorage.setItem('form:history', JSON.stringify([{ id: 'legacy', name: 'Legacy workout', dayId: 'old', finishedAt: 1700000000000, seconds: 60, sets: 1, volume: 100, unit: 'kg', exercises: 1 }])))
    await page.reload()
    await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    await start(page)
    await page.getByRole('button', { name: 'Concluir Agachamento búlgaro ou passada, série 1', exact: true }).click()
    await page.getByRole('button', { name: 'Pular descanso', exact: true }).click()
    await finish(page)
    const originalRecord = (await history(page))[0]
    assert.equal(originalRecord.details.exercises[0].variant.id, 'bulgarian')
    assert.deepEqual(originalRecord.details.exercises[0].logs[0], { weight: '', reps: '12', done: true })
    assert.equal(originalRecord.details.exercises[0].logs[1].done, false)
    await close(page)
    await navigate(page, 'Histórico de treinos')
    await page.getByRole('button', { name: 'Ver resumo de Legacy workout', exact: true }).click()
    assert.match(await page.getByRole('dialog').innerText(), /Somente resumo: este treino foi salvo antes/)
    assert.equal(await page.locator('.saved-sets-table').count(), 0)
    await close(page)
    // Later program edits never rewrite a saved prescription.
    await page.evaluate(() => { const days = JSON.parse(localStorage.getItem('form:days')); days[3].exercises[0].sets = 4; localStorage.setItem('form:days', JSON.stringify(days)) })
    await page.reload()
    await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    await start(page)
    assert.equal(await page.locator('[data-exercise-id="bulgarian-lunge"] .set-complete-button').count(), 4)
    assert.equal(await page.locator('.simple-feed input, .simple-feed select').count(), 0)
    await discard(page)
    assert.deepEqual((await history(page)).find(record => record.id === originalRecord.id), originalRecord)

    await openBackup(page)
    const backup = await download(page, '/tmp/form-detailed-history-backup.json')
    assert.equal(backup.formatVersion, 1)
    assert.deepEqual(backup.data.history.find(record => record.id === originalRecord.id), originalRecord)
    const beforeInvalid = await storage(page)
    for (const invalid of ['{', { app: 'FORM', formatVersion: 999 }, { ...backup, data: { ...backup.data, days: [] } }, { ...backup, data: { ...backup.data, history: [...backup.data.history, backup.data.history[0]] } }]) {
      await upload(page, invalid)
      await page.getByRole('alert').last().waitFor()
      assert.equal(await page.getByRole('button', { name: 'Confirmar importação', exact: true }).count(), 0)
      assert.deepEqual(await storage(page), beforeInvalid)
    }
    await upload(page, backup)
    assert.match(await page.getByLabel('Prévia da importação').innerText(), /Treinos a adicionar\s*0/)
    await close(page)

    // Round-trip into another browser; merge and restore are deliberately different.
    const target = await fresh()
    await openBackup(target)
    await upload(target, backup)
    await target.getByRole('button', { name: 'Confirmar importação', exact: true }).click()
    await target.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    assert.deepEqual(await history(target), backup.data.history)
    assert.equal(await target.evaluate(() => JSON.parse(localStorage.getItem('form:days'))[3].exercises[0].sets), 3)
    await openBackup(target)
    await upload(target, backup)
    assert.match(await target.getByLabel('Prévia da importação').innerText(), /Treinos a adicionar\s*0/)
    await target.getByRole('button', { name: 'Confirmar importação', exact: true }).click()
    await target.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    assert.equal((await history(target)).length, backup.data.history.length)
    const conflicting = structuredClone(backup)
    conflicting.data.history[0].name = 'A conflicting version'
    await openBackup(target)
    await upload(target, conflicting)
    assert.match(await target.getByLabel('Prévia da importação').innerText(), /Versões diferentes mantidas sem alteração\s*1/)
    await target.getByRole('button', { name: 'Confirmar importação', exact: true }).click()
    await target.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    assert.equal((await history(target))[0].name, backup.data.history[0].name)

    // A failed multi-key restore must roll back before any UI state is replaced.
    await openBackup(target)
    await upload(target, backup)
    await target.getByLabel('O que importar', { exact: true }).selectOption('restore')
    const beforeFailure = await storage(target)
    await target.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = function(key, value) {
        if (key === 'form:preferences') { Storage.prototype.setItem = window.originalSetItem; throw new DOMException('Quota test', 'QuotaExceededError') }
        return window.originalSetItem.call(this, key, value)
      }
    })
    await target.getByRole('button', { name: 'Confirmar importação', exact: true }).click()
    await target.getByRole('alert').filter({ hasText: 'os dados anteriores foram restaurados' }).waitFor()
    assert.deepEqual(await storage(target), beforeFailure)
    await target.getByRole('button', { name: 'Confirmar importação', exact: true }).click()
    await target.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    assert.deepEqual(await target.evaluate(() => JSON.parse(localStorage.getItem('form:days'))), backup.data.days)
    assert.deepEqual(await history(target), backup.data.history)
    // A backup from someone who never filled in training context is valid too.
    await target.getByRole('button', { name: 'Opções do programa', exact: true }).click()
    await target.getByRole('button', { name: 'Entenda seu programa', exact: true }).click()
    await target.getByRole('dialog', { name: 'Entenda seu programa', exact: true }).waitFor()
    assert.equal(await target.getByLabel('Seu objetivo de treino', { exact: true }).inputValue(), '')
    await close(target)

    // Export includes an active session. Import cannot replace a live session.
    await navigate(page, 'Meu programa')
    await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    await start(page)

    await openBackup(page)
    const activeBackup = await download(page, '/tmp/form-active-session-backup.json')
    await upload(page, backup)
    assert.ok(await page.getByRole('button', { name: 'Confirmar importação', exact: true }).isDisabled())
    assert.match(await page.getByRole('dialog').innerText(), /Finalize ou descarte sua sessão atual/)
    await close(page)
    await openBackup(target)
    await upload(target, activeBackup)
    await target.getByLabel('O que importar', { exact: true }).selectOption('restore')
    await target.getByRole('button', { name: 'Confirmar importação', exact: true }).click()
    await target.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    assert.deepEqual(await target.evaluate(() => JSON.parse(localStorage.getItem('form:session'))), activeBackup.data.session)
    await target.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    assert.equal(await target.locator('.simple-feed input, .simple-feed select').count(), 0)
    await target.setViewportSize({ width: 320, height: 750 })
    assert.ok(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await target.screenshot({ path: '/tmp/form-history-reference-mobile.png', fullPage: true })

    // If completing a workout cannot be persisted, keep it open and allow memory export.
    await navigate(page, 'Meu programa')
    await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    await page.getByRole('button', { name: 'Concluir Agachamento búlgaro ou passada, série 1', exact: true }).click()
    await page.getByRole('button', { name: 'Pular descanso', exact: true }).click()
    const countBefore = (await history(page)).length
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = function(key, value) {
        if (key === 'form:history') throw new DOMException('Quota test', 'QuotaExceededError')
        return window.originalSetItem.call(this, key, value)
      }
    })
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).first().click()
    await page.getByRole('button', { name: 'Salvar e finalizar treino', exact: true }).click()
    assert.ok(await page.getByRole('dialog', { name: 'Tudo pronto para finalizar o treino?' }).isVisible())
    assert.equal((await history(page)).length, countBefore)
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('form:session')).logs['bulgarian-lunge'][0].done), true)
    await page.getByRole('button', { name: 'Continuar treinando', exact: true }).click()
    await openBackup(page)
    const rescued = await download(page, '/tmp/form-unsaved-session-backup.json')
    assert.equal(rescued.data.session.logs['bulgarian-lunge'][0].done, true)
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem })
    await close(page)
    await navigate(page, 'Meu programa')
    await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    // A failure clearing the session after writing history must undo that history write.
    const beforeClearFailure = await history(page)
    await page.evaluate(() => {
      Storage.prototype.setItem = function(key, value) {
        if (key === 'form:session' && value === 'null') { Storage.prototype.setItem = window.originalSetItem; throw new DOMException('Quota test', 'QuotaExceededError') }
        return window.originalSetItem.call(this, key, value)
      }
    })
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).first().click()
    await page.getByRole('button', { name: 'Salvar e finalizar treino', exact: true }).click()
    assert.deepEqual(await history(page), beforeClearFailure)
    assert.ok(await page.getByRole('dialog', { name: 'Tudo pronto para finalizar o treino?' }).isVisible())
    await page.getByRole('button', { name: 'Continuar treinando', exact: true }).click()
    await finish(page)
    await page.setViewportSize({ width: 320, height: 750 })
    assert.ok(await page.evaluate(() => document.querySelector('[role="dialog"]').scrollWidth <= document.querySelector('[role="dialog"]').clientWidth))
    await page.screenshot({ path: '/tmp/form-detailed-history-mobile.png', fullPage: true })

    // Upgrade a pre-feature live session without assigning a guessed variant.
    const legacyPage = await fresh()
    await legacyPage.evaluate(() => localStorage.setItem('form:session', JSON.stringify({ dayId: 'full-body', name: 'Full Body', startedAt: Date.now(), logs: { 'bulgarian-lunge': [{ weight: '22', reps: '10', done: true }] } })))
    await legacyPage.reload()
    await legacyPage.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    await finish(legacyPage)
    assert.equal((await history(legacyPage))[0].details.recovered, true)
    assert.match(await legacyPage.locator('.workout-details').innerText(), /Variante não registrada/)
    assert.deepEqual(errors, [])
    console.log('Passed: detailed history, immutable prescriptions, legacy summaries/sessions, backups, validation, deduplication, restore rollback, active-session protection and storage failure recovery.')
  } finally {
    for (const context of contexts) await context.close()
  }
}
