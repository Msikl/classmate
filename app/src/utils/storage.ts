/**
 * 本地存储工具（localStorage 封装）
 *
 * 纯前端单机持久化，P1 起用于课程等数据的刷新保留。
 * 用 try/catch 包裹以兼容隐私模式 / 存储满等异常场景。
 */

const STORAGE_PREFIX = 'classmate:'

/** 读取并 JSON.parse；不存在或损坏时返回 fallback */
export function readJSON<T>(key: string, fallback: T): T {
  const raw = loadRaw(key)
  if (raw === null || raw === undefined) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** JSON.stringify 后写入；异常时静默（尽量不打断操作流程） */
export function writeJSON<T>(key: string, value: T): boolean {
  try {
    const raw = JSON.stringify(value)
    saveRaw(key, raw)
    return true
  } catch {
    return false
  }
}

function fullKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

function loadRaw(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(fullKey(key)) ?? null
  } catch {
    return null
  }
}

function saveRaw(key: string, raw: string): void {
  try {
    globalThis.localStorage?.setItem(fullKey(key), raw)
  } catch {
    // 忽略：隐私模式或存储满
  }
}

/** 移除指定 key；用于测试或「恢复出厂」 */
export function removeKey(key: string): void {
  try {
    globalThis.localStorage?.removeItem(fullKey(key))
  } catch {
    // 忽略
  }
}
