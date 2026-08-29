<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { periods } from '@/composables/useSchedule'
import type { Course, DayOfWeek } from '@/types/course'

/** 新建/编辑共用表单 */
const props = defineProps<{
  /** 编辑时的初始值；null 表示新建 */
  initial: (Pick<Course, 'name' | 'teacher' | 'classroom' | 'dayOfWeek' | 'startPeriod' | 'endPeriod'> & { id?: string }) | null
}>()

const emit = defineEmits<{
  submit: [draft: {
    name: string
    teacher?: string
    classroom?: string
    dayOfWeek: DayOfWeek
    startPeriod: number
    endPeriod: number
  }]
  close: []
}>()

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const
const DAY_VALUES: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7]

/** periodCount 跟随节次表 */
const periodCount = periods.length

/** 逐节可选列表（含绝对时间提示） */
const periodOptions = periods.map((p) => ({
  value: p.index,
  label: `第 ${p.index} 节 · ${p.startTime}-${p.endTime}`,
}))

const form = reactive({
  name: '',
  teacher: '',
  classroom: '',
  dayOfWeek: 1 as DayOfWeek,
  startPeriod: 1,
  endPeriod: 1,
})

/** 填充初始值（挂载 / initial 变化时） */
watch(
  () => props.initial,
  (init) => {
    form.name = init?.name ?? ''
    form.teacher = init?.teacher ?? ''
    form.classroom = init?.classroom ?? ''
    form.dayOfWeek = init?.dayOfWeek ?? 1
    form.startPeriod = init?.startPeriod ?? 1
    form.endPeriod = init?.endPeriod ?? Math.min(init?.startPeriod ?? 1, periodCount)
  },
  { immediate: true },
)

/** 起止节次合法性：end >= start */
const rangeValid = computed(() => form.endPeriod >= form.startPeriod)
const nameValid = computed(() => form.name.trim().length > 0)
const canSubmit = computed(() => nameValid.value && rangeValid.value)

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    name: form.name.trim(),
    teacher: form.teacher.trim() || undefined,
    classroom: form.classroom.trim() || undefined,
    dayOfWeek: form.dayOfWeek,
    startPeriod: form.startPeriod,
    endPeriod: form.endPeriod,
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="form-modal" @click.self="emit('close')">
      <div class="form-modal__card" role="dialog" aria-modal="true">
        <header class="form-modal__header">
          <h2 class="form-modal__title">{{ initial ? '编辑课程' : '添加课程' }}</h2>
          <button class="form-modal__close" type="button" aria-label="关闭" @click="emit('close')">✕</button>
        </header>

        <div class="form-modal__body">
          <label class="form-field">
            <span class="form-field__label">课程名 <em class="form-field__req">*</em></span>
            <input v-model="form.name" class="form-field__input" type="text" placeholder="如 高等数学" />
          </label>

          <div class="form-row">
            <label class="form-field">
              <span class="form-field__label">教师</span>
              <input v-model="form.teacher" class="form-field__input" type="text" placeholder="选填" />
            </label>
            <label class="form-field">
              <span class="form-field__label">教室</span>
              <input v-model="form.classroom" class="form-field__input" type="text" placeholder="如 A-101" />
            </label>
          </div>

          <label class="form-field">
            <span class="form-field__label">周几</span>
            <select v-model.number="form.dayOfWeek" class="form-field__input">
              <option v-for="(label, i) in DAY_LABELS" :key="label" :value="DAY_VALUES[i]">
                {{ label }}
              </option>
            </select>
          </label>

          <div class="form-row">
            <label class="form-field">
              <span class="form-field__label">起始节次</span>
              <select v-model.number="form.startPeriod" class="form-field__input">
                <option v-for="o in periodOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </label>
            <label class="form-field">
              <span class="form-field__label">结束节次</span>
              <select v-model.number="form.endPeriod" class="form-field__input">
                <option v-for="o in periodOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </label>
          </div>

          <p v-if="!rangeValid" class="form-field__error">结束节次不能早于起始节次</p>

          <button class="form-modal__submit" type="button" :disabled="!canSubmit" @click="onSubmit">
            保存
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.form-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
  padding: 20px;
}
.form-modal__card {
  width: 100%;
  max-width: 360px;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}
.form-modal__header {
  display: flex;
  align-items: center;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #f0f1f3;
}
.form-modal__title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #1f2329;
}
.form-modal__close {
  border: none;
  background: transparent;
  font-size: 16px;
  color: #86909c;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.form-modal__body {
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-row {
  display: flex;
  gap: 10px;
}
.form-row .form-field {
  flex: 1;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-field__label {
  font-size: 13px;
  color: #4e5969;
}
.form-field__req {
  color: #e15759;
  font-style: normal;
}
.form-field__input {
  height: 38px;
  padding: 0 10px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2329;
  background-color: #fff;
  box-sizing: border-box;
  width: 100%;
}
.form-field__input:focus {
  outline: none;
  border-color: #4e79a7;
}
.form-field__error {
  font-size: 12px;
  color: #e15759;
  margin: 0;
}
.form-modal__submit {
  height: 42px;
  border: none;
  border-radius: 8px;
  background-color: #4e79a7;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 2px;
}
.form-modal__submit:disabled {
  background-color: #c3cad2;
  cursor: not-allowed;
}
</style>
