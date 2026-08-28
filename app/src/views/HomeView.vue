<script setup lang="ts">
import { useWeek } from '@/composables/useWeek'
import WeekView from '@/components/course/WeekView.vue'

const { currentWeek, totalWeeks } = useWeek()
</script>

<template>
  <div class="home">
    <header class="home__header">
      <h1 class="home__title">第 {{ currentWeek }} 周 / 共 {{ totalWeeks }} 周</h1>
    </header>
    <WeekView />
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 12px;
  box-sizing: border-box;
}
.home__header {
  margin-bottom: 10px;
}
.home__title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
</style>
