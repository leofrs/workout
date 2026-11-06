import assert from 'node:assert/strict'

// Original two-frame GIF fixture. Network outages must not make UI tests flaky.
const header = Buffer.from('47494638396101000100800000000000ffffff', 'hex')
const frame = Buffer.from('21f904000a0000002c0000000001000100000202440100', 'hex')
const gif = Buffer.concat([header, frame, frame, Buffer.from([0x3b])])

export async function checkExerciseMedia(browser, baseURL) {
  const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  let failFirst = true
  await context.route(url => ['static.exercisedb.dev', 'fitnessprogramer.com'].includes(url.hostname), route => {
    if (failFirst && route.request().url().includes('RVwzP10.gif')) {
      failFirst = false
      return route.fulfill({ status: 503 })
    }
    return route.fulfill({ contentType: 'image/gif', body: gif })
  })
  try {
    await page.goto(baseURL)
    const coverage = await page.evaluate(async () => {
      const { catalog } = await import('/src/data.ts')
      const { exerciseVariants } = await import('/src/trainingHistory.ts')
      const { getExerciseDemo } = await import('/src/exerciseMedia.ts')
      return catalog.flatMap(exercise => exerciseVariants(exercise).map(variant => ({
        exercise: exercise.id, variant: variant.id,
        ...getExerciseDemo({ ...exercise, variantId: variant.id }, variant.mode),
      })))
    })
    assert.equal(coverage.length, 40)
    for (const entry of coverage) {
      assert.ok(entry.demo?.src.endsWith('.gif'), `Missing GIF for ${entry.exercise}/${entry.variant.id}`)
      assert.ok(!entry.demo.src.includes('PLACEHOLDER'))
    }
    for (const id of new Set(coverage.map(entry => entry.exercise))) {
      const variants = coverage.filter(entry => entry.exercise === id)
      assert.equal(new Set(variants.map(entry => entry.demo.src)).size, variants.length, `Variants of ${id} need distinct demonstrations`)
    }

    await page.getByRole('navigation').getByRole('button', { name: 'Biblioteca de exercícios' }).click()
    assert.equal(await page.locator('.library-card .exercise-demo').count(), 26)
    const first = page.locator('.library-card').first()
    await first.getByText('Demonstração indisponível.', { exact: true }).waitFor()
    await first.getByRole('button', { name: 'Tentar novamente' }).click()
    const pause = first.getByRole('button', { name: /^Pausar demonstração/ })
    await pause.waitFor({ state: 'visible' })
    await page.waitForFunction(() => document.querySelector('.exercise-demo')?.getAttribute('aria-busy') === 'false')
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('form:days')))
    await pause.click()
    assert.equal(await first.locator('.exercise-demo-toggle').getAttribute('aria-pressed'), 'false')
    assert.equal(await first.locator('canvas').getAttribute('aria-hidden'), 'false')
    assert.equal(await first.locator('img').getAttribute('src'), null)
    await first.getByRole('button', { name: /^Reproduzir demonstração/ }).click()
    await page.waitForFunction(() => document.querySelector('.exercise-demo img')?.naturalWidth === 1)
    assert.equal(await first.locator('.exercise-demo-toggle').getAttribute('aria-pressed'), 'true')
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('form:days'))), before)

    for (const card of await page.locator('.library-card').all()) {
      await card.scrollIntoViewIfNeeded()
      await card.locator('.exercise-demo[aria-busy="false"]').waitFor()
      assert.equal(await card.getByText('Demonstração indisponível.', { exact: true }).count(), 0)
    }
    await first.scrollIntoViewIfNeeded()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await first.getByRole('button', { name: /^Reproduzir demonstração/ }).waitFor()
    assert.equal(await first.locator('canvas').getAttribute('aria-hidden'), 'false')
    await first.getByRole('button', { name: /^Reproduzir demonstração/ }).click()
    assert.equal(await first.locator('.exercise-demo-toggle').getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await first.getByRole('button', { name: /^Pause demonstration/ }).waitFor()

    // Existing saved alternatives must select their own GIF in the workout.
    await page.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('form:days'))
      days.find(day => day.id === 'lower').exercises.find(exercise => exercise.id === 'squat-legpress').variantId = 'leg-press'
      localStorage.setItem('form:days', JSON.stringify(days))
    })
    await page.reload()
    await page.locator('.training-day-card').filter({ hasText: 'Lower & Core' }).click()
    const legPress = page.locator('[data-exercise-id="squat-legpress"]')
    await legPress.locator('.exercise-demo[aria-busy="false"]').waitFor()
    assert.equal(await legPress.locator('.exercise-demo-name').innerText(), '45° Leg Press')
    await legPress.getByRole('button', { name: /^Play demonstration/ }).click()
    assert.match(await legPress.locator('img').getAttribute('src'), /2Qh2J1e\.gif$/)
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth)
    }
    assert.deepEqual(errors, [])
    console.log('Passed: GIF coverage for all 26 exercises and 40 variants, playback/pause, reduced motion, retry, bilingual labels, saved variants and responsive controls.')
  } finally { await context.close() }
}
