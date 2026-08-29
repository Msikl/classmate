<script setup lang="ts">
import { ref } from 'vue'

/** 「＋」主按钮：点开「添加课程 / 设置」菜单 */
const open = ref(false)

const emit = defineEmits<{
  addCourse: []
  settings: []
}>()

function choose(action: 'add' | 'settings') {
  open.value = false
  if (action === 'add') emit('addCourse')
  else emit('settings')
}
</script>

<template>
  <span class="add-menu">
    <button class="add-menu__fab" type="button" aria-label="更多操作" @click="open = !open">
      ＋
    </button>

    <Teleport to="body">
      <div v-if="open" class="add-sheet" @click.self="open = false">
        <div class="add-sheet__card">
          <div class="add-sheet__head">
            <span class="add-sheet__title">操作</span>
            <button class="add-sheet__close" type="button" aria-label="关闭" @click="open = false">✕</button>
          </div>
          <div class="add-sheet__list">
            <button class="add-sheet__item" type="button" @click="choose('add')">
              <span class="add-sheet__item-icon">＋</span>
              <span class="add-sheet__item-text">添加课程</span>
            </button>
            <button class="add-sheet__item" type="button" @click="choose('settings')">
              <span class="add-sheet__item-icon">⚙</span>
              <span class="add-sheet__item-text">设置</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.add-menu__fab {
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
.add-sheet {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
}
.add-sheet__card {
  width: 100%;
  max-width: 460px;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  padding: 14px 16px calc(18px + env(safe-area-inset-bottom));
}
.add-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.add-sheet__title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}
.add-sheet__close {
  border: none;
  background: transparent;
  font-size: 16px;
  color: #86909c;
  cursor: pointer;
  padding: 4px;
}
.add-sheet__list {
  display: flex;
  flex-direction: column;
}
.add-sheet__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  border: none;
  background: none;
  border-bottom: 1px solid #f0f1f3;
  cursor: pointer;
  font-size: 14px;
  color: #1f2329;
}
.add-sheet__item:last-child {
  border-bottom: none;
}
.add-sheet__item-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background-color: #edf2f8;
  color: #4e79a7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.add-sheet__item-text {
  font-weight: 500;
}
</style>
