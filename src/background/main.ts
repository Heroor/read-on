import Cron from 'croner'
import { onMessage, sendMessage } from 'webext-bridge/background'
import type { ProtocolMap } from 'webext-bridge'
import type { Bookmark, Job } from '~/type'
import { readScheduleJobs, remindTime, scheduleJobs, subscribeStorage } from '~/logic/storage'

let jobs: Cron[] = []
const excludeBmIds = new Set<string>()

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

browser.runtime.onInstalled.addListener(init)

init()

async function init() {
  await readScheduleJobs()
  startJobs(scheduleJobs.value)
  // For test
  // console.log('For test')
  // getRandomBookmark()
}

async function getRandomBookmark() {
  const nodes = new Set<string>()

  for (const sub of subscribeStorage.value) {
    const tree = await browser.bookmarks.getSubTree(sub)
    loop(tree[0])
  }

  function loop(tree: Bookmark) {
    if (tree.url) {
      nodes.add(tree.id!)
    }
    else {
      tree.children?.forEach((c) => {
        if (subscribeStorage.value.has(c.id!)) {
          return
        }
        loop(c)
      })
    }
  }
  const newNodes = new Set(nodes)
  excludeBmIds.forEach((id) => {
    newNodes.delete(id)
  })
  if (!newNodes.size) {
    sendToCurrentTab('subscribe:none', null)
    return null
  }
  const index = Math.random() * newNodes.size >> 0
  const id = Array.from(newNodes)[index]
  const [node] = await browser.bookmarks.get(id)
  const path = await getBookmarkPath(node)

  return {
    id: node.id,
    title: node.title,
    url: node.url,
    date: node.dateAdded,
    path,
  }
}

async function getBookmarkPath(node: Bookmark) {
  const path = []
  let parentId = node.parentId
  while (parentId && parentId !== '1') {
    const [parent] = await browser.bookmarks.get(parentId)
    parentId = parent.parentId
    path.unshift(parent.title)
  }
  return path
}

async function pushSubscribe(bookmark?: Bookmark) {
  const data = bookmark || await getRandomBookmark()
  if (!data) {
    return
  }
  sendToCurrentTab('subscribe:push', data as any)
}

async function sendToCurrentTab<K extends keyof ProtocolMap>(messageID: K, data: ProtocolMap[K]) {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true })
  if (tabs.length) {
    console.log('Find active tab')
    sendMessage(messageID, data as any, { context: 'content-script', tabId: tabs[0].id })
  }
  else {
    console.error('Can not find active tab')
  }
}

function startJobs(scheduleJobs: Job[]) {
  clearJobs()
  scheduleJobs.forEach((item) => {
    jobs.push(Cron(item.cron, () => {
      console.log('Job start!')
      excludeBmIds.clear()
      pushSubscribe()
    }))
  })
}

function clearJobs() {
  jobs.forEach(job => job.stop())
  jobs = []
}

async function checkLinkValid(link: string) {
  return await fetch(link)
    .then(response => response.ok)
    .catch(() => false)
}

onMessage('schedule:update', ({ data }) => {
  startJobs(data)
})

onMessage('subscribe:remind', ({ data }) => {
  setTimeout(() => pushSubscribe(data), remindTime.value)
})

onMessage('subscribe:refresh', ({ data }) => {
  excludeBmIds.add(data.id!)
  pushSubscribe()
})

onMessage('subscribe:request', () => {
  excludeBmIds.clear()
  pushSubscribe()
})

onMessage('subscribe:check', async ({ data }) => {
  const valid = await checkLinkValid(data.url)
  sendToCurrentTab('subscribe:valid', { ...data, valid })
})
