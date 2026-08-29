<script setup lang="ts">
import type { Course } from '@/types/course'
import { getPeriodTime } from '@/composables/useSchedule'

const props = defineProps<{
  course: Course
}>()

const emit = defineEmits<{
  close: []
  edit: [course: Course]
  delete: [course: Course]
}>()

/** 1..7 → 一二三四五六日 */
const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

/** 节次区间文本，如 第 1-2 节 */
const periodText =
  props.course.startPeriod === props.course.endPeriod
    ? `第 ${props.course.startPeriod} 节`
    : `第 ${props.course.startPeriod}-${props.course.endPeriod} 节`

/** 首节起始 ~ 末节结束的绝对时间 */
const timeRangeText = (() => {
  const s = getPeriodTime(props.course.startPeriod)
  const e = getPeriodTime(props.course.endPeriod)
  return `${s.startTime} - ${e.endTime}`
})()
</script>

<template>
  <Teleport to="body">
    <div class="modal" @click.self="emit('close')">
      <div class="modal__card" role="dialog" aria-modal="true">
        <header class="modal__header">
          <div class="modal__color" :style="{ backgroundColor: course.color }" />
          <h2 class="modal__title">{{ course.name }}</h2>
          <button class="modal__close" type="button" aria-label="关闭" @click="emit('close')">
            ✕
          </button>
        </header>

        <dl class="modal__body">
          <div class="modal__row">
            <dt>时间</dt>
            <dd>{{ DAY_NAMES[course.dayOfWeek - 1] }} · {{ periodText }}<br />{{ timeRangeText }}</dd>
          </div>
          <div class="modal__row">
            <dt>教室</dt>
            <dd>{{ course.classroom || '未设置' }}</dd>
          </div>
          <div class="modal__row">
            <dt>老师</dt>
            <dd>{{ course.teacher || '未设置' }}</dd>
          </div>
          <div class="modal__row">
            <dt>周次</dt>
            <dd>{{ WEEK_LABELS[course.dayOfWeek - 1] }}周 · 全学期</dd>
          </div>
        </dl>

        <footer class="modal__footer">
          <button class="modal__btn modal__btn--delete" type="button" @click="emit('delete', course)">
            删除
          </button>
          <button class="modal__btn modal__btn--edit" type="button" @click="emit('edit', course)">
            编辑
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
  padding: 20px;
}
.modal__card {
  width: 100%;
  max-width: 340px;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}
.modal__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid #f0f1f3;
}
.modal__color {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.modal__title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #1f2329;
}
.modal__close {
  border: none;
  background: transparent;
  font-size: 16px;
  color: #86909c;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.modal__close:hover {
  color: #1f2329;
}
.modal__body {
  margin: 0;
  padding: 6px 14px 14px;
}
.modal__row {
  display: flex;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid #f5f6f8;
}
.modal__row:last-child {
  border-bottom: none;
}
.modal__row dt {
  width: 52px;
  font-size: 13px;
  color: #86909c;
  flex-shrink: 0;
}
.modal__row dd {
  margin: 0;
  font-size: 14px;
  color: #1f2329;
}
.modal__footer {
  display: flex;
  gap: 10px;
  padding: 12px 14px 14px;
  border-top: 1px solid #f0f1f3;
}
.modal__btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.modal__btn--delete {
  background-color: #fdeceb;
  color: #e15759;
  border: 1px solid #f5c6c2;
}
.modal__btn--edit {
  background-color: #4e79a7;
  color: #fff;
}
</style>
