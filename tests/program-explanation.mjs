import assert from 'node:assert/strict'

export async function checkProgramExplanation(browser, baseURL) {
  const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const open = () => page.getByRole('button', { name: 'Entenda seu programa', exact: true }).click()
  const stats = () => page.locator('.explanation-stats strong').allTextContents()
  const fit = page.locator('.explanation-fit')
  try {
    await page.goto(baseURL)
    await open()
    await page.getByRole('dialog', { name: 'Entenda seu programa' }).waitFor()
    assert.deepEqual(await stats(), ['4', '84', '3'])
    assert.match(await page.locator('#split-heading').locator('..').innerText(), /superiores em 3 treinos e os inferiores em 2/)
    assert.match(await page.locator('.explanation-table').getByRole('row', { name: 'Quadríceps 10 2', exact: true }).innerText(), /10/)
    assert.match(await page.locator('.explanation-sessions').innerText(), /Combina o trabalho de superiores e inferiores/)
    assert.match(await fit.innerText(), /Por enquanto/)

    // Personal fit must distinguish constraints from compatible schedules.
    await page.getByLabel('Seu objetivo de treino').selectOption('muscle')
    await page.getByLabel('Dias disponíveis por semana').selectOption('3')
    await page.getByLabel('Tempo por treino', { exact: true }).selectOption('30')
    assert.match(await fit.innerText(), /Para ganhar massa muscular/)
    assert.match(await fit.innerText(), /ultrapassa sua disponibilidade/)
    assert.match(await fit.innerText(), /estimativa de 4 treinos ultrapassa/)
    await page.getByLabel('Dias disponíveis por semana').selectOption('4')
    await page.getByLabel('Tempo por treino', { exact: true }).selectOption('75')
    assert.equal(await fit.locator('.fit-attention').count(), 0)
    assert.match(await fit.innerText(), /agenda é compatível/)
    await page.getByLabel('Seu objetivo de treino').selectOption('strength')
    assert.match(await fit.innerText(), /Para ganhar força/)
    await page.getByLabel('Seu objetivo de treino').selectOption('consistency')
    assert.match(await fit.innerText(), /Para criar constância/)

    await page.keyboard.press('Escape')
    assert.ok(await page.getByRole('button', { name: 'Entenda seu programa', exact: true }).evaluate(element => element === document.activeElement))
    await page.reload()
    await open()
    assert.equal(await page.getByLabel('Seu objetivo de treino').inputValue(), 'consistency')
    assert.equal(await page.getByLabel('Dias disponíveis por semana').inputValue(), '4')
    assert.equal(await page.getByLabel('Tempo por treino', { exact: true }).inputValue(), '75')
    await page.getByRole('button', { name: 'Voltar ao meu programa' }).click()

    // Exercise edits must recalculate the explanation, including during a session.
    await page.getByRole('button', { name: 'Expandir Agachamento búlgaro ou passada', exact: true }).click()
    await page.getByLabel('Séries de Agachamento búlgaro ou passada', { exact: true }).selectOption('4')
    await open()
    assert.deepEqual(await stats(), ['4', '85', '3'])
    await page.getByRole('row', { name: 'Quadríceps 11 2', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
    const sessionBefore = await page.evaluate(() => localStorage.getItem('form:session'))
    await open()
    await page.getByRole('button', { name: 'Voltar ao meu programa' }).click()
    assert.equal(await page.evaluate(() => localStorage.getItem('form:session')), sessionBefore)

    // Both the complete dialog and its controls must fit a narrow phone.
    await page.setViewportSize({ width: 320, height: 700 })
    await open()
    await page.getByLabel('Tempo por treino', { exact: true }).selectOption('30')
    assert.ok(await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      return modal.scrollWidth <= modal.clientWidth && document.documentElement.scrollWidth <= window.innerWidth
    }))
    await page.screenshot({ path: '/tmp/form-program-explanation-mobile.png', fullPage: true })
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('button', { name: 'Understand your program', exact: true }).click()
    assert.match(await fit.innerText(), /Building consistency/)
    assert.match(await fit.innerText(), /exceed your 30-minute limit/)
    assert.equal(await page.getByLabel('Available days per week').inputValue(), '4')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.screenshot({ path: '/tmp/form-program-explanation-desktop.png', fullPage: true })
    await page.keyboard.press('Escape')

    // Empty and substantially customized programs must never reuse default copy or totals.
    await page.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('form:days'))
      days.forEach(day => { day.exercises = [] })
      days[0].exercises = [{ id: 'custom-core', name: 'Core', muscle: 'Core', sets: 2, reps: 10, equipment: 'Bench', kind: 'crunch', tip: '' }]
      localStorage.setItem('form:days', JSON.stringify(days))
      localStorage.removeItem('form:session')
    })
    await page.reload()
    await page.getByRole('button', { name: 'Understand your program', exact: true }).click()
    assert.deepEqual(await stats(), ['1', '2', '6'])
    await page.getByRole('row', { name: 'Core 2 1', exact: true }).waitFor()
    assert.match(await page.locator('.explanation-sessions').innerText(), /Concentrates the session on core/)
    await page.keyboard.press('Escape')
    await page.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('form:days'))
      days.forEach(day => { day.exercises = [] })
      localStorage.setItem('form:days', JSON.stringify(days))
    })
    await page.reload()
    await page.getByRole('button', { name: 'Understand your program', exact: true }).click()
    assert.deepEqual(await stats(), ['0', '0', '7'])
    assert.match(await page.getByRole('dialog').innerText(), /Your program has no exercises yet/)
    assert.match(await fit.innerText(), /Add exercises before assessing/)
    assert.doesNotMatch(await fit.innerText(), /schedule compatible|All planned sessions/)
    assert.equal(await page.locator('.explanation-table').count(), 0)
    assert.deepEqual(errors, [])
    console.log('Passed: personalized program explanation, constraints, persistence, live edits, active session preservation, translations, mobile layout, and empty programs.')
  } finally {
    await context.close()
  }
}
