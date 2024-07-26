export interface Job {
  cron: string
  type: string
}

export interface Bookmark {
  url: string
  title: string
  date: number
  id?: string
  parentId?: string
  children?: Bookmark[]
  path?: string[]
}

export {}
