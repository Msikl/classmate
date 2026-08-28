<script setup lang="ts">
import type { Course } from '@/types/course'
import { getPeriodTime } from '@/composables/useSchedule'

const props = defineProps<{
  course: Course
}>()

const emit = defineEmits<{
  select: []
}>()

/** 首节起始 / 末节结束的绝对时间（上下两行） */
const startTime = getPeriodTime(props.course.startPeriod).startTime
const endTime = getPeriodTime(props.course.endPeriod).endTime
</script>

<template>
  <div class="course-card" :style="{ borderLeftColor: course.color }" @click="emit('select')">
    <p class="course-card__name">{{ course.name }}</p>
    <span class="course-card__time-start">{{ startTime }}</span>
    <span class="course-card__time-end">{{ endTime }}</span>
    <p class="course-card__classroom">{{ course.classroom }}</p>
  </div>
</template>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  height: calc(100% - 6px);
  margin-top: 3px;
  box-sizing: border-box;
  padding: 4px 6px;
  background-color: #fff;
  border: 1px solid #e5e6eb;
  border-left: 4px solid transparent;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.1s ease;
}
.course-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.course-card__name {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2329;
  word-break: break-all;
  margin: 0 0 2px;
}
.course-card__time-start,
.course-card__time-end {
  font-size: 10px;
  line-height: 1.3;
  color: #86909c;
}
.course-card__classroom {
  font-size: 10px;
  color: #4e5969;
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
