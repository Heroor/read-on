import Cron from 'croner'
import { onMessage, sendMessage } from 'webext-bridge/background'
import type { ProtocolMap } from 'webext-bridge'
import { initTranslations } from '~/i18n'
import type { Bookmark, Job } from '~/type'
import { pushCount, readScheduleJobs, remindTime, scheduleJobs, subscribeStorage } from '~/logic/storage'

let jobs: Cron[] = []
const bmIds = new Set<string>()
const excludeBmIds = new Set<string>()

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

if (__FIREFOX__) {
  // browser.action.onClicked.addListener(() => {
  //   browser.sidebarAction.open()
  // })
}
else {
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error)
}

browser.runtime.onInstalled.addListener(init)

init()

async function init() {
  await readScheduleJobs()
  startJobs(scheduleJobs.value)
  initAllBookmarkIds()
  initTranslations(browser.i18n.getUILanguage().substring(0, 2))
}

async function initAllBookmarkIds(subscribes?: string[]) {
  bmIds.clear()
  const idSet = subscribes ? new Set(subscribes) : subscribeStorage.value
  for (const sub of idSet) {
    const tree = await browser.bookmarks.getSubTree(sub).catch(() => {
      subscribeStorage.value.delete(sub)
    })
    tree && loop(tree[0])
  }

  function loop(node: Bookmark) {
    if (node.url) {
      bmIds.add(node.id!)
    }
    else {
      node.children?.forEach((c) => {
        if (idSet.has(c.id!)) {
          return
        }
        loop(c)
      })
    }
  }
}

async function getRandomBookmark({ count = pushCount.value } = {}) {
  const availableBmIds = new Set(bmIds)
  excludeBmIds.forEach((id) => {
    availableBmIds.delete(id)
  })
  if (!availableBmIds.size) {
    sendToCurrentTab('subscribe:none', null)
    return null
  }

  const results: Bookmark[] = []
  count = Math.min(availableBmIds.size, count)
  while (results.length < count && availableBmIds.size) {
    const randomIndex = Math.floor(Math.random() * availableBmIds.size)
    const randomId = Array.from(availableBmIds)[randomIndex]
    try {
      const [node] = await browser.bookmarks.get(randomId)
      const path = await getBookmarkPath(node)
      results.push({
        id: node.id,
        title: node.title,
        url: node.url,
        date: node.dateAdded,
        path,
      })
      availableBmIds.delete(randomId)
    }
    catch (err) {
      console.warn(`Failed to get bookmark with ID ${randomId}: ${err}`)
      availableBmIds.delete(randomId)
    }
  }
  return results
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

async function pushSubscribe(bookmarks?: Bookmark[]) {
  const data = bookmarks || await getRandomBookmark()
  if (!data) {
    return
  }
  sendToCurrentTab('subscribe:push', data)
}

async function sendToCurrentTab<K extends keyof ProtocolMap>(messageID: K, data: ProtocolMap[K]) {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true })
  if (tabs.length) {
    console.log(`${messageID}: Find active tab`)
    sendMessage(messageID, data as any, { context: 'content-script', tabId: tabs[0].id })
  }
  else {
    console.warn(`${messageID}: Can not find active tab`)
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
  return fetch(link, { method: 'HEAD' })
    .then(response => response.ok || Promise.reject(new Error(`HEAD request not ok: ${response.status}`)))
    .catch((err) => {
      console.warn(err)
      return fetch(link, { method: 'GET' })
        .then(response => response.ok)
        .catch((err) => {
          console.warn('GET request not ok', err)
          return false
        })
    })
}

onMessage('schedule:update', async ({ data }) => {
  startJobs(data)
  await initAllBookmarkIds()
})

onMessage('subscribe:update', async ({ data }) => {
  await initAllBookmarkIds(data)
})

onMessage('subscribe:remind', ({ data }) => {
  setTimeout(() => pushSubscribe(data), remindTime.value)
})

onMessage('subscribe:refresh', ({ data }) => {
  data.forEach(v => excludeBmIds.add(v.id!))
  pushSubscribe()
})

onMessage('subscribe:request', () => {
  excludeBmIds.clear()
  pushSubscribe()
})

onMessage('subscribe:check', async ({ data }) => {
  data.forEach(async (item) => {
    const valid = await checkLinkValid(item.url)
    sendToCurrentTab('subscribe:valid', { ...item, valid })
  })
})
