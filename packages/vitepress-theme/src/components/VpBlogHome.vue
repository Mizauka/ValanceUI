<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  VlAvatar,
  VlBadge,
  VlButton,
  VlCard,
  VlEmptyState,
  VlIcon,
  VlInput,
  VlSegmentedControl,
  VlStatTile,
  VlTag,
  type SegmentOption,
} from '@valance-ui/vue'
import { useBlogState, normalizeBlogPath } from '../composables/useBlogState'

const {
  site,
  themeCfg,
  posts,
  allCategories,
  allTags,
  selectedTag,
  selectedCategory,
  openPath,
} = useBlogState()

const filterQuery = ref('')
const viewMode = ref<'list' | 'grid'>('list')

const viewOptions: SegmentOption<'list' | 'grid'>[] = [
  { value: 'list', label: '列表', icon: 'list' },
  { value: 'grid', label: '卡片', icon: 'grid' },
]

const totalWords = computed(() =>
  posts.value.reduce((acc, p) => acc + (p.wordCount ?? 0), 0),
)

const totalMinutes = computed(() =>
  posts.value.reduce((acc, p) => acc + (p.readingMinutes ?? 3), 0),
)

const featuredPost = computed(
  () => posts.value.find((p) => p.featured) ?? posts.value[0] ?? null,
)

