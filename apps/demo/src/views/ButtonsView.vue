<script setup lang="ts">
import { computed, ref } from 'vue'
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
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()
const toast = useToast()
const activeIconBtn = ref(true)
const stepperSize = ref(18)
const stepperRatio = ref(1.95)
const segSlide = ref<'tree' | 'tiles' | 'list'>('tree')
const segMorph = ref<'system' | 'light' | 'dark'>('light')
const tags = ref(['Vue 3', 'Flat Geometric', 'No Shadow', 'Dock-to-Sheet', 'Push Drawer'])

const slideOpts = computed<SegmentOption<'tree' | 'tiles' | 'list'>[]>(() => [
  { value: 'tree', label: t.value.buttons.slideOpts.tree, icon: 'tree' },
  { value: 'tiles', label: t.value.buttons.slideOpts.tiles, icon: 'tiles' },
  { value: 'list', label: t.value.buttons.slideOpts.list, icon: 'list' },
])

const morphOpts = computed<SegmentOption<'system' | 'light' | 'dark'>[]>(() => [
  { value: 'system', label: t.value.buttons.morphOpts.system },
  { value: 'light', label: t.value.buttons.morphOpts.light },
  { value: 'dark', label: t.value.buttons.morphOpts.dark },
])

function removeTag(tag: string) {
  tags.value = tags.value.filter((item) => item !== tag)
}
</script>

<template>
  <div class="demo-view">
    <VlCard :title="t.buttons.matrixTitle" :subtitle="t.buttons.matrixSubtitle" accent-side="left" accent-tone="primary">
      <div class="btn-matrix">
        <div class="btn-row">
          <span class="row-tag">{{ t.buttons.variantsTag }}</span>
          <VlButton variant="primary" icon="plus" @click="toast.info(t.buttons.primaryToast)">{{ t.buttons.primary }}</VlButton>
          <VlButton variant="secondary" icon="sparkles" @click="toast.success(t.buttons.secondaryToast)">{{ t.buttons.secondary }}</VlButton>
          <VlButton variant="neutral">{{ t.buttons.neutral }}</VlButton>
          <VlButton variant="outline">{{ t.buttons.outline }}</VlButton>
          <VlButton variant="ghost">{{ t.buttons.ghost }}</VlButton>
          <VlButton variant="danger" icon="trash" @click="toast.error(t.buttons.dangerToast)">{{ t.buttons.danger }}</VlButton>
        </div>

        <div class="btn-row">
          <span class="row-tag">{{ t.buttons.shapesTag }}</span>
          <VlButton variant="primary" shape="morph">{{ t.buttons.morphBtn }}</VlButton>
          <VlButton variant="primary" shape="rect">{{ t.buttons.rectBtn }}</VlButton>
          <VlButton variant="primary" shape="pill">{{ t.buttons.pillBtn }}</VlButton>
          <VlButton variant="secondary" shape="circle" icon="plus" :title="t.buttons.circleBtnTitle" />
        </div>

        <div class="btn-row">
          <span class="row-tag">{{ t.buttons.sizeStateTag }}</span>
          <VlButton variant="primary" size="xs">XS</VlButton>
          <VlButton variant="primary" size="sm">SM</VlButton>
          <VlButton variant="primary" size="md">MD</VlButton>
          <VlButton variant="primary" size="lg">{{ t.buttons.lgBtn }}</VlButton>
          <VlButton variant="secondary" loading>{{ t.buttons.loadingBtn }}</VlButton>
          <VlButton variant="neutral" disabled>{{ t.buttons.disabledBtn }}</VlButton>
        </div>
      </div>
    </VlCard>

    <div class="two-col">
      <VlCard :title="t.buttons.iconBtnCardTitle" accent-side="left" accent-tone="secondary">
        <div class="btn-row">
          <VlIconButton
            icon="panel-left"
            tone="primary"
            :active="activeIconBtn"
            :title="t.buttons.iconBtnToggleTitle"
            @click="activeIconBtn = !activeIconBtn"
          />
          <VlIconButton icon="panel-right" tone="secondary" active :title="t.buttons.iconBtnSecondaryTitle" />
          <VlIconButton icon="trash" tone="danger" morph-on-hover :title="t.buttons.iconBtnDangerTitle" />
          <VlIconButton icon="settings" tone="primary" morph-on-hover :title="t.buttons.iconBtnPrimaryTitle" />
          <VlIconButton icon="sun" tone="neutral" size="lg" morph-on-hover :title="t.buttons.iconBtnLargeTitle" />
          <VlIconButton icon="close" tone="danger" size="xs" morph-on-hover :title="t.buttons.iconBtnXsTitle" />
        </div>
      </VlCard>

      <VlCard :title="t.buttons.stepperCardTitle" accent-side="left" accent-tone="primary">
        <div class="steppers-stack">
          <VlStepper
            v-model="stepperSize"
            :min="14"
            :max="26"
            :step="1"
            :precision="0"
            :label="t.buttons.fontSizeLabel"
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
            :label="t.buttons.lineHeightLabel"
            show-value
            unit="x"
          />
        </div>
      </VlCard>
    </div>

    <VlCard :title="t.buttons.segmentedCardTitle" accent-side="top" accent-tone="secondary">
      <div class="seg-demos">
        <div class="seg-block">
          <span class="row-tag">{{ t.buttons.slidingTag }}</span>
          <VlSegmentedControl v-model="segSlide" :options="slideOpts" surface="activity" />
        </div>
        <div class="seg-block">
          <span class="row-tag">{{ t.buttons.morphGridTag }}</span>
          <VlSegmentedControl
            v-model="segMorph"
            :options="morphOpts"
            variant="morph-grid"
            :columns="3"
          />
        </div>
      </div>
    </VlCard>

    <VlCard :title="t.buttons.badgeTagCardTitle" surface="surface">
      <div class="btn-row">
        <VlBadge tone="primary" variant="solid">SOLID PRIMARY</VlBadge>
        <VlBadge tone="secondary" variant="solid">SOLID SECONDARY</VlBadge>
        <VlBadge tone="primary" dot>{{ t.buttons.badges.inProgress }}</VlBadge>
        <VlBadge tone="success" dot>{{ t.buttons.badges.verified }}</VlBadge>
        <VlBadge tone="warning" dot>{{ t.buttons.badges.pending }}</VlBadge>
        <VlBadge tone="danger" dot>{{ t.buttons.badges.error }}</VlBadge>
        <VlBadge tone="info" dot>{{ t.buttons.badges.info }}</VlBadge>
      </div>

      <div class="btn-row" style="margin-top: 12px">
        <VlTag
          v-for="tagItem in tags"
          :key="tagItem"
          clickable
          closable
          tone="secondary"
          @close="removeTag(tagItem)"
        >
          # {{ tagItem }}
        </VlTag>
        <VlButton v-if="tags.length < 5" size="xs" variant="ghost" icon="refresh" @click="tags = ['Vue 3', 'Flat Geometric', 'No Shadow', 'Dock-to-Sheet', 'Push Drawer']">
          {{ t.buttons.restoreTags }}
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
