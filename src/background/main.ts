import Cron from 'croner'
import { onMessage, sendMessage } from 'webext-bridge/background'
import type { ArgumentType } from 'unocss/index'
import type { Bookmark } from '~/type'
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

browser.runtime.onInstalled.addListener(async () => {
  await readScheduleJobs()
  startJobs()
  // For test
  // console.log('For test')
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
  const path = [node.title]
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

type MessageData = ArgumentType<typeof sendMessage>[1]

async function sendToCurrentTab(messageID: string, data: MessageData) {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true })
  if (tabs.length) {
    console.log('Find active tab')
    sendMessage(messageID, data, { context: 'content-script', tabId: tabs[0].id })
  }
  else {
    console.error('Can not find active tab')
  }
}

function startJobs() {
  scheduleJobs.value.forEach((item) => {
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
  setTimeout(() => pushSubscribe(data), remindTime.value)
})

onMessage('subscribe:refresh', async ({ data }) => {
  excludeBmIds.add(data.id!)
  pushSubscribe()
})
