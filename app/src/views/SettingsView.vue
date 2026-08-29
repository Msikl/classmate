<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from '@/composables/useSettings'
import { useCourses } from '@/composables/useCourses'
import type { Course } from '@/types/course'

const router = useRouter()
const { settings, updateSettings } = useSettings()
const { importCourses, syncState } = useCourses()

/** 表单草稿（本地编辑，保存时统一写入） */
const form = ref({
  startDate: settings.value.startDate,
  totalWeeks: settings.value.totalWeeks,
  notificationEnabled: settings.value.notificationEnabled,
  notificationMinutes: settings.value.notificationMinutes,
})

/** 同步设置变化到表单（如从外部重置） */
watch(settings, (s) => {
  form.value.startDate = s.startDate
  form.value.totalWeeks = s.totalWeeks
  form.value.notificationEnabled = s.notificationEnabled
  form.value.notificationMinutes = s.notificationMinutes
})

/** 总周数输入合法性 */
const weeksValid = computed(() => form.value.totalWeeks >= 1 && form.value.totalWeeks <= 30)
const minutesValid = computed(() => form.value.notificationMinutes >= 0 && form.value.notificationMinutes <= 120)

function save() {
  updateSettings({
    startDate: form.value.startDate,
    totalWeeks: form.value.totalWeeks,
    notificationEnabled: form.value.notificationEnabled,
    notificationMinutes: form.value.notificationMinutes,
  })
}

function back() {
  router.back()
}

/** P4 手动导入：粘贴 JSON 课程数组 */
const importText = ref('')
const importMessage = ref('')

/** 上次同步时间（可读文本） */
const lastSyncText = computed(() => {
  const t = syncState.value.lastSyncTime
  if (!t) return '尚未同步'
  return new Date(t).toLocaleString('zh-CN')
})

function handleImport() {
  importMessage.value = ''
  const trimmed = importText.value.trim()
  if (!trimmed) {
    importMessage.value = '请先粘贴课程 JSON'
    return
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!Array.isArray(parsed)) {
      importMessage.value = '格式错误：应为 JSON 数组'
      return
    }
    const list = parsed as Array<Record<string, unknown>>
    // 校验必要字段，转换为 Course 草稿
    const drafts: Array<Omit<Course, 'id' | 'color'>> = []
    for (const item of list) {
      const day = Number(item.dayOfWeek)
      const sp = Number(item.startPeriod)
      const ep = Number(item.endPeriod)
      const name = String(item.name ?? '').trim()
      if (!name || ![1, 2, 3, 4, 5, 6, 7].includes(day) || !(sp >= 1) || !(ep >= sp)) continue
      drafts.push({
        name,
        teacher: item.teacher ? String(item.teacher) : undefined,
        classroom: item.classroom ? String(item.classroom) : undefined,
        dayOfWeek: day as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        startPeriod: sp,
        endPeriod: ep,
      })
    }
    const added = importCourses(drafts)
    importMessage.value = `导入完成：成功 ${added} 条，跳过 ${drafts.length - added} 条（重复或非法）`
    importText.value = ''
  } catch {
    importMessage.value = 'JSON 解析失败，请检查格式'
  }
}
</script>

