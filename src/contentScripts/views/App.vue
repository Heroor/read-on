<script setup lang="ts">
import { useCounter, useToggle } from '@vueuse/core'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import 'uno.css'
import dayjs from 'dayjs'
import { translate as t } from '~/i18n'
import type { Bookmark } from '~/type'
import { configs, delayCloseTime, pushHistories } from '~/logic/storage'

const DURATION = computed(() => delayCloseTime.value)
const isDelayClose = computed(() => configs.value.includes('delayClose'))
const titles = computed(() => (t('messageTitles') || []).sort(() => Math.random() - 0.5))
const [show, toggle] = useToggle(false)
const { count: titleIndex, inc: incTitleIndex } = useCounter(0)
const { count: duration, dec: decDuration, set: setDuration } = useCounter(DURATION.value)
const [hasSubscribe, toggleHasSubscribe] = useToggle(true)
const [animateEnable, toggleAnimateEnable] = useToggle(false)
const tNotificationRefs = ref<any[]>([])
const bookmarks = ref<Bookmark[]>([{
  id: '99999',
  title: 'Remind to read your bookmarks.',
  url: 'https://github.com/Heroor/read-on',
  date: +new Date(),
  path: [],
  valid: true,
}])
let timer: any

function remind() {
  close()
  sendMessage('subscribe:remind', bookmarks.value)
}

function close() {
  toggle(false)
  clearTimeout(timer)
}

function refresh() {
  toggleAnimateEnable(false)
  sendMessage('subscribe:refresh', bookmarks.value)
}

onMessage('subscribe:push', async ({ data }) => {
  bookmarks.value = data
  checkLinks(data)
  incTitleIndex()
  toggleHasSubscribe(true)
  toggleAnimateEnable(true)
  toggle(true)
  saveHistory(data)
  if (isDelayClose.value) {
    delayClose()
  }
})

onMessage('subscribe:none', () => {
  toggleHasSubscribe(false)
})

onMessage('subscribe:valid', ({ data }) => {
  const target = bookmarks.value.find(item => item.id === data.id)
  if (target) {
    target.valid = data.valid
  }
})

function checkLinks(list: Bookmark[]) {
  sendMessage('subscribe:check', list)
}

async function saveHistory(list: Bookmark[]) {
  const maxHistoryLength = 50
  const newList = list.map(item => ({
    ...item,
    pushDate: +new Date(),
  }),
  )
  const res = [...newList, ...pushHistories.value].slice(0, maxHistoryLength)
  pushHistories.value.length = 0
  await nextTick()
  pushHistories.value = res
}

function delayClose() {
  clearTimeout(timer)
  setDuration(DURATION.value)
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
        <span v-else class="text-12px font-normal text-gray-400 select-none">{{ t('noMore') }}</span>
      </div>
    </template>
    <a
      v-for="(item, index) in bookmarks" :key="item.id"
      :href="item.url" :target="`__blank${+new Date()}`"
      class="group block decoration-none rounded-8px bg-light-400 hover:bg-bluegray-100 pl-13px pr-10px pt-7px pb-9px duration-200 border border-solid border-transparent not-first:mt-8px"
      :class="{ '!border-red-300': item.valid === false, '!bg-red-50': item.valid === false }"
      @click="close"
    >
      <div :ref="(el) => { tNotificationRefs[index] = el }" class="flex text-gray-800 animate-duration-300" :class="{ 'animate-fade-in': animateEnable }">
        <div class="flex-1 text-overflow-ellipsis font-bold pr-2px">
          {{ item.title }}
        </div>
        <material-symbols-open-in-new-rounded v-if="item.valid" class="h-22px text-gray-500" />
        <t-tooltip
          v-else
          :attach="() => tNotificationRefs[index]!" placement="bottom-right"
          :overlay-style="{ maxWidth: '280px' }"
          destroy-on-close :show-arrow="false"
        >
          <nonicons:loading-16 v-if="item.valid === undefined" class="animate-spin h-22px text-gray-500" />
          <material-symbols-error v-else-if="item.valid === false" class="text-red h-22px" />
          <template #content>
            <div class="text-12px text-left">
              <template v-if="item.valid === undefined">
                {{ t('checkingLinkValidity') }}
              </template>
              <template v-else-if="item.valid === false">
                <div>*{{ t('linkInvalid') }}</div>
                <div>*{{ t('networkIssue') }}</div>
              </template>
            </div>
          </template>
        </t-tooltip>
      </div>
      <div class="text-gray-500 text-overflow-2-line group-hover:decoration-underline leading-16px mt-2px animate-duration-300" :class="{ 'animate-fade-in': animateEnable }">
        {{ item.url }}
      </div>
    </a>

    <template #footer>
      <div class="t-notification__detail flex items-center gap-16px px-4px m-none">
        <div class="flex-1 text-12px text-gray-500 text-left">
          <template v-if="bookmarks.length === 1">
            {{ t('createdOn') }}{{ dayjs(bookmarks[0].date).format('YYYY/MM/DD') }}
          </template>
        </div>
        <t-link class="text-gray-500 !after:border-gray-500" @click="close">
          {{ t('cancel') }}<span v-if="isDelayClose">({{ duration }}s)</span>
        </t-link>
        <t-link v-if="configs.includes('remind')" theme="primary" @click="remind">
          {{ t('remindLater') }}
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
.t-notification :deep(.t-notification__main) {
  min-width: 1px;
}
.t-notification :deep(.t-notification__title) {
  width: 100%;
}
.t-notification :deep(.t-notification__content) {
  max-height: none;
  padding-bottom: 10px;
}
.t-notification :deep(.t-popup__content) {
  --td-radius-medium: 8px;
  padding: 6px 12px;
}
</style>
