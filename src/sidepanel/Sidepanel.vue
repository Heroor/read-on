<script setup lang="ts">
import { sendMessage } from 'webext-bridge/popup'
import MarkItem from './MarkItem.vue'
import { scheduleJobs } from '~/logic/storage'

const mark = ref<any>([])

browser.bookmarks.getSubTree('1').then((res: any) => {
  mark.value = res[0]
})

// function openOptionsPage() {
//   browser.runtime.openOptionsPage()
// }
const weekName = ['周一', '周二', '周三', '周四', '周五', '周六', '周末']
const jobType = ref('day')
const week = ref(1)
const day = ref(1)
const time = ref('10:00')

function submit() {
  let cron: string = ''
  if (!time.value) {
    scheduleJobs.value = []
    sendMessage('schedule:clear', null)
    return
  }
  const [hour, min, sec = '00'] = time.value.split(':')
  if (jobType.value === 'day') {
    cron = `${sec} ${min} ${hour} * * *`
  }
  else if (jobType.value === 'week' && week.value) {
    cron = `${sec} ${min} ${hour} * * ${week.value}`
  }
  else if (jobType.value === 'month' && day.value) {
    cron = `${sec} ${min} ${hour} ${day.value} * *`
  }
  else {
    scheduleJobs.value = []
    sendMessage('schedule:clear', null)
    return
  }
  scheduleJobs.value = [{
    cron,
    type: jobType.value,
  }]
  setTimeout(() => sendMessage('schedule:update', null), 0)
}
</script>

<template>
  <main class="w-full px-4 py-5 text-gray-700 text-sm">
    <div class="flex items-center gap-1">
      <div>推送时间：</div>
      <t-select v-model="jobType" class="w-80px" placeholder="周期" @change="submit">
        <t-option key="day" label="每天" value="day" />
        <t-option key="week" label="每周" value="week" />
        <t-option key="month" label="每月" value="month" />
      </t-select>
      <t-select v-if="jobType === 'week'" v-model="week" class="w-80px inline-block" @change="submit">
        <t-option v-for="m in 7" :key="m" :label="weekName[m - 1]" :value="m" />
      </t-select>
      <t-select v-if="jobType === 'month'" v-model="day" class="w-80px inline-block" @change="submit">
        <t-option v-for="m in 31" :key="m" :label="`${m}日`" :value="m" />
      </t-select>
      <t-time-picker v-if="jobType" v-model="time" placeholder="时间" class="w-80px inline-block" format="HH:mm" :steps2="[1, 5]" @change="submit" />
    </div>
    <hr class="my-4">
    <MarkItem :node="mark" />
    <!-- <div>
      <button class="btn mt-2" @click="openOptionsPage">
        Setting
      </button>
    </div> -->
  </main>
</template>

<style>
.t-time-picker__panel {
  width: 160px;
}
</style>
