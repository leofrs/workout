import assert from 'node:assert/strict'

export async function checkWorkoutFeed(browser, baseURL) {
  const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const feed = page.getByRole('region', { name: 'Feed de exercícios do treino' })
  const card = id => feed.locator(`[data-exercise-id="${id}"]`)
  const done = (name, set = 1) => page.getByRole('button', { name: `Concluir ${name}, série ${set}`, exact: true })
  const expectIndex = async index => {
    await page.waitForFunction(expected => {
      const feed = document.querySelector('.training-feed')
      return feed && Math.abs(feed.scrollTop - feed.children[expected].offsetTop) < 3 && document.querySelector('.feed-toolbar').innerText.includes(`Exercício ${expected + 1} de 7`)
    }, index)
    assert.match(await page.locator('.feed-toolbar').innerText(), new RegExp(`Exercício ${index + 1} de 7`))
  }
  try {
    await page.clock.setFixedTime(new Date('2026-11-06T12:00:00-03:00'))
    await page.goto(baseURL)
    // The schedule, rather than a stale selection, determines today's session.
    for (const [date, name, category] of [
      ['2026-11-02', 'Superiores 1', 'Membros superiores'],
      ['2026-11-03', 'Inferiores e Core', 'Membros inferiores'],
      ['2026-11-05', 'Superiores 2', 'Membros superiores'],
      ['2026-11-06', 'Corpo inteiro', 'Corpo inteiro'],
    ]) {
      await page.clock.setFixedTime(new Date(`${date}T12:00:00-03:00`))
      await page.reload()
      await page.getByRole('tab', { selected: true }).filter({ hasText: name }).waitFor()
      assert.match(await page.locator('.hero-eyebrow').innerText(), /TREINO DO DIA/)
      assert.match(await page.locator('.focus-tags').innerText(), new RegExp(category))
    }
    await page.clock.setFixedTime(new Date('2026-11-04T12:00:00-03:00'))
    await page.reload()
    assert.match(await page.locator('.hero-eyebrow').innerText(), /TREINO SELECIONADO/)
    await page.clock.setFixedTime(new Date('2026-11-06T12:00:00-03:00'))
    await page.reload()
    await page.screenshot({ path: '/tmp/form-workout-overview-mobile.png' })
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
    await feed.waitFor()
    assert.equal(await feed.locator('.exercise-card').count(), 7)
    assert.match(await feed.evaluate(element => getComputedStyle(element).scrollSnapType), /^y(?: proximity)?$/)
    assert.equal(await feed.locator('.exercise-extra-details').count(), 0)
    await expectIndex(0)
    assert.ok(await card('bulgarian-lunge').getByRole('img', { name: 'Ilustração de Agachamento búlgaro ou passada', exact: true }).isVisible())
    assert.match(await card('bulgarian-lunge').innerText(), /3 séries\s*×\s*10–12 repetições/)
    const complete = done('Agachamento búlgaro ou passada')
    const bounds = await complete.boundingBox()
    assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 812, 'Complete-set control must fit on the first screen')
    await page.screenshot({ path: '/tmp/form-workout-feed-mobile.png' })
    await page.getByRole('button', { name: 'Voltar à visão geral do treino', exact: true }).click()
    assert.equal(await page.evaluate(() => scrollY), 0)
    await page.locator('.active-workout-label').click()
    await complete.click()
    await page.getByRole('timer', { name: 'Cronômetro de descanso' }).waitFor()
    assert.match(await page.locator('.rest-timer').innerText(), /01:30/)
    await page.clock.setFixedTime(new Date('2026-11-06T12:00:05-03:00'))
    await page.waitForFunction(() => document.querySelector('.rest-timer').innerText.includes('01:25'))
    // A real vertical wheel gesture advances to the next page without ending rest.
    await feed.hover()
    await page.mouse.wheel(0, await feed.evaluate(element => element.clientHeight))
    await expectIndex(1)
    assert.match(await page.locator('.rest-timer').innerText(), /01:25/)
    await done('Puxada com triângulo (pegada neutra)').click()
    assert.match(await page.locator('.rest-timer').innerText(), /01:15/)
    await card('neutral-pulldown').getByRole('button', { name: 'Próximo exercício', exact: true }).click()
    await expectIndex(2)
    await page.locator('.feed-toolbar').getByRole('button', { name: 'Exercício anterior' }).click()
    await expectIndex(1)
    await page.getByRole('button', { name: 'Pular', exact: false }).click()
    assert.equal(await page.getByRole('timer').count(), 0)

    // Every card and its controls fit narrow and wide viewports.
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 812 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}`)
      assert.ok(await feed.evaluate(element => element.scrollWidth <= element.clientWidth), `Feed overflow at ${width}`)
      assert.ok(await card('neutral-pulldown').locator('.set-table-row').first().evaluate(element => element.getBoundingClientRect().right <= innerWidth), `Set controls clipped at ${width}`)
    }
    await feed.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
    await page.screenshot({ path: '/tmp/form-workout-feed-desktop.png' })

    // Zero-rest supersets still advance immediately to the paired exercise.
    await card('preacher').getByRole('button', { name: 'Concluir Rosca Scott com halter ou barra, série 1', exact: true }).click()
    await expectIndex(5)
    assert.equal(await page.getByRole('timer').count(), 0)
    await done('Tríceps francês ou no banco').click()
    assert.match(await page.locator('.rest-timer').innerText(), /01:00/)

    // Reload resumes the original session even on another scheduled day.
    await page.clock.setFixedTime(new Date('2026-11-09T12:00:00-03:00'))
    await page.reload()
    await feed.waitFor()
    await page.getByRole('tab', { selected: true }).filter({ hasText: 'Corpo inteiro' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Desmarcar Agachamento búlgaro ou passada, série 1', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'English', exact: true }).click()
    assert.equal(await page.getByRole('region', { name: 'Workout exercise feed' }).count(), 1)
    await page.getByRole('button', { name: 'Finish workout', exact: true }).first().click()
    await page.getByRole('button', { name: 'Save & finish workout' }).click()
    await page.getByRole('dialog', { name: 'That’s work well done.' }).waitFor()
    const history = await page.evaluate(() => JSON.parse(localStorage.getItem('form:history')))
    assert.equal(history[0].sets, 4)
    assert.equal(history[0].details.exercises.find(exercise => exercise.prescription.id === 'neutral-pulldown').logs[0].done, true)
    assert.deepEqual(errors, [])
    console.log('Passed: daily workout/category, vertical feed, always-visible sets, scrolling/navigation, prescribed rest, superset, responsive controls, session recovery, translations, and saved history.')
  } finally {
    await context.close()
  }
}
