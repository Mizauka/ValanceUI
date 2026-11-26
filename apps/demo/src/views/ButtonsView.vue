<script setup lang="ts">
import { ref } from 'vue'
import {
  VlBadge,
  VlButton,
  VlCard,
  VlIconButton,
  VlSegmentedControl,
  VlStepper,
  VlTag,
  useToast,
  type SegmentOption,
} from '@valance-ui/vue'

const toast = useToast()
const activeIconBtn = ref(true)
const stepperSize = ref(18)
const stepperRatio = ref(1.95)
const segSlide = ref<'tree' | 'tiles' | 'list'>('tree')
const segMorph = ref<'system' | 'light' | 'dark'>('light')
const tags = ref(['Vue 3', 'Flat Geometric', 'No Shadow', 'Dock-to-Sheet', 'Push Drawer'])

const slideOpts: SegmentOption<'tree' | 'tiles' | 'list'>[] = [
  { value: 'tree', label: '树状目录', icon: 'tree' },
  { value: 'tiles', label: '平铺图标', icon: 'tiles' },
  { value: 'list', label: '紧凑列表', icon: 'list' },
]

const morphOpts: SegmentOption<'system' | 'light' | 'dark'>[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '亮色模式' },
  { value: 'dark', label: '暗色模式' },
]

function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag)
}
</script>

<template>
  <div class="demo-view">
    <VlCard title="按钮矩阵（VlButton）" subtitle="默认 morph 形态：静态纯方 (0px) -> 悬停/按下非线性变形为纯胶囊" accent-side="left" accent-tone="primary">
      <div class="btn-matrix">
        <div class="btn-row">
          <span class="row-tag">变体 Variants</span>
          <VlButton variant="primary" icon="plus" @click="toast.info('点击了 Primary')">主按钮 Primary</VlButton>
          <VlButton variant="secondary" icon="sparkles" @click="toast.success('点击了 Secondary')">次按钮 Secondary</VlButton>
          <VlButton variant="neutral">中性 Neutral</VlButton>
          <VlButton variant="outline">描边 Outline</VlButton>
          <VlButton variant="ghost">幽灵 Ghost</VlButton>
          <VlButton variant="danger" icon="trash" @click="toast.error('触发危险操作')">危险 Danger</VlButton>
        </div>

        <div class="btn-row">
          <span class="row-tag">形态 Shapes</span>
          <VlButton variant="primary" shape="morph">悬停变形 Morph</VlButton>
          <VlButton variant="primary" shape="rect">锁定直角 Rect</VlButton>
          <VlButton variant="primary" shape="pill">锁定胶囊 Pill</VlButton>
          <VlButton variant="secondary" shape="circle" icon="plus" title="正圆按钮" />
        </div>

        <div class="btn-row">
          <span class="row-tag">尺寸 & 状态</span>
          <VlButton variant="primary" size="xs">XS</VlButton>
          <VlButton variant="primary" size="sm">SM</VlButton>
          <VlButton variant="primary" size="md">MD</VlButton>
          <VlButton variant="primary" size="lg">LG 大按钮</VlButton>
          <VlButton variant="secondary" loading>加载中</VlButton>
          <VlButton variant="neutral" disabled>禁用态</VlButton>
        </div>
      </div>
    </VlCard>

    <div class="two-col">
      <VlCard title="方圆变形图标按钮（VlIconButton）" accent-side="left" accent-tone="secondary">
        <div class="btn-row">
          <VlIconButton
            icon="panel-left"
            tone="primary"
            :active="activeIconBtn"
            title="点击切换激活态"
            @click="activeIconBtn = !activeIconBtn"
          />
          <VlIconButton icon="panel-right" tone="secondary" active title="次色调激活态" />
          <VlIconButton icon="trash" tone="danger" morph-on-hover title="悬停变红圆" />
          <VlIconButton icon="settings" tone="primary" morph-on-hover title="悬停变橘圆" />
          <VlIconButton icon="sun" tone="neutral" size="lg" morph-on-hover title="大尺寸" />
          <VlIconButton icon="close" tone="danger" size="xs" morph-on-hover title="超小" />
        </div>
      </VlCard>

      <VlCard title="数值步进器（VlStepper）" accent-side="left" accent-tone="primary">
        <div class="steppers-stack">
          <VlStepper
            v-model="stepperSize"
            :min="14"
            :max="26"
            :step="1"
            :precision="0"
            label="正文字号"
            :hint="`${stepperSize} px`"
            decrement-label="A-"
            increment-label="A+"
          />
          <VlStepper
            v-model="stepperRatio"
            :min="1.5"
            :max="2.4"
            :step="0.1"
            :precision="2"
            label="正文行距"
            show-value
            unit="x"
          />
        </div>
      </VlCard>
    </div>

    <VlCard title="分段控制器（VlSegmentedControl）：滑动指示条 vs 方胶变形网格" accent-side="top" accent-tone="secondary">
      <div class="seg-demos">
        <div class="seg-block">
          <span class="row-tag">Sliding 滑动胶囊指示条（自动测宽 + 平滑位移动画）</span>
          <VlSegmentedControl v-model="segSlide" :options="slideOpts" surface="activity" />
        </div>
        <div class="seg-block">
          <span class="row-tag">Morph-Grid 方胶网格（选中项变为胶囊形）</span>
          <VlSegmentedControl
            v-model="segMorph"
            :options="morphOpts"
            variant="morph-grid"
            :columns="3"
          />
        </div>
      </div>
    </VlCard>

    <VlCard title="徽章（VlBadge）与交互标签（VlTag）" surface="surface">
      <div class="btn-row">
        <VlBadge tone="primary" variant="solid">SOLID PRIMARY</VlBadge>
        <VlBadge tone="secondary" variant="solid">SOLID SECONDARY</VlBadge>
        <VlBadge tone="primary" dot>进行中</VlBadge>
        <VlBadge tone="success" dot>已校验</VlBadge>
        <VlBadge tone="warning" dot>待处理</VlBadge>
        <VlBadge tone="danger" dot>异常</VlBadge>
        <VlBadge tone="info" dot>提示</VlBadge>
      </div>

      <div class="btn-row" style="margin-top: 12px">
        <VlTag
          v-for="t in tags"
          :key="t"
          clickable
          closable
          tone="secondary"
          @close="removeTag(t)"
        >
          # {{ t }}
        </VlTag>
        <VlButton v-if="tags.length < 5" size="xs" variant="ghost" icon="refresh" @click="tags = ['Vue 3', 'Flat Geometric', 'No Shadow', 'Dock-to-Sheet', 'Push Drawer']">
          恢复标签
        </VlButton>
      </div>
    </VlCard>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.btn-matrix {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.row-tag {
  font-size: var(--ui-font-xs);
  font-weight: 800;
  color: var(--text-muted);
  min-width: 96px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.steppers-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seg-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.seg-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
