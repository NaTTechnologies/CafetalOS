import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('drawer móvil', () => {
  const responsiveCss = fs.readFileSync('src/renderer/src/assets/styles/responsive.css', 'utf8')
  const screenshotTest = fs.readFileSync('tests/e2e/screenshots.spec.js', 'utf8')

  it('deja el fondo de cierre fuera del área ocupada por el sidebar', () => {
    expect(responsiveCss).toContain('inset: 0 0 0 var(--mobile-sidebar)')
  })

  it('cierra el menú mediante el área expuesta y valida el estado final', () => {
    expect(screenshotTest).toContain('closeMobileNavigation(page)')
    expect(screenshotTest).toContain("not.toHaveClass(/mobile-menu-open/)")
  })
})
