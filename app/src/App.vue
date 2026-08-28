<script setup lang="ts"></script>

<template>
  <RouterView />
</template>

<style>
/* 全局基础样式：移动端优先 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f5f6f8;
  color: #1f2329;
  -webkit-font-smoothing: antialiased;
}
</style>
