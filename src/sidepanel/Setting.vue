<script setup lang="ts">
import { configs, delayCloseTime, pushCount, remindTime } from '~/logic/storage'

const delayCloseTimes = [
  { label: '5 秒', value: 5 },
  { label: '10 秒', value: 10 },
  { label: '15 秒', value: 15 },
  { label: '20 秒', value: 20 },
  { label: '30 秒', value: 30 },
  { label: '1 分钟', value: 60 },
]

const remindTimes = [
  { label: '1 分钟', value: 1000 * 60 },
  { label: '2 分钟', value: 1000 * 60 * 2 },
  { label: '3 分钟', value: 1000 * 60 * 3 },
  { label: '5 分钟', value: 1000 * 60 * 5 },
  { label: '10 分钟', value: 1000 * 60 * 10 },
  { label: '15 分钟', value: 1000 * 60 * 15 },
  { label: '20 分钟', value: 1000 * 60 * 20 },
  { label: '30 分钟', value: 1000 * 60 * 30 },
  { label: '1 小时', value: 1000 * 60 * 60 },
  { label: '2 小时', value: 1000 * 60 * 60 * 2 },
  { label: '3 小时', value: 1000 * 60 * 60 * 3 },
]
</script>

<template>
  <div class="setting">
    <div class="form-label">
      推送操作设置：
    </div>
    <div class="pt-1">
      <t-checkbox-group v-model="configs" class="pl-2 !flex-col !gap-0">
        <!-- <div class="mt-1">
          <t-checkbox value="uninteresting">
            不感兴趣
          </t-checkbox>
        </div>
        <div class="mt-1">
          <t-checkbox value="deletable">
            删除收藏
          </t-checkbox>
        </div> -->
        <div class="flex items-center mt-1">
          <t-checkbox value="delayClose">
            自动关闭消息
          </t-checkbox>
          <span class="ml-5">延时：</span>
          <t-select v-model="delayCloseTime" class="inline-block !w-95px" placeholder="延时" :disabled="!configs.includes('delayClose')">
            <t-option v-for="item in delayCloseTimes" :key="item.value" :label="item.label" :value="item.value" />
          </t-select>
        </div>
        <div class="flex items-center mt-1">
          <t-checkbox value="remind">
            稍后提醒
          </t-checkbox>
          <span class="ml-5">间隔：</span>
          <t-select v-model="remindTime" class="inline-block !w-95px" placeholder="间隔" :disabled="!configs.includes('remind')">
            <t-option v-for="item in remindTimes" :key="item.value" :label="item.label" :value="item.value" />
          </t-select>
        </div>
      </t-checkbox-group>
      <div class="lh-32px pl-2 mt-1">
        <span>推送条数：</span>
        <t-select v-model="pushCount" class="inline-block !w-95px" placeholder="间隔">
          <t-option v-for="item in 5" :key="item" :label="`${item} 条`" :value="item" />
        </t-select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setting :deep(.t-checkbox__label) {
  line-height: 32px !important;
}
</style>
