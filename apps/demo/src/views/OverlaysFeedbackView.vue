<script setup lang="ts">
import { ref } from 'vue'
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

const toast = useToast()

const bottomSheetOpen = ref(false)
const sideSheetOpen = ref(false)
const dialogOpen = ref(false)
const dangerDialogOpen = ref(false)
const paletteOpen = ref(false)
const paletteItems: CommandPaletteItem[] = [
  { id: 'overview', label: '设计规范总览', excerpt: '三大基础几何形态 + M3E 35 轮廓', group: 'Foundation', badge: 'SPEC' },
  { id: 'shapes', label: 'M3E 35 种几何图形', excerpt: 'Material 3 Expressive SVG 矢量系统', group: 'Foundation', badge: '35' },
  { id: 'forms', label: '自绘 Select / 日历 / 表盘时钟', excerpt: '100% 非原生自绘高定控件', group: 'Forms', shortcut: 'G F' },
  { id: 'data', label: '交互 SVG 图谱与时间线', excerpt: '支持 CI 置信带与缩放拖拽', group: 'Data', badge: 'CHART' },
]
const progressVal = ref(68)
const noteInput = ref('')

const menuItems: DropdownItem[] = [
  { id: 'edit', label: '编辑条目', icon: 'edit', shortcut: 'E' },
  { id: 'copy', label: '复制链接', icon: 'copy', shortcut: '⌘C' },
  { id: 'share', label: '分享配置', icon: 'share' },
  { id: 'div', label: '', divider: true },
  { id: 'delete', label: '删除项目', icon: 'trash', danger: true },
]

function onDropdownSelect(item: DropdownItem) {
  if (item.danger) toast.error(`已选择危险项：${item.label}`)
  else toast.success(`触发菜单操作：${item.label}`)
}
</script>

