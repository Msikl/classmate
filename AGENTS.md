# classmate

一个学生课表（课程表）移动应用。当前仅你一人使用、单人开发，定位为**纯前端项目**，暂不引入后端。后端相关技术约定（Spring Boot / JDK 21 / 阿里规范 / `{code,msg,data}`）已搁置，等将来确实需要服务端再启用。

仓库当前只有 `README.md` 与 `.git/`，尚无源码，初始化阶段不要假设存在已实现功能。

技术栈（已确认）：
- 前端：Vue 3 + TypeScript + Vite
- 移动端打包：Capacitor
- 代码规范：组合式 API + `<script setup>`；禁止使用 `any`

## 目录规划（预期，尚未落盘）

- Vite 单页工程，页面组件用 `<script setup lang="ts">` 组合式 API
- Capacitor 面向 Android/iOS 壳打包，业务代码不与原生层耦合
- 课表数据（课程、周次、节次、学期）由本地状态处理，无后端接口依赖

## Build & test（占位，待源码落地后替换为精确调用）

- 依赖与开发：`npm install` → `npm run dev`（Vite dev server）
- 构建：`npm run build`（Vite 产物输出到 `dist/`）
- 移动端打包：`npx cap add android/ios` → `npx cap sync` → `npx cap open`
- 具体脚本一律以实际 `package.json` 的 `scripts` 为准，勿凭空编造命令

## Conventions（约定）

- 强制 `<script setup>` 组合式 API，页面逻辑按组合式函数（`useXxx()`）拆分布局
- 禁止任何 `any`（含隐式 `any`）——依赖 tsconfig 严格模式（`noImplicitAny` / `strict`）兜底，而非靠自觉
- 课表领域术语（课程、周次、节次、学期）命名保持一致，避免中英混拼

## Pitfalls

- 仓库为空：任何"该项目已有 X"的假设都以实际文件为准，先 `find`/`ls` 确认再动手
- 不要手改 Capacitor 生成的 `android/`、`ios/` 或 `www/` 构建产物，改源码后重新 `cap sync`
- 若发现 `any` 能编译通过，说明 tsconfig 未开启严格模式，需修正配置而非放任
