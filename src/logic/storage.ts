import type { Job } from '~/type'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export const subscribeStorage = useWebExtensionStorage('subscribe', new Set<string>())
export const scheduleJobs = useWebExtensionStorage<Job[]>('scheduleJobs', [])
export const remindTime = useWebExtensionStorage('remindTime', 1000 * 60 * 5)
