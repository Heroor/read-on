import type { ProtocolWithReturn } from 'webext-bridge'
import type { Bookmark } from '~/type'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>
    'subscribe:push': Bookmark
    'subscribe:remind': Bookmark
  }
}
