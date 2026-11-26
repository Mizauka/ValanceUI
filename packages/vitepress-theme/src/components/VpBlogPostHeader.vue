<script setup lang="ts">
import { computed } from 'vue'
import { VlBadge, VlTag } from '@valance-ui/vue'
import { useBlogState } from '../composables/useBlogState'

const { frontmatter, page, currentPost, selectedTag, openPath } = useBlogState()

const title = computed(() => frontmatter.value?.title || currentPost.value?.title || page.value.title)
const category = computed(() => frontmatter.value?.category || currentPost.value?.category)
const date = computed(() => currentPost.value?.dateText || frontmatter.value?.date || currentPost.value?.date)
const tags = computed<string[]>(() => frontmatter.value?.tags || currentPost.value?.tags || [])
const readingMinutes = computed(() => currentPost.value?.readingMinutes)
const wordCount = computed(() => currentPost.value?.wordCount)

function jumpTag(tag: string) {
  selectedTag.value = tag
  openPath('/')
}
</script>

<template>
  <header v-if="title" class="vp-post-header shape-rect">
    <div class="post-badges">
      <VlBadge v-if="category" tone="primary" variant="solid" size="sm">{{ category }}</VlBadge>
      <VlBadge v-if="date" tone="secondary" size="sm">{{ date }}</VlBadge>
      <VlBadge v-if="wordCount" tone="neutral" size="sm">{{ wordCount.toLocaleString() }} 字</VlBadge>
      <VlBadge v-if="readingMinutes" tone="neutral" size="sm">约 {{ readingMinutes }} 分钟</VlBadge>
    </div>

    <h1 class="post-main-title">{{ title }}</h1>

    <div v-if="tags.length" class="post-tag-row">
      <VlTag
        v-for="tag in tags"
        :key="tag"
        clickable
        tone="secondary"
        size="sm"
        @click="jumpTag(tag)"
      >
        # {{ tag }}
      </VlTag>
    </div>
  </header>
</template>

<style scoped>
.vp-post-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 3px solid var(--accent-primary);
}

.post-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.post-main-title {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  line-height: 1.28;
  color: var(--text-primary);
}

.post-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
