import Cron from 'croner'
import { onMessage, sendMessage } from 'webext-bridge/background'
import type { Bookmark } from '~/type'
import { remindTime, scheduleJobs, subscribeStorage } from '~/logic/storage'

let jobs: Cron[] = []
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

browser.runtime.onInstalled.addListener((): void => {
  startJobs()
  // For test
  // getRandomBookmark()
})

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
  if (!nodes.size) {
    return null
  }
  const index = Math.random() * nodes.size >> 0
  const id = Array.from(nodes)[index]
  const [node] = await browser.bookmarks.get(id)
  const path = await getBookmarkPath(node)

  return {
    title: node.title,
    url: node.url,
    date: node.dateAdded,
    path,
  }
}

async function getBookmarkPath(node: Bookmark) {
  const path = [node.title]
  let parentId = node.parentId
  while (parentId && parentId !== '1') {
    const [parent] = await browser.bookmarks.get(parentId)
    parentId = parent.parentId
    path.unshift(parent.title)
  }
  return path
}

async function pushMessage(bookmark?: Bookmark) {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true })
  if (tabs.length) {
    const data = bookmark || await getRandomBookmark()
    if (!data) {
      return
    }
    sendMessage('subscribe:push', data, { context: 'content-script', tabId: tabs[0].id })
  }
}

function startJobs() {
  scheduleJobs.value.forEach((item) => {
    jobs.push(Cron(item.cron, () => pushMessage()))
  })
}

function clearJobs() {
  jobs.forEach(job => job.stop())
  jobs = []
}

onMessage('schedule:update', async () => {
  try {
    clearJobs()
    startJobs()
  }
  catch (e) {
    console.error(e)
  }
})

onMessage('schedule:clear', async () => {
  clearJobs()
})

onMessage('subscribe:remind', async ({ data }) => {
  setTimeout(() => pushMessage(data), remindTime.value)
})
