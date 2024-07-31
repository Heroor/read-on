import type { ProtocolWithReturn } from 'webext-bridge'
import type { Bookmark, Job } from '~/type'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'schedule:update': Job[]
    'subscribe:push': Bookmark[]
    'subscribe:none': null
    'subscribe:request': null
    'subscribe:remind': Bookmark[]
    'subscribe:refresh': Bookmark[]
    'subscribe:check': Bookmark[]
    'subscribe:valid': Bookmark
  }
}
