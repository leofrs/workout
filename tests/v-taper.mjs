import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

export async function checkVTaper(browser, baseURL) {
  const source = await readFile(new URL('../treino_v_taper.md', import.meta.url), 'utf8')
  const sourceDays = source.split(/^### /m).slice(1).map(section =>
    section.split('\n').filter(line => /^\|.*\|\s*\d+\s*\|/.test(line)).map(line => {
      const cells = line.split('|').map(cell => cell.trim())
      const targets = cells[3].split('/')[0].match(/\d+/g).map(Number)
      return { sets: Number(cells[2]), min: targets[0], max: targets[1] ?? targets[0], rest: Number(cells[4].match(/\d+/)?.[0] ?? 0) }
    }))
  assert.deepEqual(sourceDays.map(day => day.length), [6, 6, 7, 7])
  const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    // Returning browsers receive the new plan once; existing records and the old plan survive.
    await page.addInitScript(() => {
      if (sessionStorage.getItem('migration-fixture')) return
      sessionStorage.setItem('migration-fixture', 'true')
      localStorage.setItem('form:days', JSON.stringify([{ id: 'old', name: 'Old plan', note: 'Keep my note', exercises: [] }]))
      localStorage.setItem('form:program-name', JSON.stringify('My old program'))
      localStorage.setItem('form:custom-program-name', 'true')
      localStorage.setItem('form:session', JSON.stringify({ dayId: 'old', name: 'Old plan', startedAt: 123, logs: { old: [{ weight: '20', reps: '10', done: true }] } }))
      localStorage.setItem('form:history', JSON.stringify([{ id: 'saved-record', name: 'Old workout', dayId: 'old', finishedAt: 1700000000000, seconds: 60, sets: 1, volume: 200, unit: 'kg', exercises: 1 }]))
      localStorage.setItem('form:preferences', JSON.stringify({ name: 'Tester', unit: 'kg', rest: 180 }))
    })
    await page.goto(baseURL)
    await page.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    const saved = await page.evaluate(() => ({
      days: JSON.parse(localStorage.getItem('form:days')),
      backup: JSON.parse(localStorage.getItem('form:program-backup:before-v-taper-1')),
      session: JSON.parse(localStorage.getItem('form:session')),
      preferences: JSON.parse(localStorage.getItem('form:preferences')),
      history: localStorage.getItem('form:history'),
    }))
    assert.equal(saved.backup.days[0].note, 'Keep my note')
    assert.equal(saved.backup['program-name'], 'My old program')
    assert.equal(saved.backup.session.logs.old[0].done, true)
    assert.equal(saved.session, null)
    assert.equal(saved.preferences.rest, 180)
    assert.equal(JSON.parse(saved.history)[0].id, 'saved-record')
    assert.deepEqual(saved.days.map(day => day.weekday), ['Monday', 'Tuesday', 'Thursday', 'Friday'])
    assert.deepEqual(saved.days.map(day => day.exercises.map(exercise => ({ sets: exercise.sets, min: exercise.repMin ?? exercise.reps, max: exercise.reps, rest: exercise.rest }))), sourceDays)
    const allIds = saved.days.flatMap(day => day.exercises.map(exercise => exercise.id))
    assert.deepEqual(allIds, ['wide-pulldown', 'incline-press', 'lateral-free', 'cable-row', 'skull-cable', 'direct-curl', 'squat-legpress', 'stiff', 'leg-ext', 'lying-leg-curl', 'calf-any', 'core-choice', 'db-ohp', 'db-row', 'straight-pull', 'reverse-fly', 'cable-lateral', 'hammer', 'rope', 'bulgarian-lunge', 'neutral-pulldown', 'flat-press', 'lateral-drop', 'preacher', 'french-bench', 'rollout'])
    assert.deepEqual(await page.locator('.calendar-day.planned').evaluateAll(elements => elements.map(element => Array.from(element.parentElement.children).indexOf(element))), [0, 1, 3, 4])
    assert.match(await page.locator('.exercise-card').filter({ hasText: 'Agachamento búlgaro ou passada' }).innerText(), /10–12 repetições/)
    assert.match(await page.locator('.exercise-card').filter({ hasText: 'drop-set final' }).innerText(), /Última série: drop-set/)

    // The prescribed rest overrides the general preference, including the zero-rest superset.
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
    await page.getByRole('button', { name: 'Concluir Agachamento búlgaro ou passada, série 1', exact: true }).click()
    assert.match(await page.locator('.rest-timer').innerText(), /01:([28]\d|30)/)
    await page.getByRole('button', { name: 'Expandir Puxada com triângulo (pegada neutra)', exact: true }).click()
    await page.getByRole('button', { name: 'Concluir Puxada com triângulo (pegada neutra), série 1', exact: true }).click()
    assert.match(await page.locator('.rest-timer').innerText(), /01:1[0-5]/)
    await page.getByRole('button', { name: 'Expandir Rosca Scott com halter ou barra', exact: true }).click()
    await page.getByRole('button', { name: 'Concluir Rosca Scott com halter ou barra, série 1', exact: true }).click()
    assert.equal(await page.locator('.rest-timer').count(), 0)
    await page.getByRole('button', { name: 'Concluir Tríceps francês ou no banco, série 1', exact: true }).click()
    assert.match(await page.locator('.rest-timer').innerText(), /0[01]:([05]\d|00)/)
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).first().click()
    await page.getByRole('button', { name: 'Salvar e finalizar treino' }).click()
    await page.getByRole('button', { name: 'Fechar janela' }).click()

    // The core alternative records seconds and never adds time to weight × reps volume.
    await page.getByRole('tab').filter({ hasText: 'Inferiores e Core' }).click()
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
    await page.getByRole('button', { name: 'Expandir Prancha / infra suspenso', exact: true }).click()
    await page.getByLabel('Forma de registro', { exact: true }).selectOption('seconds')
    assert.equal(await page.getByRole('spinbutton', { name: 'Prancha / infra suspenso, série 1, segundos', exact: true }).inputValue(), '45')
    assert.ok(await page.getByRole('spinbutton', { name: 'Prancha / infra suspenso, série 1, peso', exact: true }).isDisabled())
    await page.getByRole('button', { name: 'Concluir Prancha / infra suspenso, série 1', exact: true }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Expandir Prancha / infra suspenso', exact: true }).click()
    assert.equal(await page.getByLabel('Forma de registro', { exact: true }).inputValue(), 'seconds')
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).first().click()
    await page.getByRole('button', { name: 'Salvar e finalizar treino' }).click()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('form:history'))[0].volume), 0)
    await page.getByRole('button', { name: 'Fechar janela' }).click()
    await page.getByRole('button', { name: 'Adicionar anotação ao treino' }).click()
    await page.getByLabel('Anotação do treino', { exact: true }).fill('My V-Taper note')
    await page.reload()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('form:days'))[1].note), 'My V-Taper note')
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('form:program-backup:before-v-taper-1')).days[0].note), 'Keep my note')
    assert.deepEqual(errors, [])
    console.log('Passed: V-Taper prescriptions compared with Markdown, one-time migration, archive, calendar, prescribed rests, superset, and timed core logging.')
  } finally {
    await context.close()
  }
}
