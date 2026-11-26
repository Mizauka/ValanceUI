<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VlAccordion,
  VlAvatar,
  VlBadge,
  VlCard,
  VlDivider,
  VlKbd,
  VlLineChart,
  VlStatTile,
  VlTable,
  VlTimeline,
  useToast,
  type ChartSeriesInput,
  type TableColumn,
  type TimelineItem,
} from '@valance-ui/vue'

const toast = useToast()

const columns: TableColumn[] = [
  { key: 'name', label: '化合物名称' },
  { key: 'model', label: '房室模型' },
  { key: 'halfLife', label: '半衰期', align: 'right' },
  { key: 'status', label: '状态', align: 'center' },
]

const rows = [
  { name: 'Estradiol Valerate (IM)', model: '三室双相储库', halfLife: '120.5 h', status: '已校准' },
  { name: 'Estradiol (Oral)', model: '一室 Bateman', halfLife: '14.2 h', status: '默认参数' },
  { name: 'Cyproterone Acetate', model: '二室特征根', halfLife: '48.0 h', status: '已校准' },
  { name: 'Progesterone', model: '一室 Bateman', halfLife: '16.5 h', status: '自定义' },
]

const chartSeries = computed<ChartSeriesInput[]>(() => {
  const e2Points = []
  const cpaPoints = []
  const baseLine = []
  for (let h = 0; h <= 72; h += 2) {
    const wave = Math.exp(-h / 26) * Math.sin(h / 7.5 + 0.4) * 55
    const y1 = Math.max(25, 195 + wave + Math.sin(h / 5) * 28)
    const y0 = Math.max(20, 175 + wave * 0.72)
    e2Points.push({ x: h, y: y1, ciLow: y1 * 0.84, ciHigh: y1 * 1.18 })
    baseLine.push({ x: h, y: y0 })
    cpaPoints.push({ x: h, y: Math.max(8, 38 * Math.exp(-h / 42) + 12 + Math.cos(h / 9) * 6) })
  }
  return [
    {
      key: 'e2',
      name: '雌二醇浓度 (Kalman 校准)',
      unit: 'pg/mL',
      points: e2Points,
      baselinePoints: baseLine,
      markers: [
        { x: 18, y: 238, label: '实测抽血 #1: 238 pg/mL' },
        { x: 46, y: 176, label: '实测抽血 #2: 176 pg/mL' },
      ],
    },
    {
      key: 'cpa',
      name: '醋酸环丙孕酮 (CPA)',
      unit: 'ng/mL',
      points: cpaPoints,
      areaFill: true,
    },
  ]
})

const selectedTimelineId = ref<string | number>('d-1')
const timelineItems: TimelineItem[] = [
  {
    id: 'd-1',
    group: '2026-11-26 · 今日',
    time: '08:30',
    title: '戊酸雌二醇注射液 (EV)',
    subtitle: '4.0 mg · 肌内注射 (IM)',
    badge: '已记录',
    tone: 'primary',
    icon: 'pill',
  },
  {
    id: 'd-2',
    group: '2026-11-26 · 今日',
    time: '14:15',
    title: '静脉血检校准样点',
    subtitle: 'E2 实测 238 pg/mL · 校准因子 ×1.14',
    badge: '已校准',
    tone: 'secondary',
    icon: 'flask',
  },
  {
    id: 'd-3',
    group: '2026-11-24 · 周二',
    time: '21:00',
    title: '醋酸环丙孕酮 (CPA)',
    subtitle: '12.5 mg · 口服 (Oral)',
    badge: '稳态',
    tone: 'success',
    icon: 'check',
  },
]
</script>

<template>
  <div class="demo-view">
    <div class="stat-grid">
      <VlStatTile
        title="当前雌二醇估算"
        value="214.8 pg/mL"
        subtitle="峰值 285.0 pg/mL (11/25 14:00)"
        badge="已校准"
        tone="primary"
        m3-shape="clover-4"
        icon="curve"
      />
      <VlStatTile
        title="抗雄激素稳态谷值"
        value="18.4 ng/mL"
        subtitle="7 日连续平均浓度"
        badge="稳态"
        tone="secondary"
        m3-shape="cookie-7"
        icon="flask"
      />
    </div>

    <!-- Generalized Cross-Repo SVG Time-Series Line Chart -->
    <VlCard
      title="交互式扁平 SVG 时序曲线图表（VlLineChart）"
      subtitle="提炼自 The-Valence-Project 核心图表：支持置信带 (CI)、实测离散点、实时准星读数、滚轮/滑块缩放"
      accent-side="left"
      accent-tone="primary"
    >
      <VlLineChart
        title="多序列药代动力学实时模拟"
        :series="chartSeries"
        :reference-lines="[{ x: 36, label: '当前时刻' }]"
      />
    </VlCard>

    <div class="two-col">
      <VlCard title="扁平数据表格（VlTable）" accent-side="left" accent-tone="primary">
        <VlTable :columns="columns" :rows="rows" striped>
          <template #cell-status="{ value }">
            <VlBadge :tone="value === '已校准' ? 'secondary' : value === '自定义' ? 'primary' : 'neutral'" size="xs">
              {{ value }}
            </VlBadge>
          </template>
        </VlTable>
      </VlCard>

      <VlCard title="时间线分组记录（VlTimeline）" subtitle="提炼自历史给药与归档时间线" accent-side="left" accent-tone="secondary">
        <VlTimeline
          :items="timelineItems"
          :active-id="selectedTimelineId"
          @select="(it) => { selectedTimelineId = it.id; toast.info(`查看记录：${it.title}`) }"
        />
      </VlCard>
    </div>

    <div class="two-col">
      <VlCard title="手风琴折叠块（VlAccordion）" accent-side="left" accent-tone="secondary">
        <div style="display: flex; flex-direction: column; gap: 8px">
          <VlAccordion default-open title="第一章 · 大纲节选" :count="3" icon="book" bordered>
            <div class="acc-inner">基于 CSS Grid <code>0fr ↔ 1fr</code> 实现零高度计算抖动的平滑向下展开。</div>
          </VlAccordion>
          <VlAccordion title="第二章 · 药代动力学附录" :count="5" icon="flask" bordered>
            <div class="acc-inner">支持独立控制受控或非受控展开状态。</div>
          </VlAccordion>
        </div>
      </VlCard>

      <VlCard title="头像（标准与 M3E 剪裁轮廓）、键帽与分隔线" surface="surface">
        <div class="avatar-row">
          <VlAvatar name="Mizauka" size="sm" status="online" />
          <VlAvatar name="Cats On Plains" size="md" tone="secondary" status="busy" />
          <VlAvatar name="VU" size="lg" m3-shape="clover-4" tone="primary" />
          <VlAvatar name="M3" size="lg" m3-shape="cookie-6" tone="secondary" />
          <VlAvatar name="EX" size="lg" m3-shape="sunny" tone="primary" />
          <VlAvatar name="LV" size="lg" m3-shape="heart" tone="secondary" status="online" />
        </div>

        <VlDivider label="快捷键与语义标示" spacing="md" />

        <div class="kbd-row">
          <span>命令搜索面板</span>
          <VlKbd keys="Ctrl + K" />
          <span>切换全屏侧栏</span>
          <VlKbd keys="Ctrl + B" />
        </div>
      </VlCard>
    </div>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.acc-inner {
  padding: 10px 12px;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  border-top: 1px solid var(--divider-hairline);
}

.avatar-row,
.kbd-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
}
</style>
