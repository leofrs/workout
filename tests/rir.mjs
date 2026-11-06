import assert from 'node:assert/strict'

// Earlier versions logged effort and loads. Those records remain readable while
// the daily workout now offers completion only.
export async function checkRir(browser, baseURL) {
  const context = await browser.newContext({ locale: 'pt-BR' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(baseURL)
    await page.locator('.training-day-card').filter({ hasText: 'Superiores 1' }).click()
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
    await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('form:session'))
      session.logs['wide-pulldown'] = [
        { weight: '60', reps: '10', done: true },
        { weight: '60', reps: '10', done: true, rir: '0' },
        { weight: '60', reps: '10', done: true, rir: 'unknown' },
        { weight: '60', reps: '10', done: true, rir: '4+' },
      ]
      localStorage.setItem('form:session', JSON.stringify(session))
    })
    await page.reload()
    await page.locator('.training-day-card').filter({ hasText: 'Superiores 1' }).click()
    assert.equal(await page.locator('.simple-feed input, .simple-feed select').count(), 0)
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click()
    await page.getByRole('button', { name: 'Salvar e finalizar treino', exact: true }).click()
    const record = await page.evaluate(() => JSON.parse(localStorage.getItem('form:history'))[0])
    assert.deepEqual(record.details.exercises[0].logs.map(set => set.rir), [undefined, '0', 'unknown', '4+'])
    assert.equal(record.volume, 2400)
    assert.match(await page.locator('.saved-sets-table').first().innerText(), /Não sei/)
    await page.getByRole('button', { name: 'Fechar janela', exact: true }).click()
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('button', { name: 'Start workout', exact: true }).click()
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem('form:session')).logs['wide-pulldown'])
    assert.ok(logs.every(set => set.weight === '' && !set.done && !('rir' in set)))
    await page.getByRole('button', { name: 'Complete Wide-Grip Lat Pulldown set 1', exact: true }).click()
    await page.getByRole('dialog', { name: 'Time to rest' }).waitFor()
    await page.getByRole('button', { name: 'Skip rest', exact: true }).click()
    await page.getByRole('button', { name: 'Finish workout', exact: true }).click()
    await page.getByRole('button', { name: 'Save & finish workout', exact: true }).click()
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem('form:history')))
    assert.deepEqual(records[1], record)
    assert.equal(records[0].volume, 0)
    assert.deepEqual(records[0].details.exercises[0].logs[0], { weight: '', reps: '12', done: true })
    assert.deepEqual(errors, [])
    console.log('Passed: legacy weights/RIR remain in history, completion-only sessions never borrow loads or effort, and English rest modal.')
  } finally { await context.close() }
}