<template>
  <div class="demo-view">
    <div class="two-col">
      <!-- Sheets & Dialogs -->
      <VlCard title="Sheet 抽屉与模态弹窗（VlSheet / VlDialog）" subtitle="底部 Sheet 支持手柄下拉速度关闭；Dialog 支持标准与危险强调条" accent-side="left" accent-tone="primary">
        <div class="btn-wrap">
          <VlButton variant="primary" icon="arrow-up" @click="bottomSheetOpen = true">
            打开底部 Sheet（可下滑关闭）
          </VlButton>
          <VlButton variant="secondary" icon="panel-right" @click="sideSheetOpen = true">
            打开右侧 Side Sheet
          </VlButton>
          <VlButton variant="outline" icon="layers" @click="dialogOpen = true">
            打开标准 Dialog
          </VlButton>
          <VlButton variant="danger" icon="trash" @click="dangerDialogOpen = true">
            打开危险确认 Dialog
          </VlButton>
        </div>
      </VlCard>

      <!-- Toast, Tooltip, Dropdown -->
      <VlCard title="Toast 胶囊、Tooltip 与 Dropdown 菜单" accent-side="left" accent-tone="secondary">
        <div class="btn-wrap">
          <VlButton variant="primary" size="sm" @click="toast.info('信息：已保存草稿')">Toast Info</VlButton>
          <VlButton variant="secondary" size="sm" @click="toast.success('成功：校准完成')">Toast Success</VlButton>
          <VlButton variant="neutral" size="sm" @click="toast.warning('警告：请检查参数')">Toast Warning</VlButton>
          <VlButton variant="danger" size="sm" @click="toast.error('错误：格式无效')">Toast Error</VlButton>
        </div>

        <div class="btn-wrap" style="margin-top: 12px">
          <VlTooltip text="Top 胶囊提示" placement="top">
            <VlButton size="sm" variant="outline">Top Tooltip</VlButton>
          </VlTooltip>
          <VlTooltip text="Bottom 提示" placement="bottom" shape="rect">
            <VlButton size="sm" variant="outline">Bottom Rect</VlButton>
          </VlTooltip>
          <VlTooltip text="Right 提示" placement="right">
            <VlButton size="sm" variant="outline">Right Tooltip</VlButton>
          </VlTooltip>

          <VlDropdown :items="menuItems" @select="onDropdownSelect">
            <template #trigger>
              <VlButton size="sm" variant="primary" icon="more-horizontal">下拉菜单</VlButton>
            </template>
          </VlDropdown>
        </div>
      </VlCard>
    </div>

    <!-- Alerts -->
    <VlCard title="扁平警告横幅（VlAlert）" surface="surface">
      <div class="alert-stack">
        <VlAlert tone="info" title="信息提示 Info">使用 4px 左侧彩色条与浅色调底色呈现层级，绝不使用阴影。</VlAlert>
        <VlAlert tone="tip" title="最佳实践 Tip">移动端与桌面端共用同一套设计 Token，仅通过媒体查询调整流体尺度。</VlAlert>
        <VlAlert tone="warning" title="注意事项 Warning">建议先导出 JSON 备份再执行批量删除操作。</VlAlert>
        <VlAlert tone="danger" title="危险操作 Danger">此操作将清空历史记录且不可逆。</VlAlert>
      </div>
    </VlCard>

    <!-- Progress, Skeleton, EmptyState -->
    <div class="two-col">
      <VlCard title="进度条与进度环（VlProgress） & 骨架屏（VlSkeleton）" accent-side="top" accent-tone="primary">
        <div class="prog-stack">
          <VlSlider v-model="progressVal" :min="0" :max="100" label="调节演示进度" unit="%" />
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

      <VlCard title="空状态 M3E 形变占位符（VlEmptyState）" accent-side="top" accent-tone="secondary">
        <VlEmptyState
          compact
          shape="clover-4"
          :morph-shapes="['clover-4', 'cookie-7', 'flower', 'puffy']"
          title="尚未选中任何实验样本"
          description="支持 M3E 几何形态循环呼吸变形与丝滑胶囊触发按钮。"
          cta-label="立即创建示例"
          cta-icon="arrow-right"
          @action="toast.success('触发 EmptyState CTA 回调')"
        />
      </VlCard>
    </div>

    <!-- Portaled Overlays -->
    <VlCard
      title="气泡浮层、微确认、右键菜单与全局命令面板"
      subtitle="提炼自 CatsOnPlains 正则搜索与成熟 UX 浮层家族（支持 Ctrl+K 呼出全文正则搜索面板）"
      accent-side="left"
      accent-tone="primary"
    >
      <div class="btn-wrap">
        <VlPopover title="扁平信息气泡（VlPopover）" closable>
          <template #trigger>
            <VlButton variant="outline" size="sm" icon="info">打开 Popover</VlButton>
          </template>
          <p style="margin: 0">零阴影直角悬浮气泡，支持 <code>click / hover</code> 与自动闭合。</p>
        </VlPopover>

        <VlPopconfirm
          title="确认重置实验记录？"
          description="将清除当前会话所有未归档的参数草稿。"
          tone="danger"
          @confirm="toast.error('已确认重置')"
          @cancel="toast.info('已取消操作')"
        >
          <VlButton variant="danger" size="sm" icon="trash">危险 Popconfirm</VlButton>
        </VlPopconfirm>

        <VlContextMenu :items="menuItems" @select="onDropdownSelect">
          <div class="ctx-area shape-rect">在此区域点击鼠标右键（ContextMenu）</div>
        </VlContextMenu>

        <VlButton variant="primary" size="sm" icon="search" @click="paletteOpen = true">
          打开命令搜索面板（Ctrl+K）
        </VlButton>
      </div>
    </VlCard>

    <VlCommandPalette
      v-model:open="paletteOpen"
      :items="paletteItems"
      @select="(it) => toast.success(`命令跳转：${it.label}`)"
    />

    <VlSheet v-model:open="bottomSheetOpen" title="移动端底部 Sheet 抽屉">
      <div class="sheet-demo-body">
        <p>向下拖拽顶部手柄或点击右上角关闭按钮即可收起此抽屉。</p>
        <VlInput v-model="noteInput" label="快捷输入示例" placeholder="输入内容试试…" clearable />
      </div>
      <template #footer>
        <VlButton variant="neutral" @click="bottomSheetOpen = false">取消</VlButton>
        <VlButton variant="primary" icon="check" @click="bottomSheetOpen = false; toast.success('Sheet 已保存')">保存</VlButton>
      </template>
    </VlSheet>

    <VlSheet v-model:open="sideSheetOpen" placement="right" accent-tone="secondary" title="右侧滑入 Sheet">
      <p style="margin: 0; font-size: var(--ui-font-md); color: var(--text-secondary); line-height: 1.7">
        <code>VlSheet</code> 同时支持 <code>bottom</code>、<code>left</code> 与 <code>right</code> 三个方向滑入。
      </p>
    </VlSheet>

    <VlDialog v-model:open="dialogOpen" title="标准模态弹窗" description="严格直角容器 + 3px 顶部主题色条">
      你可以通过点击遮罩、关闭按钮或按下 <kbd>Esc</kbd> 键退出弹窗。
      <template #footer>
        <VlButton variant="neutral" @click="dialogOpen = false">关闭</VlButton>
        <VlButton variant="primary" @click="dialogOpen = false; toast.info('已确认')">确认</VlButton>
      </template>
    </VlDialog>

    <VlDialog v-model:open="dangerDialogOpen" tone="danger" title="危险操作确认" description="请核对以下不可逆变更">
      确认清空当前测试环境中的临时演示缓存吗？
      <template #footer>
        <VlButton variant="neutral" @click="dangerDialogOpen = false">取消</VlButton>
        <VlButton variant="danger" icon="trash" @click="dangerDialogOpen = false; toast.error('已确认执行')">确认删除</VlButton>
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
