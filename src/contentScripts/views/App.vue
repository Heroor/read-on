<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import 'uno.css'
import dayjs from 'dayjs'
import type { Bookmark } from '~/type'

const titles = ['是时候回顾一下啦', '阅读时刻到啦', '看看我找到了什么', '别忘了学习', '要一起冒险吗', '翻开过去的宝藏', '寻访往日珍藏']
const [show, toggle] = useToggle(false)
const bookmarkData = ref<Bookmark>({
  title: 'Title',
  url: 'https://example.com',
  date: 1552215738764,
  path: [],
})

function remind() {
  toggle(false)
  sendMessage('subscribe:remind', bookmarkData.value)
}

onMessage('subscribe:push', async ({ data }) => {
  Object.assign(bookmarkData.value, data)
  toggle(true)
})
</script>

<template>
  <div>
    <t-notification
      v-if="show"
      class="t-notification fixed top-10px right-10px z-2024" :icon="false" :title="titles[Math.random() * titles.length >> 0]" :duration="15000" @duration-end="toggle(false)"
    >
      <a :href="bookmarkData.url" target="__blank" class="group block w-312px decoration-none rounded-8px hover:bg-light-400 p-8px">
        <div class="flex items-center text-gray-700">
          <div class="flex-1 text-overflow-ellipsis">
            {{ bookmarkData.title }}
          </div>
          <material-symbols:arrow-right-alt class="hidden group-hover:block" />
        </div>
        <div class="text-gray-500 text-overflow-2-line group-hover:decoration-underline">
          {{ bookmarkData.url }}
        </div>
      </a>
      <template #footer>
        <div class="t-notification__detail flex items-center">
          <div class="flex-1 text-xs text-gray-400 text-left pl-6px">
            书签创建于：{{ dayjs(bookmarkData.date).format('YYYY-MM-DD') }}
          </div>
          <t-link theme="primary" class="mr-12px" @click="toggle(false)">
            跳过
          </t-link>
          <t-link theme="primary" @click="remind">
            5 分钟后提醒
          </t-link>
        </div>
      </template>
    </t-notification>
  </div>
</template>

<style scoped>
.t-notification >>> .t-notification__content {
  max-height: 75px;
}
</style>
