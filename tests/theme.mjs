import assert from 'node:assert/strict'

export async function checkTheme(browser, baseURL) {
  const context = await browser.newContext({ locale: 'pt-BR', colorScheme: 'dark', reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const expectTheme = async theme => {
    await page.waitForFunction(expected => document.documentElement.dataset.theme === expected && getComputedStyle(document.documentElement).colorScheme === expected && getComputedStyle(document.body).backgroundColor === (expected === 'dark' ? 'rgb(10, 10, 10)' : 'rgb(250, 250, 250)'), theme)
    const colors = await page.evaluate(() => ({ body: getComputedStyle(document.body).backgroundColor, surface: getComputedStyle(document.querySelector('.topbar')).backgroundColor }))
    assert.notEqual(colors.body, colors.surface, 'Cards and canvas need distinct surfaces')
    assert.equal(colors.body, theme === 'dark' ? 'rgb(10, 10, 10)' : 'rgb(250, 250, 250)')
  }
  const navigate = async name => page.getByRole('navigation').getByRole('button', { name }).click()
  try {
    await page.goto(baseURL)
    await page.getByRole('heading', { name: 'V-Taper e Braços', exact: true }).waitFor()
    await expectTheme('dark')
    assert.equal(await page.evaluate(() => localStorage.getItem('form:theme')), null)
    await page.emulateMedia({ colorScheme: 'light' })
    await expectTheme('light')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expectTheme('dark')

    // Toggling the theme must preserve the current workout and entered values.
    await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click()
    const complete = page.getByRole('button', { name: 'Concluir Agachamento búlgaro ou passada, série 1', exact: true })
    const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== 'form:theme')))
    await page.getByRole('button', { name: 'Ativar tema claro', exact: true }).click()
    await expectTheme('light')
    assert.ok(await complete.isEnabled())
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key !== 'form:theme'))), before)
    await page.reload()
    await page.locator('.training-day-card').filter({ hasText: 'Corpo inteiro' }).click()
    await expectTheme('light')
    assert.ok(await complete.isEnabled())
    await page.emulateMedia({ colorScheme: 'light' })
    await page.emulateMedia({ colorScheme: 'dark' })
    await expectTheme('light')

    // Exercise the accessible control with the keyboard and both languages.
    await page.getByRole('button', { name: 'Ativar tema escuro', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expectTheme('dark')
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('button', { name: 'Switch to light theme', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Português do Brasil', exact: true }).click()

    for (const theme of ['dark', 'light']) {
      if (theme === 'light') await page.getByRole('button', { name: 'Ativar tema claro', exact: true }).click()
      await expectTheme(theme)
      const contrast = await page.evaluate(() => {
        const css = getComputedStyle(document.documentElement)
        const luminance = name => css.getPropertyValue(`--${name}`).trim().split(/\s+/).map(Number).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
        return [['muted', 'canvas'], ['muted', 'surface'], ['muted', 'surface-muted'], ['muted', 'accent-soft'], ['on-accent', 'accent']].map(([fg, bg]) => {
          const values = [luminance(fg), luminance(bg)].sort((a, b) => a - b)
          return { fg, bg, ratio: (values[1] + 0.05) / (values[0] + 0.05) }
        })
      })
      for (const { fg, bg, ratio } of contrast) assert.ok(ratio >= 4.5, `${theme}: ${fg} on ${bg} contrast ${ratio} is below 4.5:1`)
      await navigate('Biblioteca de exercícios')
      assert.equal(await page.locator('.library-card').count(), 26)
      await navigate('Histórico de treinos')
      await page.getByRole('button', { name: 'Preferências', exact: true }).click()
      await page.getByRole('dialog').waitFor()
      const field = page.getByLabel('Seu nome', { exact: true })
      assert.equal(await field.evaluate(el => getComputedStyle(el).backgroundColor), theme === 'dark' ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)')
      await page.getByRole('button', { name: 'Fechar janela', exact: true }).click()
      await navigate('Meu programa')
      for (const width of [320, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth, null, { timeout: 3000 }).catch(() => {})
        assert.ok(await page.locator('.theme-toggle').isVisible())
        const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => {
          const rect = el.getBoundingClientRect()
          return rect.width > 0 && rect.right > innerWidth + 1
        }).map(el => `${el.tagName}.${el.className} ${Math.round(el.getBoundingClientRect().x)}:${Math.round(el.getBoundingClientRect().width)}`).slice(0, 10))
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow in ${theme} at ${width}px: ${overflow.join(', ')}`)
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: `/tmp/form-theme-${theme}-desktop.png` })
      await page.setViewportSize({ width: 375, height: 900 })
      await page.screenshot({ path: `/tmp/form-theme-${theme}-mobile.png` })
      await page.setViewportSize({ width: 1440, height: 1000 })
    }
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }

  // An invalid saved preference must fall back to the system theme.
  const invalid = await browser.newContext({ colorScheme: 'dark' })
  try {
    await invalid.addInitScript(() => localStorage.setItem('form:theme', '"invalid"'))
    const fresh = await invalid.newPage()
    await fresh.goto(baseURL)
    await fresh.getByRole('button', { name: /Switch to light theme|Ativar tema claro/ }).waitFor()
    assert.equal(await fresh.locator('html').getAttribute('data-theme'), 'dark')
  } finally {
    await invalid.close()
  }
  console.log('Passed: system theme, keyboard toggle, persistence, workout preservation, themed fields, translations, and responsive themes.')
}
