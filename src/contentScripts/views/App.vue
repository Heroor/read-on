<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { remindTime } from '~/logic/storage'
import 'uno.css'

console.log(getCurrentInstance())
const [show, toggle] = useToggle(true)

function remind() {
  toggle(false)
  setTimeout(() => {
    toggle(true)
  }, remindTime.value)
}
</script>

<template>
  <div>
    <t-notification
      v-if="show"
      class="fixed top-5 right-5 z-2024" :icon="false" title="阅读时刻" content="这是一条消息通知" :duration="5000" @duration-end="toggle(false)"
    >
      <template #footer>
        <div class="t-notification__detail">
          <t-link theme="primary" class="mr-5" @click="toggle(false)">
            取消
          </t-link>
          <t-link theme="primary" @click="remind">
            稍后提醒
          </t-link>
        </div>
      </template>
    </t-notification>
  </div>
</template>