<template>
  <div class="settings">
    <header class="settings__header">
      <button class="settings__back" type="button" @click="back">← 返回</button>
      <h1 class="settings__title">设置</h1>
      <button class="settings__save" type="button" @click="save">保存</button>
    </header>

    <section class="settings__group">
      <label class="settings__row">
        <span class="settings__label">开学日期</span>
        <input v-model="form.startDate" class="settings__input" type="date" />
      </label>
      <label class="settings__row">
        <span class="settings__label">总周数</span>
        <input v-model.number="form.totalWeeks" class="settings__input settings__input--sm" type="number" min="1" max="30" />
      </label>
      <p v-if="!weeksValid" class="settings__error">总周数应为 1–30</p>
    </section>

    <section class="settings__group">
      <div class="settings__row">
        <span class="settings__label">课前提醒</span>
        <button
          class="settings__toggle"
          :class="{ 'settings__toggle--on': form.notificationEnabled }"
          type="button"
          @click="form.notificationEnabled = !form.notificationEnabled"
        >
          {{ form.notificationEnabled ? '开' : '关' }}
        </button>
      </div>
      <label class="settings__row">
        <span class="settings__label">提前提醒（分钟）</span>
        <input v-model.number="form.notificationMinutes" class="settings__input settings__input--sm" type="number" min="0" max="120" />
      </label>
      <p v-if="!minutesValid" class="settings__error">提前时间应为 0–120 分钟</p>
    </section>

    <!-- P4：数据导入（教务同步骨架：先以手动导入作为落库入口） -->
    <section class="settings__group">
      <div class="settings__row">
        <span class="settings__label">上次同步时间</span>
        <span class="settings__sync-time">{{ lastSyncText }}</span>
      </div>
      <div class="settings__import">
        <textarea
          v-model="importText"
          class="settings__textarea"
          rows="4"
          placeholder='粘贴课程 JSON 数组，如 [{"name":"高数","dayOfWeek":1,"startPeriod":1,"endPeriod":2}]'
        />
        <button class="settings__import-btn" type="button" @click="handleImport">导入课程</button>
        <p v-if="importMessage" class="settings__import-msg">{{ importMessage }}</p>
      </div>
    </section>

    <p class="settings__hint">
      教务自动抓取（P4）需接入具体教务系统（登录/抓课表），当前以手动导入作为数据入口；真实原生课前通知（P3）待 Capacitor 壳与插件就绪后启用。
    </p>
  </div>
</template>

<style scoped>
.settings {
  min-height: 100vh;
  background-color: #f5f6f8;
}
.settings__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 10px;
  background-color: #fff;
  border-bottom: 1px solid #e5e6eb;
  position: sticky;
  top: 0;
  z-index: 5;
}
.settings__back {
  border: none;
  background: transparent;
  color: #4e79a7;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
}
.settings__title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  text-align: center;
  color: #1f2329;
}
.settings__save {
  border: none;
  background: #4e79a7;
  color: #fff;
  font-size: 14px;
  border-radius: 6px;
  padding: 6px 14px;
  font-weight: 600;
  cursor: pointer;
}
.settings__group {
  background-color: #fff;
  margin: 12px;
  border-radius: 10px;
  padding: 4px 14px;
}
.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f5f6f8;
}
.settings__row:last-child {
  border-bottom: none;
}
.settings__label {
  font-size: 14px;
  color: #1f2329;
}
.settings__input {
  height: 34px;
  padding: 0 8px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2329;
  min-width: 130px;
}
.settings__input--sm {
  width: 72px;
  min-width: 72px;
  text-align: center;
}
.settings__toggle {
  height: 30px;
  min-width: 56px;
  border: 1px solid #e5e6eb;
  border-radius: 16px;
  background-color: #eef0f3;
  color: #86909c;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.settings__toggle--on {
  background-color: #4e79a7;
  border-color: #4e79a7;
  color: #fff;
}
.settings__error {
  font-size: 12px;
  color: #e15759;
  margin: -6px 0 10px;
}
.settings__hint {
  font-size: 12px;
  color: #86909c;
  margin: 18px 14px 0;
}
.settings__sync-time {
  font-size: 13px;
  color: #4e5969;
}
.settings__import {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 0 14px;
}
.settings__textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 72px;
  padding: 8px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 12px;
  font-family: inherit;
  color: #1f2329;
  resize: vertical;
}
.settings__import-btn {
  height: 38px;
  border: none;
  border-radius: 8px;
  background-color: #4e79a7;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.settings__import-msg {
  font-size: 12px;
  color: #4e5969;
  margin: 0;
}
</style>
