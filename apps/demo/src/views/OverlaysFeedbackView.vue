<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VlAlert,
  VlButton,
  VlCard,
  VlDialog,
  VlDropdown,
  VlEmptyState,
  VlInput,
  VlProgress,
  VlSheet,
  VlSkeleton,
  VlSlider,
  VlTooltip,
  VlPopover,
  VlPopconfirm,
  VlContextMenu,
  VlCommandPalette,
  useToast,
  type CommandPaletteItem,
  type DropdownItem,
} from '@valance-ui/vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()
const toast = useToast()

const bottomSheetOpen = ref(false)
const sideSheetOpen = ref(false)
const dialogOpen = ref(false)
const dangerDialogOpen = ref(false)
const paletteOpen = ref(false)
const paletteItems = computed<CommandPaletteItem[]>(() => [
  { id: 'overview', label: t.value.overlays.paletteItems.overview.label, excerpt: t.value.overlays.paletteItems.overview.excerpt, group: t.value.overlays.paletteItems.overview.group, badge: 'SPEC' },
  { id: 'shapes', label: t.value.overlays.paletteItems.shapes.label, excerpt: t.value.overlays.paletteItems.shapes.excerpt, group: t.value.overlays.paletteItems.shapes.group, badge: '35' },
  { id: 'forms', label: t.value.overlays.paletteItems.forms.label, excerpt: t.value.overlays.paletteItems.forms.excerpt, group: t.value.overlays.paletteItems.forms.group, shortcut: 'G F' },
  { id: 'data', label: t.value.overlays.paletteItems.data.label, excerpt: t.value.overlays.paletteItems.data.excerpt, group: t.value.overlays.paletteItems.data.group, badge: 'CHART' },
])
const progressVal = ref(68)
const noteInput = ref('')

const menuItems = computed<DropdownItem[]>(() => [
  { id: 'edit', label: t.value.overlays.menuItems.edit, icon: 'edit', shortcut: 'E' },
  { id: 'copy', label: t.value.overlays.menuItems.copy, icon: 'copy', shortcut: '⌘C' },
  { id: 'share', label: t.value.overlays.menuItems.share, icon: 'share' },
  { id: 'div', label: '', divider: true },
  { id: 'delete', label: t.value.overlays.menuItems.delete, icon: 'trash', danger: true },
])

function onDropdownSelect(item: DropdownItem) {
  if (item.danger) toast.error(t.value.overlays.toasts.dangerMenu(item.label))
  else toast.success(t.value.overlays.toasts.menuAction(item.label))
}
</script>

