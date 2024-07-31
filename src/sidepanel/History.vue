<script setup lang="ts">
import dayjs from 'dayjs'
import { pushHistories } from '~/logic/storage'

function dateFormat(pushDate: number) {
  if (!pushDate) {
    return '未知日期'
  }
  const date = dayjs(pushDate)
  const y = date.year()
  const m = date.month()
  const d = date.date()
  const now = dayjs()
  const ny = now.year()
  const nm = now.month()
  const nd = now.date()
  const format = y === ny && m === nm && d === nd ? 'HH:mm:ss' : 'YYYY/MM/DD HH:mm:ss'
  return date.format(format)
}
</script>

<template>
  <div>
    <a v-for="(item, index) in pushHistories" :key="item.id" :href="item.url" :target="`__blank${item.id}`" class="group decoration-none block cursor-pointer hover:bg-light-400 rounded-10px duration-200">
      <div class="item px-14px py-10px pb-8px border-t group-hover:border-color-transparent duration-200" :class="{ 'border-b': index === pushHistories.length - 1, 'border-t-none': !index }">
        <div class="flex gap-1 text-gray-800 font-bold">
          <div class="flex-1 text-overflow-ellipsis text-14px font-bold pr-2px">
            {{ item.title }}
          </div>
          <material-symbols-open-in-new-rounded class="h-15px mt-3px text-gray-500" />
        </div>
        <div class="text-gray-500 text-13px text-overflow-2-line group-hover:underline leading-16px mt-1px">
          {{ item.url }}
        </div>
        <div class="flex justify-between text-gray-400 mt-1 gap-4 text-12px">
          <div class="text-overflow-ellipsis">
            <material-symbols:folder class="inline text-13px vertical--4px" opacity-70 />
            {{ item.path?.join('/') }}
          </div>
          <div>{{ dateFormat(item.pushDate!) }}</div>
        </div>
      </div>
    </a>
    <div class="pt-3 pl-3 text-xs text-gray-500">
      *只展示最近 50 条推送历史
    </div>
  </div>
</template>

<style scoped>
.group:hover + .group .item {
  border-top-color: transparent;
}
</style>
