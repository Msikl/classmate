<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCourses } from '@/composables/useCourses'
import WeekView from '@/components/course/WeekView.vue'
import WeekPickerMenu from '@/components/course/WeekPickerMenu.vue'
import AddMenu from '@/components/course/AddMenu.vue'
import CourseForm from '@/components/course/CourseForm.vue'

const router = useRouter()
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
  color?: string
}) {
  coursesStore.addCourse(draft)
  showCreate.value = false
}
</script>

<template>
  <div class="home">
    <div class="home__topbar">
      <WeekPickerMenu />
      <AddMenu @add-course="showCreate = true" @settings="router.push('/settings')" />
    </div>

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
.home__topbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.home__topbar :deep(.add-menu) {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
</style>
