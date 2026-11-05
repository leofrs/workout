import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { checkProgramExplanation } from './program-explanation.mjs'
import { checkVTaper } from './v-taper.mjs'

const browser = await chromium.launch({ headless: true })
const baseURL = process.env.FORM_TEST_URL || 'http://localhost:5173'
const errors = []
const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
page.on('pageerror', error => errors.push(error.message))
const language = () => page.locator('html').getAttribute('lang')
const storage = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== 'form:language')))
const switchTo = async (name, expected) => {
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForFunction(lang => document.documentElement.lang === lang, expected)
}
const navigate = async name => {
  if (await page.getByRole('button', { name: /Abrir navegação|Open navigation/ }).isVisible()) {
    await page.getByRole('button', { name: /Abrir navegação|Open navigation/ }).click()
  }
  await page.getByRole('navigation').getByRole('button', { name }).click()
}

try {
  await checkVTaper(browser, baseURL)
  await checkProgramExplanation(browser, baseURL)
  await page.goto(baseURL)
  await page.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
  assert.equal(await language(), 'pt-BR')
  assert.equal(await page.title(), 'FORM — Seu treino, com propósito.')
  assert.match(await page.locator('.day-tab-bottom').first().innerText(), /6 exercícios/)
  assert.match(await page.locator('.week-range').innerText(), /de /)

  // Custom text, exercise settings and a live workout must survive language changes.
  await page.getByRole('button', { name: 'Adicionar anotação ao treino' }).click()
  await page.getByRole('textbox', { name: 'Anotação do treino' }).fill('Meu lembrete: respirar e manter o ritmo.')
  await page.getByRole('button', { name: 'Opções do programa' }).click()
  await page.getByRole('button', { name: 'Renomear programa' }).click()
  await page.getByLabel('Nome do programa', { exact: true }).fill('Meu treino pessoal')
  await page.getByRole('button', { name: 'Salvar nome', exact: true }).click()
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Agachamento búlgaro ou passada, série 1, peso', exact: true }).fill('100.5')
  await page.getByRole('button', { name: 'Concluir Agachamento búlgaro ou passada, série 1', exact: true }).click()
  const before = await storage()
  await switchTo('English', 'en')
  assert.deepEqual(await storage(), before)
  await page.getByRole('heading', { name: 'Meu treino pessoal', exact: true }).waitFor()
  assert.equal(await page.getByRole('textbox', { name: 'Workout note' }).inputValue(), 'Meu lembrete: respirar e manter o ritmo.')
  assert.equal(await page.getByRole('spinbutton', { name: 'Bulgarian Split Squat or Lunge set 1 weight', exact: true }).inputValue(), '100.5')
  await page.getByRole('button', { name: 'Unmark Bulgarian Split Squat or Lunge set 1', exact: true }).waitFor()
  await page.reload()
  assert.equal(await language(), 'en')
  await page.getByRole('button', { name: 'Finish workout', exact: true }).first().click()
  await page.getByRole('button', { name: 'Save & finish workout' }).click()
  await page.getByRole('dialog', { name: 'That’s work well done.' }).waitFor()
  assert.match(await page.locator('.summary-stats').innerText(), /1,206/)
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await switchTo('Português do Brasil', 'pt-BR')
  await navigate('Histórico de treinos')
  await page.getByRole('button', { name: 'Ver resumo de Corpo inteiro' }).click()
  assert.match(await page.locator('.summary-stats').innerText(), /1\.206/)
  await page.getByRole('button', { name: 'Fechar janela' }).click()

  // Translated filters retain canonical values and both languages remain searchable.
  await navigate('Biblioteca de exercícios')
  assert.equal(await page.locator('.library-card').count(), 26)
  await page.getByRole('textbox', { name: 'Buscar na biblioteca de exercícios' }).fill('triceps')
  assert.equal(await page.locator('.library-card').count(), 3)
  await switchTo('English', 'en')
  await page.getByRole('textbox', { name: 'Search exercise library' }).fill('elevação')
  assert.equal(await page.locator('.library-card').count(), 3)
  await switchTo('Português do Brasil', 'pt-BR')
  await page.getByRole('button', { name: 'Limpar busca' }).click()
  await page.getByRole('combobox', { name: 'Filtrar exercícios por músculo' }).selectOption({ label: 'Ombros' })
  assert.equal(await page.locator('.library-card').count(), 5)
  await switchTo('English', 'en')
  assert.equal(await page.getByRole('combobox', { name: 'Filter exercises by muscle' }).inputValue(), 'Shoulders')
  assert.equal(await page.locator('.library-card').count(), 5)
  await page.getByRole('combobox', { name: 'Filter exercises by muscle' }).selectOption('All muscles')
  await switchTo('Português do Brasil', 'pt-BR')
  await page.getByRole('textbox', { name: 'Buscar na biblioteca de exercícios' }).fill('Bulgarian')
  assert.equal(await page.locator('.library-card').count(), 1)
  await page.getByRole('heading', { name: 'Agachamento búlgaro ou passada' }).waitFor()

  await navigate('Meu programa')
  await page.getByRole('button', { name: 'Adicionar exercício', exact: true }).click()
  await page.getByRole('dialog', { name: 'Monte seu treino' }).waitFor()
  await page.getByRole('textbox', { name: 'Buscar exercícios para adicionar' }).fill('supino')
  await page.getByRole('button', { name: 'Adicionar Supino inclinado com halteres', exact: true }).click()
  await page.getByRole('button', { name: 'Supino inclinado com halteres já adicionado' }).waitFor()
  await page.getByRole('button', { name: 'Concluir', exact: true }).click()

  // The switch remains visible and the page fits narrow screens in either language.
  for (const width of [320, 375, 480, 481, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [name, expected] of [['English', 'en'], ['Português do Brasil', 'pt-BR']]) {
      await switchTo(name, expected)
      assert.ok(await page.getByRole('button', { name: 'Português do Brasil' }).isVisible())
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}px in ${expected}`)
      const programOptions = page.getByRole('button', { name: /^(Opções do programa|Program options)$/ })
      await programOptions.click()
      const menu = page.locator('.heading-actions .menu-popover')
      await menu.waitFor({ state: 'visible' })
      const bounds = await menu.boundingBox()
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width, `Program menu clipped at ${width}px in ${expected}`)
      await programOptions.click()
    }
  }
  await page.setViewportSize({ width: 375, height: 900 })
  await page.screenshot({ path: '/tmp/form-pt-br-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  const dismissNotification = page.getByRole('button', { name: 'Dispensar notificação' })
  if (await dismissNotification.isVisible()) await dismissNotification.click()
  await page.getByRole('navigation').getByRole('button', { name: 'Meu programa' }).click()
  await page.screenshot({ path: '/tmp/form-pt-br-desktop.png', fullPage: true })
  await page.reload()
  assert.equal(await language(), 'pt-BR')
  await page.getByRole('heading', { name: 'Meu treino pessoal', exact: true }).waitFor()

  const english = await browser.newContext({ locale: 'en-US' })
  const englishPage = await english.newPage()
  await englishPage.goto(baseURL)
  await englishPage.getByRole('heading', { name: 'V-Taper & Arms', exact: true }).waitFor()
  assert.equal(await englishPage.locator('html').getAttribute('lang'), 'en')
  await english.close()
  assert.deepEqual(errors, [])
  console.log('Passed: language detection and persistence, translations, live workout preservation, localized history, bilingual search, filters, add exercise, and responsive layouts.')
} finally {
  await browser.close()
}
