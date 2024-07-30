<script setup lang="ts">
import { useCounter, useToggle } from '@vueuse/core'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import 'uno.css'
import dayjs from 'dayjs'
import type { Bookmark } from '~/type'
import { pushHistories } from '~/logic/storage'

const DURATION = 15
const titles = [
  '👀 是时候回顾一下啦',
  '📖 阅读时刻到',
  '🌟 快看我找到了什么',
  '📚 别忘记了学习哦',
  '🧗 来一场冒险吗',
  '💎 翻开昔日的宝藏吧',
  '🔍 探索一个未知的秘密',
  '🎉 让我们重温美好时光',
  '🗝️ 解锁过去的故事吧',
  '🧩 拼凑过去的记忆吧',
  '🚀 准备好飞向新的旅途了吗',
].sort(() => Math.random() - 0.5)
const { count: titleIndex, inc: incTitleIndex } = useCounter(0)
const { count: duration, dec: decDuration, set: setDuration } = useCounter(DURATION)
const [show, toggle] = useToggle(false)
const [hasSubscribe, toggleHasSubscribe] = useToggle(true)
const [animateEnable, toggleAnimateEnable] = useToggle(false)
const bookmarkData = ref<Bookmark>({
  id: '99999',
  title: 'Continue reading your bookmarks.',
  url: 'https://github.com/Heroor/read-on',
  date: 1722072498173,
  path: [],
})
let timer: any

function remind() {
  close()
  sendMessage('subscribe:remind', bookmarkData.value)
}

function close() {
  toggle(false)
  clearTimeout(timer)
}

function refresh() {
  toggleAnimateEnable(false)
  sendMessage('subscribe:refresh', bookmarkData.value)
}

onMessage('subscribe:push', async ({ data }) => {
  Object.assign(bookmarkData.value, data)
  incTitleIndex()
  toggleHasSubscribe(true)
  toggleAnimateEnable(true)
  toggle(true)
  delayClose()
  saveHistory(data)
})

onMessage('subscribe:none', () => {
  toggleHasSubscribe(false)
})

function saveHistory(bookmark: Bookmark) {
  if (pushHistories.value.length >= 50) {
    pushHistories.value.pop()
  }
  pushHistories.value.unshift({
    ...bookmark,
    pushDate: +new Date(),
  })
}

function delayClose() {
  clearTimeout(timer)
  setDuration(DURATION)
  const loop = () => {
    clearTimeout(timer)
    if (duration.value <= 0) {
      toggle(false)
      return
    }
    timer = setTimeout(() => {
      decDuration()
      loop()
    }, 1000)
  }
  loop()
}
</script>

<template>
  <t-notification
    v-if="show"
    class="t-notification fixed top-10px right-10px z-92024 p-14px animate-back-in-right" :icon="false" :duration="0"
  >
    <template #title>
      <div class="flex items-center px-4px">
        <div class="flex-1">
          {{ titles[titleIndex % titles.length] }}
        </div>
        <material-symbols-sync v-if="hasSubscribe" class="text-gray-500 hover:text-gray-700 active:text-gray-500 cursor-pointer select-none p-2px" @click="refresh" />
        <span v-else class="text-12px font-normal text-gray-400 select-none">没有更多了</span>
      </div>
    </template>
    <a
      :href="bookmarkData.url" :target="`__blank${+new Date()}`"
      class="group block decoration-none rounded-8px bg-light-400 hover:bg-bluegray-100 px-14px pt-8px pb-10px duration-200"
      @click="close"
    >
      <div class="flex text-gray-800 animate-duration-300" :class="{ 'animate-fade-in': animateEnable }">
        <div class="flex-1 text-overflow-ellipsis font-bold pr-2px">
          {{ bookmarkData.title }}
        </div>
        <material-symbols-open-in-new-rounded class="h-22px" />
      </div>
      <div class="text-gray-500 text-overflow-2-line group-hover:decoration-underline leading-16px mt-2px animate-duration-300" :class="{ 'animate-fade-in': animateEnable }">
        {{ bookmarkData.url }}
      </div>
    </a>
    <template #footer>
      <div class="t-notification__detail flex items-center gap-16px px-4px">
        <div class="flex-1 text-12px text-gray-500 text-left">
          创建于：{{ dayjs(bookmarkData.date).format('YYYY/MM/DD') }}
        </div>
        <t-link class="text-gray-500 !after:border-gray-500" @click="close">
          取消({{ duration }}s)
        </t-link>
        <t-link theme="primary" @click="remind">
          稍后提醒
        </t-link>
      </div>
    </template>
  </t-notification>
</template>

<style scoped>
.t-notification {
  --td-radius-medium: 12px;
  width: 400px;
}
.t-notification >>> .t-notification__main {
  min-width: 1px;
}
.t-notification >>> .t-notification__title {
  width: 100%;
}
.t-notification >>> .t-notification__content {
  max-height: 75px;
}
.t-notification >>> .t-notification__detail {
  margin-top: 10px;
}
</style>
