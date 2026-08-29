<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWeek } from '@/composables/useWeek'

const { currentWeek, totalWeeks, viewedWeek, setViewedWeek } = useWeek()

/** 周选择弹窗是否打开 */
const open = ref(false)

/** 周列表 */
const weekList = computed(() => {
  const n = totalWeeks.value
  return Array.from({ length: n }, (_, i) => i + 1)
})

/** 是否当前周 */
const isCurrent = (w: number) => w === currentWeek.value

function pick(w: number) {
  setViewedWeek(w)
  open.value = false
}

function pickCurrent() {
  setViewedWeek(currentWeek.value)
  open.value = false
}
</script>

<template>
  <span class="week-picker">
    <button class="week-picker__trigger" type="button" @click="open = true">
      第 {{ viewedWeek }} 周
      <span v-if="viewedWeek === currentWeek" class="week-picker__cur">本周</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="week-sheet" @click.self="open = false">
        <div class="week-sheet__card">
          <div class="week-sheet__head">
            <span class="week-sheet__title">选择周次</span>
            <button class="week-sheet__close" type="button" aria-label="关闭" @click="open = false">✕</button>
          </div>
          <div class="week-sheet__grid">
            <button
              v-for="w in weekList"
              :key="w"
              type="button"
              class="week-sheet__cell"
              :class="{
                'week-sheet__cell--cur': isCurrent(w),
                'week-sheet__cell--active': viewedWeek === w,
              }"
              @click="pick(w)"
            >
              {{ w }}
            </button>
          </div>
          <button v-if="viewedWeek !== currentWeek" class="week-sheet__back" type="button" @click="pickCurrent">
            回到本周（第 {{ currentWeek }} 周）
          </button>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.week-picker__trigger {
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background-color: #fff;
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
  padding: 8px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.week-picker__cur {
  font-size: 11px;
  color: #4e79a7;
  background-color: #edf2f8;
  padding: 1px 8px;
  border-radius: 10px;
}
.week-sheet {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
}
.week-sheet__card {
  width: 100%;
  max-width: 460px;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  padding: 14px 16px calc(18px + env(safe-area-inset-bottom));
}
.week-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.week-sheet__title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}
.week-sheet__close {
  border: none;
  background: transparent;
  font-size: 16px;
  color: #86909c;
  cursor: pointer;
  padding: 4px;
}
.week-sheet__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  max-height: 46vh;
  overflow-y: auto;
}
.week-sheet__cell {
  height: 42px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background-color: #fafbfc;
  font-size: 14px;
  color: #1f2329;
  cursor: pointer;
}
.week-sheet__cell--cur {
  border-color: #4e79a7;
  color: #4e79a7;
  font-weight: 600;
}
.week-sheet__cell--active {
  background-color: #4e79a7;
  border-color: #4e79a7;
  color: #fff;
}
.week-sheet__back {
  width: 100%;
  height: 42px;
  margin-top: 12px;
  border: none;
  border-radius: 8px;
  background-color: #eef0f3;
  color: #4e5969;
  font-size: 14px;
  cursor: pointer;
}
</style>