<template>
  <div class="demo-view">
    <div class="two-col">
      <!-- Sheets & Dialogs -->
      <VlCard :title="t.overlays.sheetDialogCardTitle" :subtitle="t.overlays.sheetDialogCardSubtitle" accent-side="left" accent-tone="primary">
        <div class="btn-wrap">
          <VlButton variant="primary" icon="arrow-up" @click="bottomSheetOpen = true">
            {{ t.overlays.openBottomSheet }}
          </VlButton>
          <VlButton variant="secondary" icon="panel-right" @click="sideSheetOpen = true">
            {{ t.overlays.openRightSheet }}
          </VlButton>
          <VlButton variant="outline" icon="layers" @click="dialogOpen = true">
            {{ t.overlays.openStdDialog }}
          </VlButton>
          <VlButton variant="danger" icon="trash" @click="dangerDialogOpen = true">
            {{ t.overlays.openDangerDialog }}
          </VlButton>
        </div>
      </VlCard>

      <!-- Toast, Tooltip, Dropdown -->
      <VlCard :title="t.overlays.toastCardTitle" accent-side="left" accent-tone="secondary">
        <div class="btn-wrap">
          <VlButton variant="primary" size="sm" @click="toast.info(t.overlays.toasts.toastInfo)">{{ t.overlays.toastInfoBtn }}</VlButton>
          <VlButton variant="secondary" size="sm" @click="toast.success(t.overlays.toasts.toastSuccess)">{{ t.overlays.toastSuccessBtn }}</VlButton>
          <VlButton variant="neutral" size="sm" @click="toast.warning(t.overlays.toasts.toastWarning)">{{ t.overlays.toastWarningBtn }}</VlButton>
          <VlButton variant="danger" size="sm" @click="toast.error(t.overlays.toasts.toastError)">{{ t.overlays.toastErrorBtn }}</VlButton>
        </div>

        <div class="btn-wrap" style="margin-top: 12px">
          <VlTooltip :text="t.overlays.topTooltipText" placement="top">
            <VlButton size="sm" variant="outline">Top Tooltip</VlButton>
          </VlTooltip>
          <VlTooltip :text="t.overlays.bottomTooltipText" placement="bottom" shape="rect">
            <VlButton size="sm" variant="outline">Bottom Rect</VlButton>
          </VlTooltip>
          <VlTooltip :text="t.overlays.rightTooltipText" placement="right">
            <VlButton size="sm" variant="outline">Right Tooltip</VlButton>
          </VlTooltip>

          <VlDropdown :items="menuItems" @select="onDropdownSelect">
            <template #trigger>
              <VlButton size="sm" variant="primary" icon="more-horizontal">{{ t.overlays.dropdownBtn }}</VlButton>
            </template>
          </VlDropdown>
        </div>
      </VlCard>
    </div>

    <!-- Alerts -->
    <VlCard :title="t.overlays.alertCardTitle" surface="surface">
      <div class="alert-stack">
        <VlAlert tone="info" :title="t.overlays.alerts.infoTitle">{{ t.overlays.alerts.infoBody }}</VlAlert>
        <VlAlert tone="tip" :title="t.overlays.alerts.tipTitle">{{ t.overlays.alerts.tipBody }}</VlAlert>
        <VlAlert tone="warning" :title="t.overlays.alerts.warningTitle">{{ t.overlays.alerts.warningBody }}</VlAlert>
        <VlAlert tone="danger" :title="t.overlays.alerts.dangerTitle">{{ t.overlays.alerts.dangerBody }}</VlAlert>
      </div>
    </VlCard>

    <!-- Progress, Skeleton, EmptyState -->
    <div class="two-col">
      <VlCard :title="t.overlays.progressCardTitle" accent-side="top" accent-tone="primary">
        <div class="prog-stack">
          <VlSlider v-model="progressVal" :min="0" :max="100" :label="t.overlays.progressLabel" unit="%" />
          <VlProgress :value="progressVal" show-label :height="6" />
          <VlProgress :value="progressVal" tone="secondary" show-label :height="4" />
          <VlProgress indeterminate tone="primary" :height="3" />
          <div class="rings-row">
            <VlProgress variant="ring" :value="progressVal" show-label :ring-size="52" />
            <VlProgress variant="ring" :value="88" tone="secondary" show-label :ring-size="52" />
            <VlProgress variant="morph" indeterminate tone="primary" :ring-size="56" />
            <VlProgress variant="morph" :value="progressVal" tone="secondary" show-label :ring-size="56" />
          </div>

          <div class="skel-demo">
            <VlSkeleton shape="m3" m3-shape="clover-4" width="42px" height="42px" />
            <div style="flex: 1">
              <VlSkeleton :lines="3" height="12px" />
            </div>
          </div>
        </div>
      </VlCard>

      <VlCard :title="t.overlays.emptyCardTitle" accent-side="top" accent-tone="secondary">
        <VlEmptyState
          compact
          shape="clover-4"
          :morph-shapes="['clover-4', 'cookie-7', 'flower', 'puffy']"
          :title="t.overlays.emptyTitle"
          :description="t.overlays.emptyDesc"
          :cta-label="t.overlays.emptyCta"
          cta-icon="arrow-right"
          @action="toast.success(t.overlays.toasts.emptyCta)"
        />
      </VlCard>
    </div>

    <!-- Portaled Overlays -->
    <VlCard
      :title="t.overlays.popoverCardTitle"
      :subtitle="t.overlays.popoverCardSubtitle"
      accent-side="left"
      accent-tone="primary"
    >
      <div class="btn-wrap">
        <VlPopover :title="t.overlays.popoverTitle" closable>
          <template #trigger>
            <VlButton variant="outline" size="sm" icon="info">{{ t.overlays.popoverTrigger }}</VlButton>
          </template>
          <p style="margin: 0">{{ t.overlays.popoverBody }}</p>
        </VlPopover>

        <VlPopconfirm
          :title="t.overlays.popconfirmTitle"
          :description="t.overlays.popconfirmDesc"
          tone="danger"
          @confirm="toast.error(t.overlays.toasts.popConfirm)"
          @cancel="toast.info(t.overlays.toasts.popCancel)"
        >
          <VlButton variant="danger" size="sm" icon="trash">{{ t.overlays.popconfirmTrigger }}</VlButton>
        </VlPopconfirm>

        <VlContextMenu :items="menuItems" @select="onDropdownSelect">
          <div class="ctx-area shape-rect">{{ t.overlays.contextArea }}</div>
        </VlContextMenu>

        <VlButton variant="primary" size="sm" icon="search" @click="paletteOpen = true">
          {{ t.overlays.openCommandBtn }}
        </VlButton>
      </div>
    </VlCard>

    <VlCommandPalette
      v-model:open="paletteOpen"
      :items="paletteItems"
      @select="(it) => toast.success(t.overlays.toasts.commandJump(it.label))"
    />

    <VlSheet v-model:open="bottomSheetOpen" :title="t.overlays.bottomSheetTitle">
      <div class="sheet-demo-body">
        <p>{{ t.overlays.bottomSheetDesc }}</p>
        <VlInput
          v-model="noteInput"
          :label="t.overlays.bottomSheetInputLabel"
          :placeholder="t.overlays.bottomSheetInputPlaceholder"
          clearable
        />
      </div>
      <template #footer>
        <VlButton variant="neutral" @click="bottomSheetOpen = false">{{ t.overlays.cancel }}</VlButton>
        <VlButton variant="primary" icon="check" @click="bottomSheetOpen = false; toast.success(t.overlays.toasts.sheetSaved)">
          {{ t.overlays.save }}
        </VlButton>
      </template>
    </VlSheet>

    <VlSheet v-model:open="sideSheetOpen" placement="right" accent-tone="secondary" :title="t.overlays.sideSheetTitle">
      <p style="margin: 0; font-size: var(--ui-font-md); color: var(--text-secondary); line-height: 1.7">
        {{ t.overlays.sideSheetDesc }}
      </p>
    </VlSheet>

    <VlDialog v-model:open="dialogOpen" :title="t.overlays.dialogTitle" :description="t.overlays.dialogDesc">
      {{ t.overlays.dialogBody }}
      <template #footer>
        <VlButton variant="neutral" @click="dialogOpen = false">{{ t.overlays.close }}</VlButton>
        <VlButton variant="primary" @click="dialogOpen = false; toast.info(t.overlays.toasts.dialogConfirmed)">
          {{ t.overlays.confirm }}
        </VlButton>
      </template>
    </VlDialog>

    <VlDialog v-model:open="dangerDialogOpen" tone="danger" :title="t.overlays.dangerDialogTitle" :description="t.overlays.dangerDialogDesc">
      {{ t.overlays.dangerDialogBody }}
      <template #footer>
        <VlButton variant="neutral" @click="dangerDialogOpen = false">{{ t.overlays.cancel }}</VlButton>
        <VlButton variant="danger" icon="trash" @click="dangerDialogOpen = false; toast.error(t.overlays.toasts.dangerConfirmed)">
          {{ t.overlays.confirmDelete }}
        </VlButton>
      </template>
    </VlDialog>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.btn-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alert-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prog-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rings-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.skel-demo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 6px;
}

.sheet-demo-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
}

.ctx-area {
  padding: 6px 12px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--bg-surface);
  border: 1px dashed var(--divider-strong);
  color: var(--text-secondary);
  cursor: context-menu;
  user-select: none;
}

.sheet-demo-body p {
  margin: 0;
}
</style>
