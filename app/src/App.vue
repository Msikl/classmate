<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useReminder } from '@/composables/useReminder'
import { useSettings } from '@/composables/useSettings'

const { poll, reloadSchedule } = useReminder()
const { settings } = useSettings()

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 装载未来 7 天提醒，并每 60s 轮询到点提醒
  reloadSchedule()
  timer = setInterval(() => poll(), 60 * 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 设置变化（开学日期/提醒分钟/开关）时重装调度
watch(settings, () => reloadSchedule(), { deep: true })
</script>

<template>
  <RouterView />
</template>

<style>
/* 全局基础样式：移动端优先 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f5f6f8;
  color: #1f2329;
  -webkit-font-smoothing: antialiased;
}
</style>
