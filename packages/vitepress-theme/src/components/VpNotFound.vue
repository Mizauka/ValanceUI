<script setup lang="ts">
import { VlEmptyState } from '@valance-ui/vue'
import { useBlogState } from '../composables/useBlogState'

const { openPath } = useBlogState()
</script>

<template>
  <VlEmptyState
    title="404 · 页面不存在"
    description="你访问的路径未命中任何文章或页面，可以返回首页重新浏览。"
    cta-label="返回博客首页"
    cta-icon="arrow-right"
    @action="openPath('/')"
  />
</template>
