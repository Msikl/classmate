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
import { isOnWeek } from '@/types/course'
import { Capacitor } from '@capacitor/core'
import { useCourses } from '@/composables/useCourses'
import { useSettings } from '@/composables/useSettings'
import { usePeriods } from '@/composables/useSchedule'

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

  // 该 day 所属周号（相对开学日期第 1 周起）
  const start = parseDate(startDate)
  const firstMonday = new Date(start)
  firstMonday.setDate(start.getDate() - (start.getDay() === 0 ? 7 : start.getDay() - 1))
  const weekOfDay =
    Math.floor((day.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1

  const out: Reminder[] = []
  for (const course of courses) {
    if (course.dayOfWeek !== weekday) continue
    // 按起止周范围过滤：不在该课程上课周内则不提醒
    if (!isOnWeek(course, weekOfDay)) continue
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

/* ---------------- 通知适配层 ---------------- */

/** Web Notification 适配：浏览器 preview 下可弹系统通知；无权限时静默降级。 */
export function createWebNotificationService(): NotificationService {
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

/**
 * 原生本地通知适配（Capacitor @capacitor/local-notifications）。
 * 把一批 Reminder 排成本地定时通知，到点由系统弹出（App 无需前台/无需轮询）。
 * 仅供原生平台调用；浏览器下 isNative=false 不会走此路径。
 */
export function createNativeNotificationService() {
  return {
    /** 申请通知权限（Android 13+ 必需；返回是否已授权） */
    async ensurePermission(): Promise<boolean> {
      let ok = true
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        const res = await LocalNotifications.requestPermissions()
        ok = res.display === 'granted'
      } catch {
        ok = false
      }
      return ok
    },
    /** 取消所有已排通知（重排前清理） */
    async cancelAll(): Promise<void> {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        await LocalNotifications.cancel({ notifications: [] })
      } catch {
        // 忽略
      }
    },
    /** 排一批延时通知 */
    async schedule(reminders: Reminder[]): Promise<void> {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        await LocalNotifications.schedule({
          notifications: reminders.map((r) => ({
            id: hashCode(r.key),
            title: r.title,
            body: r.body,
            schedule: { at: r.dueAt },
            // 不指定 smallIcon：android 壳无 ic_stat 资源，省略可避免引用不存在资源导致崩溃
          })),
        })
      } catch {
        // 忽略
      }
    },
  }
}

/** 简单字符串 hashCode → 稳定的通知 id */
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return (h >>> 0) % 2 ** 31
}

/* ---------------- useReminder 组合式函数（绑定 store + 设置） ---------------- */

export function useReminder() {
  const { courses } = useCourses()
  const { settings } = useSettings()
  const { periods } = usePeriods()
  const scheduler = createScheduler()
  const webService: NotificationService = createWebNotificationService()

  /** 平台检测：true=Capacitor 原生环境（手机 App） */
  const isNative =
    typeof Capacitor !== 'undefined' &&
    !!Capacitor.isNativePlatform?.()

  /**
   * 生成从今天到学期结束（startDate + totalWeeks 周）的所有待触发提醒。
   * 一次性排满整学期，保证用户长期（一学期）不开 App 也能按点弹提醒（原生端由系统触发）。
   */
  function buildUpcomingReminders(): Reminder[] {
    // 学期结束日 = 第 1 周周一 + totalWeeks*7 - 1（= 最后一周周日）
    const [sy, sm, sd] = settings.value.startDate.split('-').map(Number)
    const semesterEnd = new Date(sy as number, (sm as number) - 1, (sd as number) - 1)
    semesterEnd.setDate(semesterEnd.getDate() + settings.value.totalWeeks * 7 - 1)

    const items: Reminder[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 从今天（若在学期内）逐日扫描到学期结束
    const cursor = new Date(today)
    while (cursor.getTime() <= semesterEnd.getTime()) {
      const forDay = computeDailyReminders(
        courses.value,
        cursor,
        settings.value.startDate,
        settings.value.notificationMinutes,
        (pi) => periods.value[pi - 1],
      )
      // 只保留未来时刻（排除今天已过/过去）
      items.push(...forDay.filter((r) => r.dueAt.getTime() > Date.now()))
      cursor.setDate(cursor.getDate() + 1)
    }
    return items
  }

  /** 重新装载未来提醒 */
  async function reloadSchedule() {
    if (!settings.value.notificationEnabled) return
    const items = buildUpcomingReminders()

    if (isNative) {
      const native = createNativeNotificationService()
      const granted = await native.ensurePermission()
      if (granted && items.length > 0) {
        await native.cancelAll()
        await native.schedule(items)
      }
      return
    }
    scheduler.enqueueReminders(items)
  }

  /** 供定时器调用（仅 Web 环境使用；原生由系统触发无需轮询） */
  function poll(): void {
    if (isNative) return
    const due = scheduler.tick(new Date())
    for (const r of due) webService.notify(r.title, r.body)
  }

  return { scheduler, poll, reloadSchedule, isNative, notifyService: webService }
}
