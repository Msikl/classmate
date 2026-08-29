<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from '@/composables/useSettings'
import { useCourses } from '@/composables/useCourses'
import { usePeriods } from '@/composables/useSchedule'
import { buildDaySchedule } from '@/types/schedule'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { Course } from '@/types/course'

const router = useRouter()
const { settings, updateSettings, resetSettings } = useSettings()
const { importCourses, syncState } = useCourses()
const { periods } = usePeriods()

/** 表单草稿（本地编辑，保存时统一写入） */
const form = ref({
  startDate: settings.value.startDate,
  totalWeeks: settings.value.totalWeeks,
  classDurationMinutes: settings.value.classDurationMinutes,
  breakMinutes: settings.value.breakMinutes,
  morningStart: settings.value.morningStart,
  morningPeriods: settings.value.morningPeriods,
  noonStart: settings.value.noonStart,
  noonPeriods: settings.value.noonPeriods,
  eveningStart: settings.value.eveningStart,
  eveningPeriods: settings.value.eveningPeriods,
  notificationEnabled: settings.value.notificationEnabled,
  notificationMinutes: settings.value.notificationMinutes,
})

/** 同步设置变化到表单（如从外部重置） */
watch(settings, (s) => {
  form.value.startDate = s.startDate
  form.value.totalWeeks = s.totalWeeks
  form.value.classDurationMinutes = s.classDurationMinutes
  form.value.breakMinutes = s.breakMinutes
  form.value.morningStart = s.morningStart
  form.value.morningPeriods = s.morningPeriods
  form.value.noonStart = s.noonStart
  form.value.noonPeriods = s.noonPeriods
  form.value.eveningStart = s.eveningStart
  form.value.eveningPeriods = s.eveningPeriods
  form.value.notificationEnabled = s.notificationEnabled
  form.value.notificationMinutes = s.notificationMinutes
})

// 提醒开关 / 提前分钟数：即改即存（不依赖「保存」，避免 B3 的「开了没生效」困惑）
watch(
  () => [form.value.notificationEnabled, form.value.notificationMinutes],
  () => {
    updateSettings({
      notificationEnabled: form.value.notificationEnabled,
      notificationMinutes: form.value.notificationMinutes,
    })
  },
)

/** 总周数输入合法性 */
const weeksValid = computed(() => form.value.totalWeeks >= 1 && form.value.totalWeeks <= 30)
const classDurationValid = computed(() => form.value.classDurationMinutes >= 20 && form.value.classDurationMinutes <= 120)
const breakValid = computed(() => form.value.breakMinutes >= 0 && form.value.breakMinutes <= 60)
const minutesValid = computed(() => form.value.notificationMinutes >= 0 && form.value.notificationMinutes <= 120)
const periodsValid = computed(
  () => form.value.morningPeriods >= 0 && form.value.noonPeriods >= 0 && form.value.eveningPeriods >= 0,
)
/** 三段首节时间非空（防清空 → NaN → "NaN:NaN"） */
const timeValid = computed(
  () => !!form.value.morningStart && !!form.value.noonStart && !!form.value.eveningStart,
)
/** 所有设置项是否合法（save 门禁） */
const canSaveAll = computed(
  () => weeksValid.value && classDurationValid.value && breakValid.value && minutesValid.value && periodsValid.value && timeValid.value,
)

/** 总节数（三段和，预览用） */
const totalPeriodsPreview = computed(
  () => form.value.morningPeriods + form.value.noonPeriods + form.value.eveningPeriods,
)

/** 基于表单（未保存也实时）的节次预览：第几节=几点，供新手核对（B4） */
const periodPreview = computed(() => {
  const f = form.value
  return buildDaySchedule({
    classDuration: f.classDurationMinutes,
    breakMinutes: f.breakMinutes,
    sections: [
      { key: 'morning', start: f.morningStart || '08:00', count: Math.max(f.morningPeriods, 0) },
      { key: 'noon', start: f.noonStart || '14:00', count: Math.max(f.noonPeriods, 0) },
      { key: 'evening', start: f.eveningStart || '19:00', count: Math.max(f.eveningPeriods, 0) },
    ],
  })
})

function save() {
  if (!canSaveAll.value) return // 任一非法则不保存（代码审查 #2）
  updateSettings({
    startDate: form.value.startDate,
    totalWeeks: form.value.totalWeeks,
    classDurationMinutes: form.value.classDurationMinutes,
    breakMinutes: form.value.breakMinutes,
    morningStart: form.value.morningStart,
    morningPeriods: form.value.morningPeriods,
    noonStart: form.value.noonStart,
    noonPeriods: form.value.noonPeriods,
    eveningStart: form.value.eveningStart,
    eveningPeriods: form.value.eveningPeriods,
    notificationEnabled: form.value.notificationEnabled,
    notificationMinutes: form.value.notificationMinutes,
  })
}

/** 重置确认框是否可见（替代 window.confirm，兼容手机 App） */
const showResetConfirm = ref(false)

/** 点击「重置为默认」：打开确认框 */
function handleReset() {
  showResetConfirm.value = true
}

