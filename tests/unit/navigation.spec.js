import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { getNavigationItem, navigationItems } from '@/config/navigation'

describe('navigation', () => {
  it('contains unique module ids', () => expect(new Set(navigationItems.map(i => i.id)).size).toBe(navigationItems.length))
  it('falls back to dashboard for an unknown module', () => expect(getNavigationItem('missing').id).toBe('inicio'))
  it('includes all critical production modules', () => expect(navigationItems.map(i => i.id)).toEqual(expect.arrayContaining(['finca','lotes','cosecha','beneficio','inventario','gastos','reportes','calidad','configuracion'])))

  it('keeps every visible legacy module mountable', () => {
    const hostSource = fs.readFileSync('src/renderer/src/views/LegacyModuleView.vue', 'utf8')
    const nativeViews = new Set(['inicio', 'configuracion'])
    for (const item of navigationItems.filter(item => !nativeViews.has(item.id))) {
      const moduleSource = fs.readFileSync(`src/renderer/public/legacy/${item.id}.js`, 'utf8')
      expect(hostSource).toContain(`${item.id}:`)
      expect(moduleSource).toMatch(/\b(?:async\s+)?cargar\s*\(/)
    }
  })
})
