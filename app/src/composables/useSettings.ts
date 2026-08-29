/**
 * useSettings —— 应用设置 store（P2 起启用）
 *
 * 持有全局唯一设置状态 + localStorage 持久化（key=classmate:settings）。
 * 设置：开学日期、总周数、提醒开关、提前分钟数。
 */
import { readonly, ref } from 'vue'
import type { Settings } from '@/types/course'
import { readJSON, writeJSON } from '@/utils/storage'

/** localStorage key（前缀 classmate: 由 storage.ts 统一加） */
const STORAGE_KEY = 'settings'

/** 默认设置 */
const DEFAULT_SETTINGS: Settings = {
  startDate: '2026-09-01',
  totalWeeks: 16,
  classDurationMinutes: 45,
  breakMinutes: 10,
  morningStart: '08:00',
  morningPeriods: 4,
  noonStart: '14:00',
  noonPeriods: 4,
  eveningStart: '19:00',
  eveningPeriods: 2,
  notificationEnabled: true,
  notificationMinutes: 30,
}

/** 初始化：localStorage 有则读取（与默认浅合并，兼容缺字段），否则用默认 */
function loadInitial(): Settings {
  const saved = readJSON<Partial<Settings>>(STORAGE_KEY, {})
  return { ...DEFAULT_SETTINGS, ...saved }
}

type SettingsStore = ReturnType<typeof createStore>

function createStore() {
  const _settings = ref<Settings>(loadInitial())

  /** 设置（只读视图） */
  const settings = readonly(_settings)

  /** 全量替换设置（P2 表单保存入口） */
  function updateSettings(patch: Partial<Settings>): void {
    _settings.value = { ..._settings.value, ...patch }
    writeJSON(STORAGE_KEY, _settings.value)
  }

  /** 单项快捷设置 */
  function setStartDate(value: string): void {
    _settings.value = { ..._settings.value, startDate: value }
    writeJSON(STORAGE_KEY, _settings.value)
  }

  /** 重置为默认设置（含三段节次配置），并持久化 */
  function resetSettings(): void {
    _settings.value = { ...DEFAULT_SETTINGS }
    writeJSON(STORAGE_KEY, _settings.value)
  }

  return { settings, updateSettings, setStartDate, resetSettings }
}

let _instance: SettingsStore | null = null

/** 取全局单例 store */
export function useSettings(): SettingsStore {
  if (!_instance) _instance = createStore()
  return _instance
}
