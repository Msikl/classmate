<script setup lang="ts">
/** 通用确认弹窗（替代 window.confirm，兼容 Web 与 Capacitor App） */
defineProps<{
  title: string
  desc?: string
  confirmText: string
  cancelText?: string
  confirmDanger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="confirm" @click.self="emit('cancel')">
      <div class="confirm__card" role="dialog" aria-modal="true">
        <h3 class="confirm__title">{{ title }}</h3>
        <p v-if="desc" class="confirm__desc">{{ desc }}</p>
        <div class="confirm__actions">
          <button class="confirm__btn confirm__btn--cancel" type="button" @click="emit('cancel')">
            {{ cancelText || '取消' }}
          </button>
          <button
            class="confirm__btn confirm__btn--ok"
            :class="{ 'confirm__btn--danger': confirmDanger }"
            type="button"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
  padding: 24px;
}
.confirm__card {
  width: 100%;
  max-width: 300px;
  background-color: #fff;
  border-radius: 12px;
  padding: 18px 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}
.confirm__title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 6px;
}
.confirm__desc {
  font-size: 13px;
  color: #4e5969;
  margin: 0 0 14px;
  line-height: 1.5;
}
.confirm__actions {
  display: flex;
  gap: 10px;
}
.confirm__btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.confirm__btn--cancel {
  background-color: #eef0f3;
  color: #4e5969;
}
.confirm__btn--ok {
  background-color: #4e79a7;
  color: #fff;
}
.confirm__btn--danger {
  background-color: #e15759;
}
</style>
