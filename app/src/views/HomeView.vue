<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWeek } from '@/composables/useWeek'
import { useCourses } from '@/composables/useCourses'
import WeekView from '@/components/course/WeekView.vue'
import CourseForm from '@/components/course/CourseForm.vue'

const router = useRouter()
const { currentWeek, totalWeeks } = useWeek()
const coursesStore = useCourses()

/** 新建课程表单是否可见 */
const showCreate = ref(false)

function handleCreate(draft: {
  name: string
  teacher?: string
  classroom?: string
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7
  startPeriod: number
  endPeriod: number
}) {
  coursesStore.addCourse(draft)
  showCreate.value = false
}
</script>

<template>
  <div class="home">
    <header class="home__header">
      <h1 class="home__title">第 {{ currentWeek }} 周 / 共 {{ totalWeeks }} 周</h1>
      <div class="home__actions">
        <button class="home__add" type="button" @click="showCreate = true">＋ 添加课程</button>
        <button class="home__settings" type="button" aria-label="设置" @click="router.push('/settings')">
          ⚙︎
        </button>
      </div>
    </header>
    <WeekView />

    <CourseForm v-if="showCreate" :initial="null" @submit="handleCreate" @close="showCreate = false" />
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 12px;
  box-sizing: border-box;
}
.home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.home__title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.home__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.home__add {
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background-color: #4e79a7;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.home__settings {
  height: 32px;
  width: 32px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background-color: #fff;
  color: #4e5969;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
