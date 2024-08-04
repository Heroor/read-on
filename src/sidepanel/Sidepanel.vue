<script setup lang="ts">
import { sendMessage } from 'webext-bridge/popup'
import dayjs from 'dayjs'
import Bookmark from './Bookmark.vue'
import HistoryList from './History.vue'
import Setting from './Setting.vue'
import { translate as t } from '~/i18n'
import languageConfig from '~/i18n/config.json'
import { language, readScheduleJobs, scheduleJobs, subscribeStorage } from '~/logic/storage'

const bookmarkTree = ref<any>([])

browser.bookmarks.getSubTree(__FIREFOX__ ? 'root________' : '0').then(([res]: any) => {
  bookmarkTree.value = res?.children || []
})

const curTab = ref(1)
const editJobs = ref<{ type: string, week?: string, day?: string, time: string }[]>([])
const weekName = computed(() => t('weekDays') || [])
const isDev = __DEV__

function defaultData() {
  const weekDay = String(new Date().getDay())
  return {
    type: 'day',
    week: weekDay === '0' ? '7' : weekDay,
    day: String(new Date().getDate()),
    time: dayjs().format('HH:mm'),
  }
}

onMounted(async () => {
  await readScheduleJobs()
  editJobs.value = scheduleJobs.value.map((job) => {
    if (!job) {
      return null
    }
    const { cron, type } = job
    const [_s, m, h, d, _m, w] = cron.split(' ')
    if (type === 'day') {
      return {
        ...defaultData(),
        type,
        time: `${formatTimeItem(h)}:${formatTimeItem(m)}`,
      }
    }
    else if (type === 'week') {
      return {
        ...defaultData(),
        type,
        week: w,
        time: `${formatTimeItem(h)}:${formatTimeItem(m)}`,
      }
    }
    else if (type === 'month') {
      return {
        ...defaultData(),
        type,
        day: d,
        time: `${formatTimeItem(h)}:${formatTimeItem(m)}`,
      }
    }
    return null
  }).filter(item => !!item)
})

function formatTimeItem(val: string | number = 0) {
  return (`0${String(val)}`).substr(-2)
}

function addJob() {
  editJobs.value.push({
    ...defaultData(),
  })
  submit()
}

function removeJob(index: number) {
  editJobs.value.splice(index, 1)
  submit()
}

function submit() {
  scheduleJobs.value = editJobs.value.map(({ type, time, week, day }) => {
    if (!time) {
      return null
    }
    const [hour, min, sec = '0'] = time.split(':')
    if (type === 'day') {
      return {
        type,
        cron: `${+sec} ${+min} ${+hour} * * *`,
      }
    }
    else if (type === 'week' && week) {
      return {
        type,
        cron: `${+sec} ${+min} ${+hour} * * ${week}`,
      }
    }
    else if (type === 'month' && day) {
      return {
        type,
        cron: `${+sec} ${+min} ${+hour} ${day} * *`,
      }
    }
    else {
      return null
    }
  }).filter(item => !!item)
  sendMessage('schedule:update', scheduleJobs.value)
}

function requestBookmark() {
  sendMessage('subscribe:request', null)
}
const globalConfig = computed(() => {
  const target = languageConfig.languages.find(item => item.code === language.value)
  if (target) {
    return target.UI
  }
  else {
    return languageConfig.languages.find(item => item.code === 'en')!.UI
  }
})
</script>

<template>
  <t-config-provider :global-config="globalConfig">
    <main class="w-full px-4 pt-4px pb-5 text-gray-700 text-sm">
      <t-tabs v-model:value="curTab" class="w-full">
        <t-tab-panel :value="1" :label="t('timedPush')">
          <div class="pt-3">
            <div v-if="!subscribeStorage.size" class="mb-2 py-2.5 px-3.5 bg-[rgb(246,186,66,0.2)] rounded-6px text-14px">
              <mingcute:warning-fill class="text-[#f6bb42] inline vertical-sub text-15px" />
              {{ t('remindToSubscribe') }}<t-link theme="primary" class="ml-1" @click="curTab = 2">
                {{ t('subscribeLink') }}
              </t-link>
            </div>
            <div class="form-label">
              {{ t('pushTime') }}
            </div>
            <div v-for="(item, index) in editJobs" :key="index" class="flex items-center gap-1 mt-2.5">
              <material-symbols:do-not-disturb-on-rounded class="text-18px ml-1 text-[--td-brand-color] cursor-pointer hover:opacity-80" @click="removeJob(index)" />
              <t-select v-model="item.type" class="!w-95px" @change="submit()">
                <t-option key="day" :label="t('daily')" value="day" />
                <t-option key="week" :label="t('weekly')" value="week" />
                <t-option key="month" :label="t('monthly')" value="month" />
              </t-select>
              <t-select v-if="item.type === 'week'" v-model="item.week" class="!w-95px inline-block" @change="submit()">
                <t-option v-for="m in 7" :key="m" :label="weekName[m - 1]" :value="`${m}`" />
              </t-select>
              <t-select v-if="item.type === 'month'" v-model="item.day" class="!w-95px inline-block" @change="submit()">
                <t-option v-for="m in 31" :key="m" :label="`${m} ${t('day')}`" :value="`${m}`" />
              </t-select>
              <t-time-picker v-if="item.type" v-model="item.time" class="!w-95px inline-block" format="HH:mm" :steps2="[1, 5]" @change="submit()" />
            </div>
            <div class="h30px flex items-center mt-2.5">
              <div class="flex items-center gap-1 cursor-pointer hover:opacity-80" @click="addJob">
                <material-symbols:add-circle-rounded class="text-18px ml-1 mr-3px text-[--td-brand-color]" />
                <span>{{ t('addSubscription') }}</span>
              </div>
            </div>
          </div>
        </t-tab-panel>
        <t-tab-panel :value="2" :label="t('bookmarkSubscription')">
          <div class="pt-2">
            <Bookmark v-for="item in bookmarkTree" :key="item.id" :node="item" expand />
          </div>
        </t-tab-panel>
        <t-tab-panel :value="3" :label="t('pushHistory')">
          <HistoryList class="pt-2" />
        </t-tab-panel>
        <t-tab-panel :value="4" :label="t('settings')">
          <Setting class="pt-2" />
        </t-tab-panel>
      </t-tabs>
      <hr class="my-4">
      <t-button v-if="isDev" mt-3 @click="requestBookmark">
        Test
      </t-button>
      <div class="text-center py-14px">
        <a class="inline-block" href="https://github.com/Heroor/read-on">
          <mdi-github class="inline text-20px" />
          <div class="text-gray">
            Come On, Read On!
          </div>
        </a>
      </div>
    </main>
  </t-config-provider>
</template>

<style>
.t-time-picker__panel {
  width: 150px;
}
.t-time-picker__panel-section-footer {
  padding: 10px 12px;
}
</style>
