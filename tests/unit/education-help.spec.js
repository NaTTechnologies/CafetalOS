import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('educación y ayuda adaptativa', () => {
  const education = fs.readFileSync('src/renderer/public/legacy/educacion.js', 'utf8')
  const help = fs.readFileSync('src/renderer/public/legacy/ayuda.js', 'utf8')
  const responsive = fs.readFileSync('src/renderer/src/assets/styles/responsive.css', 'utf8')

  it('incluye rutas, progreso y evaluaciones', () => {
    expect(education).toContain('getProgress')
    expect(education).toContain('saveQuiz')
    expect(education).toMatch(/complet/i)
  })

  it('ofrece navegación móvil en ayuda', () => {
    expect(help).toContain('help-mobile-select')
    expect(responsive).toContain('.help-layout')
    expect(responsive).toContain('.help-navigation')
  })
})