/** 确认后真正重置 */
function onResetConfirm() {
  resetSettings()
  showResetConfirm.value = false
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
      const maxP = periods.value.length
      // 校验必要字段 + 节次在合理区间内（代码审查 #3：导入越界课程跳过）
      if (!name || ![1, 2, 3, 4, 5, 6, 7].includes(day) || !(sp >= 1) || !(ep >= sp) || !((ep ?? 0) <= maxP)) continue
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
      <button class="settings__save" type="button" :disabled="!canSaveAll" @click="save">保存</button>
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

      <div class="settings__section-title">节次安排（共 {{ totalPeriodsPreview }} 节）</div>
      <p class="settings__hint">下面每节课几点起止，请对照你学校课表核对，不符再改。</p>

      <div class="settings__period-preview">
        <div
          v-for="p in periodPreview"
          :key="p.index"
          class="settings__period-preview-row"
        >
          <span class="settings__period-preview-index">第 {{ p.index }} 节</span>
          <span class="settings__period-preview-time">{{ p.startTime }} - {{ p.endTime }}</span>
        </div>
      </div>

      <label class="settings__row">
        <span class="settings__label">单节课时长（分钟）</span>
        <input v-model.number="form.classDurationMinutes" class="settings__input settings__input--sm" type="number" min="20" max="120" />
      </label>
      <p v-if="!classDurationValid" class="settings__error">单节课时长应为 20–120 分钟</p>

      <label class="settings__row">
        <span class="settings__label">段内课间（分钟）</span>
        <input v-model.number="form.breakMinutes" class="settings__input settings__input--sm" type="number" min="0" max="60" />
      </label>
      <p v-if="!breakValid" class="settings__error">课间应为 0–60 分钟</p>

      <div class="settings__section-block">
        <div class="settings__section-title2">上午</div>
        <div class="settings__row">
          <span class="settings__label">第 1 节开始</span>
          <input v-model="form.morningStart" class="settings__input settings__input--time" type="time" />
        </div>
        <div class="settings__row">
          <span class="settings__label">节数</span>
          <input v-model.number="form.morningPeriods" class="settings__input settings__input--sm" type="number" min="0" max="12" />
        </div>
      </div>

      <div class="settings__section-block">
        <div class="settings__section-title2">下午</div>
        <div class="settings__row">
          <span class="settings__label">第 1 节开始</span>
          <input v-model="form.noonStart" class="settings__input settings__input--time" type="time" />
        </div>
        <div class="settings__row">
          <span class="settings__label">节数</span>
          <input v-model.number="form.noonPeriods" class="settings__input settings__input--sm" type="number" min="0" max="12" />
        </div>
      </div>

      <div class="settings__section-block">
        <div class="settings__section-title2">晚上</div>
        <div class="settings__row">
          <span class="settings__label">第 1 节开始</span>
          <input v-model="form.eveningStart" class="settings__input settings__input--time" type="time" />
        </div>
        <div class="settings__row">
          <span class="settings__label">节数</span>
          <input v-model.number="form.eveningPeriods" class="settings__input settings__input--sm" type="number" min="0" max="12" />
        </div>
      </div>

      <p v-if="!periodsValid" class="settings__error">节数不能为负</p>

      <button class="settings__reset" type="button" @click="handleReset">重置为默认</button>
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

    <ConfirmDialog
      v-if="showResetConfirm"
      title="重置为默认"
      desc="确定将所有设置重置为默认值？此操作不可撤销。"
      confirm-text="重置"
      :confirm-danger="true"
      @confirm="onResetConfirm"
      @cancel="showResetConfirm = false"
    />
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
  background-color: #4e79a7;
  color: #fff;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}
.settings__save:disabled {
  background-color: #c4cdd7;
  cursor: not-allowed;
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
.settings__hint {
  font-size: 12px;
  color: #86909c;
  padding: 0 4px 8px;
}
.settings__import-msg {
  font-size: 12px;
  color: #4e5969;
  margin: 0;
}
.settings__period-preview {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #efeff1;
  border-radius: 8px;
  margin: 0 4px 8px;
}
.settings__period-preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  border-bottom: 1px solid #f4f5f7;
  font-size: 13px;
}
.settings__period-preview-row:last-child {
  border-bottom: none;
}
.settings__period-preview-index {
  color: #1f2329;
  font-weight: 500;
}
.settings__period-preview-time {
  color: #4e5969;
  font-variant-numeric: tabular-nums;
}
.settings__section-title {
  font-size: 13px;
  font-weight: 600;
  color: #4e79a7;
  padding: 14px 0 4px;
}
.settings__section-block {
  border-top: 1px solid #f5f6f8;
  margin-top: 4px;
  padding-top: 2px;
}
.settings__section-title2 {
  font-size: 12px;
  font-weight: 600;
  color: #4e5969;
  padding: 10px 0 0;
}
.settings__input--time {
  min-width: 110px;
}
.settings__reset {
  width: 100%;
  height: 40px;
  margin: 8px 0 14px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background-color: #fafbfc;
  color: #86909c;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.settings__reset:hover {
  color: #e15759;
  border-color: #f5c6c2;
}
</style>
