<script setup lang="ts">
import {
  VlAvatar,
  VlBadge,
  VlCard,
  VlEmptyState,
  VlPanel,
  VlTag,
} from '@valance-ui/vue'
import { useBlogState } from '../composables/useBlogState'

const emit = defineEmits<{
  (e: 'jump-heading', id: string): void
}>()

const {
  themeCfg,
  currentPost,
  headings,
  activeHeadingId,
  readingProgress,
  selectedTag,
  openPath,
} = useBlogState()

function jumpTag(tag: string) {
  selectedTag.value = tag
  openPath('/')
}
</script>

<template>
  <VlPanel
    title="文章大纲与信息"
    :badge="headings.length ? `${Math.round(readingProgress)}%` : 'OUTLINE'"
    header-border
    padded
  >
    <div class="right-outline-stack">
      <!-- Outline TOC -->
      <section class="outline-block">
        <div class="sec-head">
          <span class="sec-title">本页大纲</span>
          <VlBadge v-if="headings.length" tone="primary" size="xs">
            {{ headings.length }} 节
          </VlBadge>
        </div>

        <div v-if="headings.length" class="toc-list">
          <button
            v-for="h in headings"
            :key="h.id"
            type="button"
            class="toc-item shape-rect"
            :class="{
              active: activeHeadingId === h.id,
              'lvl-3': h.level >= 3,
            }"
            @click="emit('jump-heading', h.id)"
          >
            <span class="toc-dot shape-circle" />
            <span class="toc-text">{{ h.title }}</span>
          </button>
        </div>

        <VlEmptyState
          v-else
          compact
          title="无多级标题"
          description="进入文章页后，本页二级与三级标题大纲将自动显示在此。"
        />
      </section>

      <!-- Post Meta Card -->
      <VlCard
        v-if="currentPost"
        title="文档元信息"
        accent-side="left"
        accent-tone="secondary"
        surface="elevated"
        padding="sm"
      >
        <div class="meta-rows">
          <div class="meta-row">
            <span>发布日期</span>
            <strong>{{ currentPost.dateText ?? currentPost.date }}</strong>
          </div>
          <div v-if="currentPost.category" class="meta-row">
            <span>所属分类</span>
            <strong>{{ currentPost.category }}</strong>
          </div>
          <div v-if="currentPost.wordCount" class="meta-row">
            <span>正文字数</span>
            <strong>{{ currentPost.wordCount.toLocaleString() }} 字</strong>
          </div>
        </div>

        <div v-if="currentPost.tags?.length" class="meta-tags">
          <VlTag
            v-for="tag in currentPost.tags"
            :key="tag"
            clickable
            size="sm"
            tone="secondary"
            @click="jumpTag(tag)"
          >
            # {{ tag }}
          </VlTag>
        </div>
      </VlCard>

      <!-- Author Card -->
      <VlCard
        v-if="themeCfg.author"
        surface="elevated"
        padding="sm"
      >
        <div class="author-box">
          <VlAvatar :name="themeCfg.author.name" :src="themeCfg.author.avatar" size="md" />
          <div class="author-text">
            <strong>{{ themeCfg.author.name }}</strong>
            <small v-if="themeCfg.author.role">{{ themeCfg.author.role }}</small>
          </div>
        </div>
        <p v-if="themeCfg.author.bio" class="author-bio">{{ themeCfg.author.bio }}</p>
      </VlCard>

      <slot name="right-panel-after" />
    </div>
  </VlPanel>
</template>

<style scoped>
.right-outline-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.outline-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sec-title {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
  text-align: left;
  border-left: 3px solid transparent;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.toc-item.lvl-3 {
  padding-left: 18px;
  font-size: var(--ui-font-sm);
}

.toc-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.toc-item.active {
  background-color: var(--accent-primary-soft);
  color: var(--text-primary);
  font-weight: 700;
  border-left-color: var(--accent-primary);
}

.toc-dot {
  width: 5px;
  height: 5px;
  background-color: var(--accent-secondary);
  flex-shrink: 0;
}

.toc-item.active .toc-dot {
  background-color: var(--accent-primary);
}

.toc-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
}

.meta-row strong {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.author-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-text {
  display: flex;
  flex-direction: column;
}

.author-text strong {
  font-size: var(--ui-font-md);
  color: var(--text-primary);
}

.author-text small {
  font-size: var(--ui-font-xs);
  color: var(--accent-secondary-text);
}

.author-bio {
  margin: 8px 0 0 0;
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.55;
}
</style>
