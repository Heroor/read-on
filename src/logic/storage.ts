import type { Job } from '../type'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export const subscribeStorage = useWebExtensionStorage('subscribe', new Set<string>())
export const scheduledJobs = useWebExtensionStorage<Job[]>('scheduledJobs', [])
export const remindTime = useWebExtensionStorage('remindTime', 3000)
