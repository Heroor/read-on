<script setup lang="ts">
import { initTranslations, translate as t } from '../i18n'
import languageConfig from '../i18n/config.json'
import { configs, delayCloseTime, language, pushCount, remindTime } from '~/logic/storage'

const delayCloseTimes = computed(() => t('delayCloseTimes') || [])
const remindTimes = computed(() => t('remindTimes') || [])

function changeLanguage(data: any) {
  initTranslations(data)
}
</script>

<template>
  <div class="setting">
    <div class="form-label">
      {{ t('pushOperation') }}
    </div>
    <div class="pt-1">
      <t-checkbox-group v-model="configs" class="pl-2 !flex-col !gap-0">
        <div class="flex items-center mt-1">
          <t-checkbox value="delayClose">
            {{ t('autoCloseMessage') }}
          </t-checkbox>
          <span class="ml-5 mr-2">{{ t('delay') }}</span>
          <t-select v-model="delayCloseTime" class="inline-block !w-95px" :disabled="!configs.includes('delayClose')">
            <t-option v-for="item in delayCloseTimes" :key="item.value" :label="item.label" :value="item.value" />
          </t-select>
        </div>
        <div class="flex items-center mt-1">
          <t-checkbox value="remind">
            {{ t('remindLater') }}
          </t-checkbox>
          <span class="ml-5 mr-2">{{ t('interval') }}</span>
          <t-select v-model="remindTime" class="inline-block !w-95px" :disabled="!configs.includes('remind')">
            <t-option v-for="item in remindTimes" :key="item.value" :label="item.label" :value="item.value" />
          </t-select>
        </div>
      </t-checkbox-group>
      <div class="lh-32px pl-2 mt-1">
        <span class="mr-2">{{ t('pushCount') }}</span>
        <t-select v-model="pushCount" class="inline-block !w-80px">
          <t-option v-for="item in 5" :key="item" :label="`${item}`" :value="item" />
        </t-select>
      </div>
      <div class="lh-32px pl-2 mt-1">
        <span class="mr-2">{{ t('language') }}</span>
        <t-select :value="language" class="inline-block !w-95px" @change="changeLanguage">
          <t-option v-for="item in languageConfig.languages" :key="item.code" :label="`${item.label}`" :value="item.code" />
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
