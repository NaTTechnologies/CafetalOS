import { vi } from 'vitest'
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
window.api = { app: { getInfo: vi.fn(async () => ({ version: '2.0.0', mode: 'demo' })) }, on: vi.fn() }
