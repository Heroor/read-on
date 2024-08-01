<script setup lang="ts">
import { sendMessage } from 'webext-bridge/options'
import { subscribeStorage } from '~/logic/storage'
import type { Bookmark } from '~/type'

defineProps({
  node: {
    type: Object,
    default: () => ({}),
  },
  deep: {
    type: Number,
    default: 0,
  },
})

function subscribe(node: Bookmark) {
  subscribeStorage.value.add(node.id!)
  if (node.children) {
    node.children.forEach((child) => {
      child.children && subscribe(child)
    })
  }
  setTimeout(() => {
    sendMessage('subscribe:update', null)
  }, 0)
}

function unSubscribe(node: Bookmark) {
  subscribeStorage.value.delete(node.id!)
  if (node.children) {
    node.children.forEach((child) => {
      child.children && unSubscribe(child)
    })
  }
  setTimeout(() => {
    sendMessage('subscribe:update', null)
  }, 0)
}
</script>

<template>
  <div v-if="node && node.children">
    <div
      class="flex leading-7 rounded hover:bg-light px-10px py-2px text-gray-800"
      :style="{
        paddingLeft: `${deep * 16 + 10}px`,
      }"
    >
      <span class="flex-1 text-13px">
        <material-symbols:folder class="inline vertical-sub opacity-40 mr-4px" />
        <span>{{ node.title }}</span>
      </span>
      <span>
        <t-link v-if="subscribeStorage.has(node.id)" class="text-12px" theme="danger" @click="unSubscribe(node as Bookmark)">取消</t-link>
        <t-link v-else class="text-12px" theme="primary" @click="subscribe(node as Bookmark)">订阅</t-link>
      </span>
    </div>
    <MarkItem v-for="child in node.children" :key="child.id" :node="child" :deep="deep + 1" />
  </div>
</template>
