import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import LoginView from '@/views/LoginView.vue'

describe('LoginView accessibility', () => {
  it('provides unique labels for username and password fields', () => {
    window.api = { auth: { login: vi.fn() } }
    const wrapper = mount(LoginView)

    expect(wrapper.get('label[for="login-username"]').text()).toBe('Usuario')
    expect(wrapper.get('#login-username').attributes('name')).toBe('username')
    expect(wrapper.get('label[for="login-password"]').text()).toBe('Contraseña')
    expect(wrapper.get('#login-password').attributes('name')).toBe('password')
    expect(wrapper.get('button[aria-label="Mostrar contraseña"]').exists()).toBe(true)
    expect(wrapper.find('label button').exists()).toBe(false)
  })
})
