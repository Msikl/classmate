/**
 * useReminder —— 课前提醒（P3）
 *
 * 平台无关的提醒调度核心：输入课程 + 设置，生成需要触发的提醒并去重。
 * 实际通知通过 NotificationAdapter 发出——P3 阶段用 Web Notification(可选/兜底)，
 * 后续上 Capacitor 壳时接入 @capacitor/local-notifications，主逻辑不变。
 *
 * 提醒时刻 = 课程开始时间 - 提前 N 分钟；课程在开学后第 X 周当天触发（全学期皆匹配）。
 */

import type { Course } from '@/types/course'
import { useCourses } from '@/composables/useCourses'
import { useSettings } from '@/composables/useSettings'
import { periods } from '@/composables/useSchedule'

export interface NotificationService {
  /** 发出一条即时通知；返回是否成功 */
  notify(title: string, body: string): boolean
}

/** 提醒项（可触发的最小单元） */
export interface Reminder {
  /** 去重 key：courseId|date|period */
  key: string
  /** 应触发时刻（Date） */
  dueAt: Date
  title: string
  body: string
}

/** 解析 "YYYY-MM-DD" 为本地 Date */
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y as number, (m as number) - 1, d as number)
}

/** 解析 "HH:MM" 为分钟数 */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const DAY_WEEKDAY: Record<number, Course['dayOfWeek']> = {
  0: 7, // 周日
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
}

/**
 * 为某一天生成该日所有课程的提醒项（纯函数，可单测）。
 * @param courses 全部课程
 * @param day 目标日期（0 点，本地）
 * @param startDate 开学日期 "YYYY-MM-DD"
 * @param advanceMinutes 提前分钟数
 */
export function computeDailyReminders(
  courses: readonly Course[],
  day: Date,
  startDate: string,
  advanceMinutes: number,
  scheduleTime: (periodIndex: number) => { startTime: string } | undefined,
): Reminder[] {
  const weekday = DAY_WEEKDAY[day.getDay()]
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  const ds = `${y}-${m}-${d}`

  const out: Reminder[] = []
  for (const course of courses) {
    if (course.dayOfWeek !== weekday) continue
    const st = scheduleTime(course.startPeriod)
    if (!st) continue
    const dueAt = parseDate(ds)
    dueAt.setHours(0, toMinutes(st.startTime) - advanceMinutes, 0, 0)
    const title = `该上课了：${course.name}`
    const body = `${ds} ${st.startTime} · ${course.classroom || '教室未设'}${course.teacher ? ` · ${course.teacher}` : ''}`
    out.push({ key: `${course.id}|${ds}|${course.startPeriod}`, dueAt, title, body })
  }
  return out
}

/**
 * 运行时调度器：持有一个延迟队列，供定时器轮询。
 * - enqueueReminders：放入一批未来提醒（已按 key 去重）
 * - tick(now)：取出到点且未被消费的提醒，交给 notificationService 发出，并记录 consumed
 */
export interface ReminderScheduler {
  enqueueReminders(items: Reminder[]): void
  tick(now: Date): Reminder[]
  readonly pendingCount: number
  peek(): Reminder[]
}

export function createScheduler(): ReminderScheduler {
  let pending: Reminder[] = []
  const consumed = new Set<string>()

  function enqueueReminders(items: Reminder[]): void {
    const existing = new Set(pending.map((r) => r.key))
    for (const item of items) {
      if (consumed.has(item.key)) continue
      if (existing.has(item.key)) continue
      pending.push(item)
      existing.add(item.key)
    }
    // 按 dueAt 排序
    pending.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
  }

  function tick(now: Date): Reminder[] {
    const due = pending.filter((r) => r.dueAt.getTime() <= now.getTime())
    for (const r of due) consumed.add(r.key)
    pending = pending.filter((r) => r.dueAt.getTime() > now.getTime())
    return due
  }

  return {
    enqueueReminders,
    tick,
    get pendingCount() {
      return pending.length
    },
    peek: () => [...pending],
  }
}

/* ---------------- Web 通知适配器（P3 阶段占位，壳后换 Capacitor 插件） ---------------- */

/** Web Notification 适配：浏览器 preview 下可弹系统通知；无权限时静默降级。 */
export function createWebNotificationService(): NotificationService {
  // 若浏览器支持且未请求权限，主动请求
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    try {
      void Notification.requestPermission()
    } catch {
      // 忽略
    }
  }
  return {
    notify(title, body) {
      if (typeof Notification === 'undefined') return false
      if (Notification.permission !== 'granted') return false
      try {
        // eslint-disable-next-line no-new
        new Notification(title, { body })
        return true
      } catch {
        return false
      }
    },
  }
}

/* ---------------- useReminder 组合式函数（绑定 store + 设置） ---------------- */

export function useReminder() {
  const { courses } = useCourses()
  const { settings } = useSettings()
  const scheduler = createScheduler()
  const service: NotificationService = createWebNotificationService()

  const notifyService = service

  /** 重新装载未来提醒（供定时器首次/设置变化时调用） */
  function reloadSchedule() {
    if (!settings.value.notificationEnabled) {
      // 关闭时不清空已装载队列（简单跳过装载）
      return
    }
    const nowDay = new Date()
    nowDay.setHours(0, 0, 0, 0)
    const items: Reminder[] = []
    for (let i = 0; i <= 7; i++) {
      const day = new Date(nowDay.getTime() + i * 24 * 60 * 60 * 1000)
      day.setHours(0, 0, 0, 0)
      const forDay = computeDailyReminders(
        courses.value,
        day,
        settings.value.startDate,
        settings.value.notificationMinutes,
        (pi) => periods[pi - 1],
      )
      // 只保留未来时刻（排除已触达/已过的）
      items.push(...forDay.filter((r) => r.dueAt.getTime() > Date.now()))
    }
    scheduler.enqueueReminders(items)
  }

  /** 供定时器调用：处理到点提醒 (notify) */
  function poll(): void {
    const due = scheduler.tick(new Date())
    for (const r of due) notifyService.notify(r.title, r.body)
  }

  return { scheduler, poll, reloadSchedule, notifyService }
}
