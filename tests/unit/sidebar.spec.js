import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppSidebar from '@/components/AppSidebar.vue'
describe('AppSidebar', () => {
  it('marks the active route and emits navigation', async () => {
    const wrapper = mount(AppSidebar, { props: { currentPage: 'lotes', collapsed: false, version: '2.0.0' } })
    expect(wrapper.get('[aria-current="page"]').text()).toContain('Lotes')
    const harvest = wrapper.findAll('button').find(button => button.text().includes('Cosecha'))
    await harvest.trigger('click')
    expect(wrapper.emitted('navigate')[0]).toEqual(['cosecha'])
  })
})
