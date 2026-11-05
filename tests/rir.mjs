import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

export async function checkRir(browser, baseURL) {
  const contexts = []
  const errors = []
  const fresh = async (locale = 'pt-BR') => {
    const context = await browser.newContext({ locale, viewport: { width: 1440, height: 1000 } })
    contexts.push(context)
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(baseURL)
    await page.getByRole('heading', { name: locale === 'pt-BR' ? 'V-Taper e Braços' : 'V-Taper & Arms', exact: true }).waitFor()
    return page
  }
  const navigate = async (page, name) => {
    const menu = page.getByRole('button', { name: /Abrir navegação|Open navigation/ })
    if (await menu.isVisible()) await menu.click()
    await page.getByRole('navigation').getByRole('button', { name, exact: true }).click()
  }
  const close = page => page.getByRole('button', { name: /Fechar janela|Close dialog/, exact: true }).click()
  const start = page => page.getByRole('button', { name: /Iniciar treino|Resume workout|Let’s get started/, exact: true }).click()
  const finish = async page => {
    await page.getByRole('button', { name: /Finalizar treino|Finish workout/, exact: true }).first().click()
    await page.getByRole('button', { name: /Salvar e finalizar treino|Save & finish workout/, exact: true }).click()
    await page.getByRole('dialog', { name: /Treino concluído\. Bom trabalho!|That’s work well done\./ }).waitFor()
  }
  const history = page => page.evaluate(() => JSON.parse(localStorage.getItem('form:history')))
  const session = page => page.evaluate(() => JSON.parse(localStorage.getItem('form:session')))

  try {
    const page = await fresh('pt-BR')
    await page.getByRole('tab').filter({ hasText: 'Superiores 1' }).click()

    // 1. Completing workout without RIR (optional, no blocker, finish works)
    await start(page)
    const ex1Weight = page.getByLabel('Puxada frontal aberta, série 1, peso', { exact: true })
    const ex1Reps = page.getByLabel('Puxada frontal aberta, série 1, repetições', { exact: true })
    const ex1Rir1 = page.getByLabel('Puxada frontal aberta, série 1, RIR', { exact: true })
    const ex1Done1 = page.getByRole('button', { name: 'Concluir Puxada frontal aberta, série 1', exact: true })

    // Check RIR options in Portuguese
    await ex1Rir1.waitFor()
    const options = await ex1Rir1.evaluate(select => Array.from(select.options).map(o => o.text))
    assert.deepEqual(options, ['—', '0', '1', '2', '3', '4+', 'Não sei'])

    // Initial value is empty
    assert.equal(await ex1Rir1.inputValue(), '')

    // Fill weight & reps, leave RIR empty
    await ex1Weight.fill('60')
    await ex1Reps.fill('10')
    // Can complete without filling RIR
    assert.equal(await ex1Done1.isEnabled(), true)
    await ex1Done1.click()
    await page.getByRole('button', { name: 'Desmarcar Puxada frontal aberta, série 1', exact: true }).waitFor()

    // 2. Distinguishing 0, unknown, empty, and numeric RIR values in data
    const ex1Rir2 = page.getByLabel('Puxada frontal aberta, série 2, RIR', { exact: true })
    const ex1Done2 = page.getByRole('button', { name: 'Concluir Puxada frontal aberta, série 2', exact: true })
    await ex1Rir2.selectOption('0')
    await page.getByLabel('Puxada frontal aberta, série 2, peso', { exact: true }).fill('60')
    await ex1Done2.click()
    await page.getByRole('button', { name: 'Desmarcar Puxada frontal aberta, série 2', exact: true }).waitFor()

    const ex1Rir3 = page.getByLabel('Puxada frontal aberta, série 3, RIR', { exact: true })
    const ex1Done3 = page.getByRole('button', { name: 'Concluir Puxada frontal aberta, série 3', exact: true })
    await ex1Rir3.selectOption('unknown')
    await page.getByLabel('Puxada frontal aberta, série 3, peso', { exact: true }).fill('60')
    await ex1Done3.click()
    await page.getByRole('button', { name: 'Desmarcar Puxada frontal aberta, série 3', exact: true }).waitFor()

    const ex1Rir4 = page.getByLabel('Puxada frontal aberta, série 4, RIR', { exact: true })
    const ex1Done4 = page.getByRole('button', { name: 'Concluir Puxada frontal aberta, série 4', exact: true })
    await ex1Rir4.selectOption('2')
    await page.getByLabel('Puxada frontal aberta, série 4, peso', { exact: true }).fill('60')
    await ex1Done4.click()
    await page.getByRole('button', { name: 'Desmarcar Puxada frontal aberta, série 4', exact: true }).waitFor()

    // Check active session data in localStorage
    const currentSession = await session(page)
    const sets = currentSession.logs['wide-pulldown']
    assert.equal(sets[0].rir, undefined) // empty / unanswered
    assert.equal(sets[1].rir, '0')       // RIR 0
    assert.equal(sets[2].rir, 'unknown') // Não sei
    assert.equal(sets[3].rir, '2')       // RIR 2

    // 3. Values survive reload during active session and can be corrected
    await page.reload()
    const expandBtn = page.getByRole('button', { name: 'Expandir Puxada frontal aberta', exact: true })
    if (await expandBtn.isVisible()) await expandBtn.click()
    assert.equal(await page.getByLabel('Puxada frontal aberta, série 1, RIR', { exact: true }).inputValue(), '')
    assert.equal(await page.getByLabel('Puxada frontal aberta, série 2, RIR', { exact: true }).inputValue(), '0')
    assert.equal(await page.getByLabel('Puxada frontal aberta, série 3, RIR', { exact: true }).inputValue(), 'unknown')
    assert.equal(await page.getByLabel('Puxada frontal aberta, série 4, RIR', { exact: true }).inputValue(), '2')

    // Correct set 4 from 2 to 4+, and set 1 from empty to 3, then set 1 back to empty
    await page.getByLabel('Puxada frontal aberta, série 4, RIR', { exact: true }).selectOption('4+')
    assert.equal((await session(page)).logs['wide-pulldown'][3].rir, '4+')

    await page.getByLabel('Puxada frontal aberta, série 1, RIR', { exact: true }).selectOption('3')
    assert.equal((await session(page)).logs['wide-pulldown'][0].rir, '3')
    await page.getByLabel('Puxada frontal aberta, série 1, RIR', { exact: true }).selectOption('')
    assert.equal((await session(page)).logs['wide-pulldown'][0].rir, undefined)
    assert.equal('rir' in (await session(page)).logs['wide-pulldown'][0], false)

    // Check RIR Guide
    const guide = page.locator('.rir-guide')
    assert.ok(await guide.isVisible())
    await guide.locator('summary').click()
    assert.match(await guide.innerText(), /nunca treine até a falha apenas para testar/)
    assert.match(await guide.innerText(), /Nota de evidência:/)

    // 4. Finalize workout and verify RIR in history details
    await finish(page)
    const savedRecord = (await history(page))[0]
    const savedSets = savedRecord.details.exercises.find(e => e.prescription.id === 'wide-pulldown').logs
    assert.equal(savedSets[0].rir, undefined)
    assert.equal('rir' in savedSets[0], false)
    assert.equal(savedSets[1].rir, '0')
    assert.equal(savedSets[2].rir, 'unknown')
    assert.equal(savedSets[3].rir, '4+')

    // Inspect Workout Details modal table
    const tableText = await page.locator('.saved-sets-table').first().innerText()
    assert.match(tableText, /RIR/)
    assert.match(tableText, /Não sei/)
    assert.match(tableText, /4\+/)
    await close(page)

    // 5. Consult RIR in next workout's "Último treino comparável"
    const nextExpand = page.getByRole('button', { name: 'Expandir Puxada frontal aberta', exact: true })
    if (await nextExpand.isVisible()) await nextExpand.click()
    const memory = page.locator('.previous-workout')
    assert.match(await memory.innerText(), /60 kg × 10/)    // set 1, no RIR
    assert.match(await memory.innerText(), /RIR 0/)          // set 2
    assert.match(await memory.innerText(), /RIR: Não sei/)   // set 3
    assert.match(await memory.innerText(), /RIR 4\+/)        // set 4

    // 6. Verify English translation and behavior
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.waitForFunction(() => document.documentElement.lang === 'en')
    assert.match(await memory.innerText(), /RIR 0/)
    assert.match(await memory.innerText(), /RIR: Don't know/)
    assert.match(await memory.innerText(), /RIR 4\+/)

    // Check Program Explanation RIR section
    await page.getByRole('button', { name: 'Understand your program', exact: true }).click()
    assert.match(await page.getByRole('dialog').innerText(), /Effort perception and RIR/)
    assert.match(await page.getByRole('dialog').innerText(), /Repetitions in Reserve/)
    await close(page)

    // 7. Timed plank mode in a live workout does NOT display RIR
    await page.getByRole('tab').filter({ hasText: 'Lower & Core' }).click()
    await start(page)
    await page.getByRole('button', { name: 'Expand Plank / Hanging Leg Raise', exact: true }).click()
    // Switch to plank (seconds)
    await page.getByLabel('Logging mode', { exact: true }).selectOption('seconds')
    // When timed, there is NO RIR header or select
    assert.equal(await page.locator('.set-table-timed').count(), 1)
    assert.equal(await page.locator('.set-table-timed select.set-rir-select').count(), 0)
    assert.equal(await page.locator('.exercise-details').filter({ hasText: 'Plank / Hanging Leg Raise' }).locator('.rir-guide').count(), 0)

    // Discard empty session
    await page.getByRole('button', { name: /Finalizar treino|Finish workout/, exact: true }).first().click()
    await page.getByRole('button', { name: /Descartar treino vazio|Discard empty session/, exact: true }).click()

    assert.equal(errors.length, 0, `Page errors: ${errors.join(', ')}`)
    console.log('Passed: RIR effort logging, distinguishing 0/unknown/empty, reload persistence, corrections, history details, last workout memory, evidence guide, timed exclusion, and English/Portuguese translations.')
  } finally {
    for (const context of contexts) await context.close()
  }
}
