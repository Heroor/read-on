<script setup lang="ts">
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
}

function unSubscribe(node: Bookmark) {
  subscribeStorage.value.delete(node.id!)
  if (node.children) {
    node.children.forEach((child) => {
      child.children && unSubscribe(child)
    })
  }
}
</script>

<template>
  <div v-if="node && node.children">
    <div
      class="flex leading-7 rounded hover:bg-light"
      :style="{
        paddingLeft: `${deep * 1}rem`,
      }"
    >
      <span class="flex-1">
        {{ node.title }}
      </span>
      <span>
        <t-link v-if="subscribeStorage.has(node.id)" theme="danger" @click="unSubscribe(node as Bookmark)">取消</t-link>
        <t-link v-else theme="primary" @click="subscribe(node as Bookmark)">订阅</t-link>
      </span>
    </div>
    <MarkItem v-for="child in node.children" :key="child.id" :node="child" :deep="deep + 1" />
  </div>
</template>
