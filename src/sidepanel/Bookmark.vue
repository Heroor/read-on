<script setup lang="ts">
import { sendMessage } from 'webext-bridge/options'
import { subscribeStorage } from '~/logic/storage'
import type { Bookmark } from '~/type'

const props = defineProps({
  node: {
    type: Object,
    default: () => ({}),
  },
  deep: {
    type: Number,
    default: 0,
  },
  expand: {
    type: Boolean,
    default: false,
  },
})

const isExpand = ref(props.expand)

function subscribe(node: Bookmark) {
  subscribeStorage.value.add(node.id!)
  if (node.children) {
    node.children.forEach((child) => {
      child.children && subscribe(child)
    })
  }
  sendMessage('subscribe:update', Array.from(subscribeStorage.value))
}

function unSubscribe(node: Bookmark) {
  subscribeStorage.value.delete(node.id!)
  if (node.children) {
    node.children.forEach((child) => {
      child.children && unSubscribe(child)
    })
  }
  sendMessage('subscribe:update', Array.from(subscribeStorage.value))
}

const hasChildren = computed(() => props.node.children?.some((n: any) => n.children))
</script>

<template>
  <div v-if="node && node.children" :class="{ '!pl-32px': !hasChildren }">
    <div
      class="flex items-center leading-7 rounded hover:bg-light pl-4px pr-10px py-2px text-gray-800 cursor-pointer"
      :class="{ '!pl-10px': !hasChildren }"
      @click="hasChildren && (isExpand = !isExpand)"
    >
      <material-symbols:arrow-right-rounded v-if="hasChildren" :class="{ 'rotate-90': isExpand }" class="text-20px opacity-40" />
      <material-symbols:folder class="opacity-40 mr-5px" />
      <span class="flex-1 text-13px text-overflow-ellipsis mr-5px">
        {{ node.title }}
      </span>
      <span>
        <t-link v-if="subscribeStorage.has(node.id)" class="text-12px" theme="danger" @click.stop="unSubscribe(node as Bookmark)">取消</t-link>
        <t-link v-else class="text-12px" theme="primary" @click.stop="subscribe(node as Bookmark)">订阅</t-link>
      </span>
    </div>
    <template v-if="isExpand">
      <Bookmark v-for="child in node.children" :key="child.id" :node="child" class="pl-16px" />
    </template>
  </div>
</template>