const filteredPosts = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  return posts.value.filter((p) => {
    if (selectedCategory.value && (p.category || '随笔') !== selectedCategory.value) {
      return false
    }
    if (selectedTag.value && !(p.tags ?? []).includes(selectedTag.value)) {
      return false
    }
    if (!q) return true
    const hay = `${p.title} ${p.excerpt ?? ''} ${p.category ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase()
    return hay.includes(q)
  })
})

function toggleCategory(cat: string) {
  selectedCategory.value = selectedCategory.value === cat ? null : cat
}

function toggleTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? null : tag
}

function clearFilters() {
  filterQuery.value = ''
  selectedCategory.value = null
  selectedTag.value = null
}
</script>

<template>
  <div class="vp-blog-home">
    <!-- Hero Block (Flat Geometric) -->
    <section class="blog-hero shape-rect">
      <span class="hero-accent shape-rect" aria-hidden="true" />
      <div class="hero-main">
        <div class="hero-badges">
          <VlBadge tone="primary" variant="solid" size="sm">
            {{ themeCfg.brandTag ?? 'BLOG WORKBENCH' }}
          </VlBadge>
          <VlBadge tone="secondary" size="sm">
            {{ posts.length }} 篇文章
          </VlBadge>
        </div>

        <h1 class="hero-title">
          {{ themeCfg.heroTitle ?? themeCfg.brandTitle ?? site.title }}
        </h1>
        <p class="hero-subtitle">
          {{ themeCfg.heroSubtitle ?? themeCfg.description ?? site.description }}
        </p>

        <div class="hero-actions">
          <VlButton
            v-if="featuredPost"
            variant="primary"
            icon-right="arrow-right"
            @click="openPath(featuredPost.url)"
          >
            开始阅读最新文章
          </VlButton>
          <VlButton
            variant="secondary"
            icon="archive"
            @click="openPath('/archive')"
          >
            时间线归档
          </VlButton>
          <VlButton
            variant="outline"
            icon="user"
            @click="openPath('/about')"
          >
            关于作者
          </VlButton>
        </div>
      </div>

      <div v-if="themeCfg.author" class="hero-author shape-rect">
        <VlAvatar :name="themeCfg.author.name" :src="themeCfg.author.avatar" size="lg" status="online" />
        <div class="author-meta">
          <strong class="author-name">{{ themeCfg.author.name }}</strong>
          <span v-if="themeCfg.author.role" class="author-role">{{ themeCfg.author.role }}</span>
          <p v-if="themeCfg.author.bio" class="author-bio">{{ themeCfg.author.bio }}</p>
        </div>
      </div>
    </section>

    <slot name="home-hero-after" />

    <!-- KPI Stats Strip -->
    <section class="blog-stats">
      <VlStatTile
        title="已发布文章"
        :value="posts.length"
        subtitle="持续更新的技术与设计笔记"
        badge="POSTS"
        tone="primary"
      />
      <VlStatTile
        title="分类目录"
        :value="allCategories.length"
        :subtitle="`${allTags.length} 个主题标签`"
        badge="TOPICS"
        tone="secondary"
      />
      <VlStatTile
        title="累计阅读字数"
        :value="totalWords > 0 ? totalWords.toLocaleString() : `${totalMinutes} min`"
        :subtitle="`预计累计阅读 ${totalMinutes} 分钟`"
        badge="INDEX"
        tone="primary"
      />
    </section>

    <!-- Featured Highlight -->
    <VlCard
      v-if="featuredPost && !filterQuery && !selectedTag && !selectedCategory"
      accent-side="left"
      accent-tone="secondary"
      surface="surface"
      interactive
      class="featured-card"
      @click="openPath(featuredPost.url)"
    >
      <template #header>
        <div class="featured-head">
          <div class="featured-badges">
            <VlBadge tone="secondary" variant="solid" size="xs">置顶精选</VlBadge>
            <VlBadge v-if="featuredPost.category" tone="primary" size="xs">
              {{ featuredPost.category }}
            </VlBadge>
          </div>
          <span class="post-date">{{ featuredPost.dateText ?? featuredPost.date }}</span>
        </div>
      </template>

      <h2 class="featured-title">{{ featuredPost.title }}</h2>
      <p v-if="featuredPost.excerpt" class="featured-excerpt">{{ featuredPost.excerpt }}</p>

      <template #footer>
        <div class="post-footer-row">
          <div class="post-tags">
            <VlTag
              v-for="tag in featuredPost.tags ?? []"
              :key="tag"
              size="sm"
              tone="secondary"
              @click.stop="toggleTag(tag)"
            >
              # {{ tag }}
            </VlTag>
          </div>
          <span class="read-more">
            <span>阅读全文</span>
            <VlIcon name="arrow-right" :size="13" />
          </span>
        </div>
      </template>
    </VlCard>

    <!-- Filter & Search Bar -->
    <section class="filter-bar shape-rect">
      <div class="filter-top">
        <VlInput
          v-model="filterQuery"
          shape="pill"
          prefix-icon="search"
          clearable
          placeholder="筛选文章标题、标签或摘要…"
          class="filter-input"
        />
        <VlSegmentedControl
          v-model="viewMode"
          :options="viewOptions"
          size="md"
          surface="activity"
          aria-label="文章展示视图"
        />
      </div>

      <div v-if="allCategories.length || allTags.length" class="filter-chips">
        <VlTag
          v-for="cat in allCategories"
          :key="`cat-${cat.name}`"
          clickable
          :active="selectedCategory === cat.name"
          tone="primary"
          size="sm"
          icon="folder"
          @click="toggleCategory(cat.name)"
        >
          {{ cat.name }} ({{ cat.count }})
        </VlTag>

        <VlTag
          v-for="tag in allTags.slice(0, 10)"
          :key="`tag-${tag.name}`"
          clickable
          :active="selectedTag === tag.name"
          tone="secondary"
          size="sm"
          @click="toggleTag(tag.name)"
        >
          # {{ tag.name }}
        </VlTag>

        <VlButton
          v-if="filterQuery || selectedCategory || selectedTag"
          variant="ghost"
          size="xs"
          icon="close"
          @click="clearFilters"
        >
          清除筛选
        </VlButton>
      </div>
    </section>

    <!-- Post Feed -->
    <VlEmptyState
      v-if="filteredPosts.length === 0"
      title="未找到匹配的文章"
      description="尝试调整关键词或清除当前的分类与标签筛选。"
      cta-label="重置筛选条件"
      @action="clearFilters"
    />

    <div v-else class="posts-feed" :class="`mode-${viewMode}`">
      <article
        v-for="post in filteredPosts"
        :key="normalizeBlogPath(post.url)"
        class="post-card shape-rect"
        @click="openPath(post.url)"
      >
        <span class="post-bar shape-rect" aria-hidden="true" />

        <div class="post-meta-top">
          <div class="post-meta-left">
            <VlBadge v-if="post.category" tone="primary" size="xs">{{ post.category }}</VlBadge>
            <span class="post-date">{{ post.dateText ?? post.date }}</span>
          </div>
          <span v-if="post.readingMinutes" class="post-time">
            约 {{ post.readingMinutes }} 分钟
          </span>
        </div>

        <h3 class="post-title">{{ post.title }}</h3>
        <p v-if="post.excerpt" class="post-excerpt">{{ post.excerpt }}</p>

        <div class="post-footer-row">
          <div class="post-tags">
            <VlTag
              v-for="tag in post.tags ?? []"
              :key="tag"
              size="sm"
              clickable
              :active="selectedTag === tag"
              @click.stop="toggleTag(tag)"
            >
              # {{ tag }}
            </VlTag>
          </div>
          <span class="read-more">
            <span>阅读</span>
            <VlIcon name="arrow-right" :size="12" />
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.vp-blog-home {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.blog-hero {
  position: relative;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 18px;
  padding: 22px 24px 22px 28px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.hero-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background-color: var(--accent-primary);
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.hero-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-title {
  margin: 0;
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
}

.hero-subtitle {
  margin: 0;
  font-size: var(--ui-font-base);
  color: var(--text-secondary);
  line-height: 1.65;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.hero-author {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
}

.author-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.author-name {
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
}

.author-role {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--accent-secondary-text);
}

.author-bio {
  margin: 4px 0 0 0;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  line-height: 1.55;
}

.blog-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.featured-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.featured-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.featured-title {
  margin: 8px 0 6px 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
}

.featured-excerpt {
  margin: 0;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
  line-height: 1.65;
}

.filter-bar {
  padding: 12px 14px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-input {
  flex: 1;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.posts-feed.mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.posts-feed.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.post-card {
  position: relative;
  padding: 15px 16px 15px 20px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition:
    background-color 0.18s var(--ease-nonlinear),
    border-color 0.18s var(--ease-nonlinear);
}

.post-card:hover {
  background-color: var(--bg-elevated);
  border-color: var(--accent-primary);
}

.post-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--divider-strong);
  transition: background-color 0.18s var(--ease-nonlinear);
}

.post-card:hover .post-bar {
  background-color: var(--accent-primary);
}

.post-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.post-meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-date,
.post-time {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.post-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.35;
}

.post-excerpt {
  margin: 0;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
}

.post-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--accent-primary-text);
  white-space: nowrap;
}

@media (max-width: 820px) {
  .blog-hero {
    grid-template-columns: 1fr;
    padding: 16px 16px 16px 20px;
  }

  .blog-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .blog-stats > :last-child {
    grid-column: span 2;
  }

  .filter-top {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
