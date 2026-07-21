<script setup>
defineProps({ label: String, value: [String, Number], detail: String, icon: Object, tone: { type: String, default: 'coffee' } })
</script>
<template>
  <article class="stat-card" :data-tone="tone">
    <div class="stat-icon"><component :is="icon" :size="21" /></div>
    <div><p>{{ label }}</p><strong>{{ value }}</strong><small>{{ detail }}</small></div>
  </article>
</template>
