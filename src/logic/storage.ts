import type { Bookmark, Job } from '~/type'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export const [subscribeStorage] = useWebExtensionStorage('subscribe', new Set<string>())
export const [scheduleJobs, { read: readScheduleJobs }] = useWebExtensionStorage<Job[]>('scheduleJobs', [])
export const [remindTime] = useWebExtensionStorage('remindTime', 1000 * 60 * 5)
export const [delayCloseTime] = useWebExtensionStorage('delayCloseTime', 15)
export const [pushCount] = useWebExtensionStorage('pushCount', 1)
export const [pushHistories] = useWebExtensionStorage<Bookmark[]>('pushHistories', [])
export const [configs] = useWebExtensionStorage<string[]>('configs', ['uninteresting', 'deletable', 'delayClose', 'remind'])
