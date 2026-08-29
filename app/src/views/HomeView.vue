<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCourses } from '@/composables/useCourses'
import WeekView from '@/components/course/WeekView.vue'
import WeekPickerMenu from '@/components/course/WeekPickerMenu.vue'
import CourseForm from '@/components/course/CourseForm.vue'

const router = useRouter()
const coursesStore = useCourses()
const { courses } = useCourses()

/** 新建课程表单是否可见 */
const showCreate = ref(false)

function handleCreate(draft: {
  name: string
  teacher?: string
  classroom?: string
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7
  startPeriod: number
  endPeriod: number
  color?: string
  startWeek?: number
  endWeek?: number
}) {
  coursesStore.addCourse(draft)
  showCreate.value = false
}
</script>

<template>
  <div class="home">
    <div class="home__topbar">
      <WeekPickerMenu />
      <div class="home__topbar-actions">
        <button class="home__fab" type="button" aria-label="添加课程" @click="showCreate = true">＋</button>
        <button class="home__gear" type="button" aria-label="设置" @click="router.push('/settings')">⚙</button>
      </div>
    </div>

    <WeekView />

    <!-- 空课表引导（D3） -->
    <div v-if="courses.length === 0" class="home__empty">
      <p class="home__empty-title">还没有课程</p>
      <p class="home__empty-sub">点右上角 ＋ 添加你的第一节课</p>
    </div>

    <CourseForm v-if="showCreate" :initial="null" @submit="handleCreate" @close="showCreate = false" />
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 12px;
  box-sizing: border-box;
}
.home__topbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.home__topbar-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}
.home__fab {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #4e79a7;
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(78, 121, 167, 0.3);
}
.home__gear {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e6eb;
  border-radius: 50%;
  background-color: #fff;
  color: #4e5969;
  font-size: 17px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.home__empty {
  text-align: center;
  padding: 48px 20px;
  color: #86909c;
}
.home__empty-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.home__empty-sub {
  font-size: 13px;
}
</style>
