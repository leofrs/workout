import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { checkProgramExplanation } from './program-explanation.mjs'
import { checkVTaper } from './v-taper.mjs'
import { checkDetailedHistory } from './detailed-history.mjs'
import { checkRir } from './rir.mjs'
import { checkWorkoutFeed } from './workout-feed.mjs'
import { checkTheme } from './theme.mjs'

const browser = await chromium.launch({ headless: true })
const baseURL = process.env.FORM_TEST_URL || 'http://localhost:5173'
const errors = []
const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
const page = await context.newPage()
page.setDefaultTimeout(10_000)
page.on('pageerror', error => errors.push(error.message))
const storage = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== 'form:language')))
const switchTo = async (name, expected) => {
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForFunction(lang => document.documentElement.lang === lang, expected)
}
const navigate = async name => {
  const menu = page.getByRole('button', { name: /Abrir navegação|Open navigation/ })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('navigation').getByRole('button', { name }).click()
}

try {
  await checkWorkoutFeed(browser, baseURL)
  await checkTheme(browser, baseURL)
  await checkDetailedHistory(browser, baseURL)
  await checkRir(browser, baseURL)
  await checkVTaper(browser, baseURL)
  await checkProgramExplanation(browser, baseURL)
  await page.goto(baseURL)
  await page.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'), 'pt-BR')
  assert.equal(await page.title(), 'FORM — Seu treino, com propósito.')
  await page.getByRole('button', { name: 'Opções do programa' }).click()
  await page.getByRole('button', { name: 'Renomear programa' }).click()
  await page.getByLabel('Nome do programa', { exact: true }).fill('Meu treino pessoal')
  await page.getByRole('button', { name: 'Salvar nome', exact: true }).click()
  await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
  await page.getByRole('button', { name: 'Concluir Agachamento búlgaro ou passada, série 1', exact: true }).click()
  await page.getByRole('button', { name: 'Pular descanso', exact: true }).click()
  const before = await storage()
  await switchTo('English', 'en')
  assert.deepEqual(await storage(), before)
  await page.getByRole('button', { name: 'Unmark Bulgarian Split Squat or Lunge set 1', exact: true }).waitFor()
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')
  await page.getByRole('heading', { name: 'Meu treino pessoal', exact: true }).waitFor()
  await page.locator('.training-day-card').filter({ hasText: 'Full Body' }).click()
  await page.getByRole('button', { name: 'Finish workout', exact: true }).click()
  await page.getByRole('button', { name: 'Save & finish workout' }).click()
  await page.getByRole('dialog', { name: 'That’s work well done.' }).waitFor()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await switchTo('Português do Brasil', 'pt-BR')
  await navigate('Histórico de treinos')
  await page.getByRole('button', { name: 'Ver resumo de Corpo inteiro' }).click()
  assert.match(await page.locator('.workout-details').innerText(), /Agachamento búlgaro/)
  await page.getByRole('button', { name: 'Fechar janela' }).click()

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
  await page.getByRole('combobox', { name: 'Filter exercises by muscle' }).selectOption('All muscles')
  await switchTo('Português do Brasil', 'pt-BR')
  await page.getByRole('textbox', { name: 'Buscar na biblioteca de exercícios' }).fill('inclinado')
  await page.locator('.library-card').getByRole('button').click()
  assert.equal(await page.locator('.library-card').getByRole('button').isDisabled(), true)

  await navigate('Meu programa')
  for (const width of [320, 375, 480, 481, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [name, expected] of [['English', 'en'], ['Português do Brasil', 'pt-BR']]) {
      await switchTo(name, expected)
      assert.ok(await page.getByRole('button', { name: 'Português do Brasil' }).isVisible())
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px in ${expected}`)
      const options = page.getByRole('button', { name: /^(Opções do programa|Program options)$/ })
      await options.click()
      const menu = page.locator('.heading-actions .menu-popover')
      const bounds = await menu.boundingBox()
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width, `Program menu clipped at ${width}px`)
      await options.click()
    }
  }
  await page.reload()
  await page.getByRole('heading', { name: 'Meu treino pessoal', exact: true }).waitFor()
  const english = await browser.newContext({ locale: 'en-US' })
  const englishPage = await english.newPage()
  await englishPage.goto(baseURL)
  await englishPage.getByRole('heading', { name: 'V-Taper & Arms', exact: true }).waitFor()
  assert.equal(await englishPage.locator('html').getAttribute('lang'), 'en')
  await english.close()
  assert.deepEqual(errors, [])
  console.log('Passed: language detection/persistence, custom names, live workout preservation, history, bilingual search, filters, exercise addition and responsive menus.')
} finally { await browser.close() }
