<script setup lang="ts">
import { sendMessage } from 'webext-bridge/options'
import { translate as t } from '../i18n'
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
  root: {
    type: Boolean,
    default: true,
  },
})

const isExpand = ref(props.expand)

function subscribe(data: Bookmark) {
  const loop = (node: Bookmark) => {
    subscribeStorage.value.add(node.id!)
    if (node.children) {
      node.children.forEach((child) => {
        child.children && loop(child)
      })
    }
  }
  loop(data)
  sendMessage('subscribe:update', Array.from(subscribeStorage.value))
}

function unSubscribe(data: Bookmark) {
  const loop = (node: Bookmark) => {
    subscribeStorage.value.delete(node.id!)
    if (node.children) {
      node.children.forEach((child) => {
        child.children && loop(child)
      })
    }
  }
  loop(data)
  sendMessage('subscribe:update', Array.from(subscribeStorage.value))
}

const hasChildren = computed(() => props.node.children?.some((n: any) => n.children))
</script>

<template>
  <div v-if="node && node.children" :class="{ 'pl-32px': !hasChildren, '!pl-16px': root && !hasChildren }">
    <div
      class="flex items-center leading-7 rounded hover:bg-light pl-4px pr-10px py-2px text-gray-800 cursor-pointer"
      :class="{ '!pl-12px': !hasChildren }"
      @click="hasChildren && (isExpand = !isExpand)"
    >
      <material-symbols:arrow-right-rounded v-if="hasChildren" :class="{ 'rotate-90': isExpand }" class="text-20px opacity-40" />
      <material-symbols:folder class="opacity-40 mr-5px" />
      <span class="flex-1 text-13px text-overflow-ellipsis mr-5px">
        {{ node.title }}
      </span>
      <span>
        <t-link v-if="subscribeStorage.has(node.id)" class="text-12px" theme="danger" @click.stop="unSubscribe(node as Bookmark)">{{ t('cancel') }}</t-link>
        <t-link v-else class="text-12px" theme="primary" @click.stop="subscribe(node as Bookmark)">{{ t('subscribe') }}</t-link>
      </span>
    </div>
    <template v-if="isExpand">
      <Bookmark v-for="child in node.children" :key="child.id" :node="child" class="pl-16px" :root="false" />
    </template>
  </div>
</template>
