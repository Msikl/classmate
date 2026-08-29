<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useReminder, requestWebNotificationPermission } from '@/composables/useReminder'
import { useSettings } from '@/composables/useSettings'
import { useCourses } from '@/composables/useCourses'

const { poll, reloadSchedule, isNative } = useReminder()
const { settings } = useSettings()
const { courses } = useCourses()

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 装载整学期提醒，并每 60s 轮询到点提醒（Web）
  reloadSchedule()
  timer = setInterval(() => poll(), 60 * 1000)
  // 仅当已开启提醒时才请求 Web 通知权限（避免首启打扰，UX-B1）
  if (settings.value.notificationEnabled && !isNative) {
    requestWebNotificationPermission()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 设置变化（开学日期/提醒分钟/开关）或课程变化时重排既有通知（原生端先 cancel 再排，避免残留）
watch(settings, () => reloadSchedule(), { deep: true })
watch(courses, () => reloadSchedule(), { deep: true })
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
