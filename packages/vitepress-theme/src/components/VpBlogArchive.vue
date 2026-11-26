<script setup lang="ts">
import { computed } from 'vue'
import { VlAccordion, VlBadge, VlTag, VlIcon } from '@valance-ui/vue'
import { useBlogState } from '../composables/useBlogState'
import type { BlogPostMeta } from '../types'

const { posts, allTags, allCategories, selectedTag, openPath } = useBlogState()

const groupedByYear = computed(() => {
  const map = new Map<string, BlogPostMeta[]>()
  for (const post of posts.value) {
    const year = post.date?.slice(0, 4) || '未归档'
    const list = map.get(year) ?? []
    list.push(post)
    map.set(year, list)
  }
  return Array.from(map.entries()).map(([year, items]) => ({ year, items }))
})

function pickTag(tag: string) {
  selectedTag.value = tag
  openPath('/')
}
</script>

<template>
  <div class="vp-archive-page">
    <header class="archive-head shape-rect">
      <span class="head-bar shape-rect" />
      <div>
        <h1 class="archive-title">文章时间线归档</h1>
        <p class="archive-sub">
          共收录 {{ posts.length }} 篇文章 · {{ allCategories.length }} 个分类 · {{ allTags.length }} 个标签
        </p>
      </div>
    </header>

    <section v-if="allTags.length" class="tag-cloud-box shape-rect">
      <div class="box-title">标签索引</div>
      <div class="tag-cloud">
        <VlTag
          v-for="tag in allTags"
          :key="tag.name"
          clickable
          tone="secondary"
          @click="pickTag(tag.name)"
        >
          # {{ tag.name }} ({{ tag.count }})
        </VlTag>
      </div>
    </section>

    <div class="year-groups">
      <VlAccordion
        v-for="group in groupedByYear"
        :key="group.year"
        :default-open="true"
        :title="`${group.year} 年`"
        :count="`${group.items.length} 篇`"
        icon="calendar"
        bordered
      >
        <div class="timeline-list">
          <button
            v-for="post in group.items"
            :key="post.url"
            type="button"
            class="timeline-row shape-rect"
            @click="openPath(post.url)"
          >
            <span class="tl-dot shape-circle" />
            <span class="tl-date">{{ post.dateText ?? post.date }}</span>
            <span class="tl-title">{{ post.title }}</span>
            <VlBadge v-if="post.category" tone="primary" size="xs">{{ post.category }}</VlBadge>
            <VlIcon name="arrow-right" :size="12" class="tl-arrow" />
          </button>
        </div>
      </VlAccordion>
    </div>
  </div>
</template>

<style scoped>
.vp-archive-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.archive-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.head-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background-color: var(--accent-secondary);
}

.archive-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
}

.archive-sub {
  margin: 4px 0 0 0;
  font-size: var(--ui-font-md);
  color: var(--text-muted);
}

.tag-cloud-box {
  padding: 14px 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.box-title {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.year-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--divider-hairline);
}

.timeline-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--divider-hairline);
  transition: background-color 0.16s var(--ease-standard);
}

.timeline-row:last-child {
  border-bottom: none;
}

.timeline-row:hover {
  background-color: var(--bg-hover);
}

.tl-dot {
  width: 7px;
  height: 7px;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.tl-date {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  white-space: nowrap;
}

.tl-title {
  flex: 1;
  min-width: 0;
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tl-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
