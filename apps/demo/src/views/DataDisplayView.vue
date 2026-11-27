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
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()
const toast = useToast()

const columns = computed<TableColumn[]>(() => [
  { key: 'name', label: t.value.data.columns.name },
  { key: 'model', label: t.value.data.columns.model },
  { key: 'halfLife', label: t.value.data.columns.halfLife, align: 'right' },
  { key: 'status', label: t.value.data.columns.status, align: 'center' },
])

const rows = computed(() => [
  { name: 'Estradiol Valerate (IM)', model: t.value.data.rows.evModel, halfLife: '120.5 h', status: t.value.data.rows.evStatus, statusTone: 'secondary' as const },
  { name: 'Estradiol (Oral)', model: t.value.data.rows.oralModel, halfLife: '14.2 h', status: t.value.data.rows.oralStatus, statusTone: 'neutral' as const },
  { name: 'Cyproterone Acetate', model: t.value.data.rows.cpaModel, halfLife: '48.0 h', status: t.value.data.rows.cpaStatus, statusTone: 'secondary' as const },
  { name: 'Progesterone', model: t.value.data.rows.p4Model, halfLife: '16.5 h', status: t.value.data.rows.p4Status, statusTone: 'primary' as const },
])

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
      name: t.value.data.chart.e2SeriesName,
      unit: 'pg/mL',
      points: e2Points,
      baselinePoints: baseLine,
      markers: [
        { x: 18, y: 238, label: t.value.data.chart.e2Point1 },
        { x: 46, y: 176, label: t.value.data.chart.e2Point2 },
      ],
    },
    {
      key: 'cpa',
      name: t.value.data.chart.cpaSeriesName,
      unit: 'ng/mL',
      points: cpaPoints,
      areaFill: true,
    },
  ]
})

const selectedTimelineId = ref<string | number>('d-1')
const timelineItems = computed<TimelineItem[]>(() => [
  {
    id: 'd-1',
    group: t.value.data.timeline.item1Group,
    time: '08:30',
    title: t.value.data.timeline.item1Title,
    subtitle: t.value.data.timeline.item1Sub,
    badge: t.value.data.timeline.item1Badge,
    tone: 'primary',
    icon: 'pill',
  },
  {
    id: 'd-2',
    group: t.value.data.timeline.item2Group,
    time: '14:15',
    title: t.value.data.timeline.item2Title,
    subtitle: t.value.data.timeline.item2Sub,
    badge: t.value.data.timeline.item2Badge,
    tone: 'secondary',
    icon: 'flask',
  },
  {
    id: 'd-3',
    group: t.value.data.timeline.item3Group,
    time: '21:00',
    title: t.value.data.timeline.item3Title,
    subtitle: t.value.data.timeline.item3Sub,
    badge: t.value.data.timeline.item3Badge,
    tone: 'success',
    icon: 'check',
  },
])
</script>

<template>
  <div class="demo-view">
    <div class="stat-grid">
      <VlStatTile
        :title="t.data.stats.e2Title"
        value="214.8 pg/mL"
        :subtitle="t.data.stats.e2Subtitle"
        :badge="t.data.stats.e2Badge"
        tone="primary"
        m3-shape="clover-4"
        icon="curve"
      />
      <VlStatTile
        :title="t.data.stats.cpaTitle"
        value="18.4 ng/mL"
        :subtitle="t.data.stats.cpaSubtitle"
        :badge="t.data.stats.cpaBadge"
        tone="secondary"
        m3-shape="cookie-7"
        icon="flask"
      />
    </div>

    <!-- Generalized Cross-Repo SVG Time-Series Line Chart -->
    <VlCard
      :title="t.data.chart.cardTitle"
      :subtitle="t.data.chart.cardSubtitle"
      accent-side="left"
      accent-tone="primary"
    >
      <VlLineChart
        :title="t.data.chart.chartTitle"
        :series="chartSeries"
        :reference-lines="[{ x: 36, label: t.data.chart.nowLineLabel }]"
      />
    </VlCard>

    <div class="two-col">
      <VlCard :title="t.data.tableCardTitle" accent-side="left" accent-tone="primary">
        <VlTable :columns="columns" :rows="rows" striped>
          <template #cell-status="{ value, row }">
            <VlBadge :tone="(row.statusTone as 'primary' | 'secondary' | 'neutral') ?? 'neutral'" size="xs">
              {{ value }}
            </VlBadge>
          </template>
        </VlTable>
      </VlCard>

      <VlCard :title="t.data.timeline.cardTitle" :subtitle="t.data.timeline.cardSubtitle" accent-side="left" accent-tone="secondary">
        <VlTimeline
          :items="timelineItems"
          :active-id="selectedTimelineId"
          @select="(it) => { selectedTimelineId = it.id; toast.info(t.data.timeline.selectToast(it.title)) }"
        />
      </VlCard>
    </div>

    <div class="two-col">
      <VlCard :title="t.data.accordionCardTitle" accent-side="left" accent-tone="secondary">
        <div style="display: flex; flex-direction: column; gap: 8px">
          <VlAccordion default-open :title="t.data.acc1Title" :count="3" icon="book" bordered>
            <div class="acc-inner">{{ t.data.acc1Body }}</div>
          </VlAccordion>
          <VlAccordion :title="t.data.acc2Title" :count="5" icon="flask" bordered>
            <div class="acc-inner">{{ t.data.acc2Body }}</div>
          </VlAccordion>
        </div>
      </VlCard>

      <VlCard :title="t.data.avatarCardTitle" surface="surface">
        <div class="avatar-row">
          <VlAvatar name="Mizauka" size="sm" status="online" />
          <VlAvatar name="Cats On Plains" size="md" tone="secondary" status="busy" />
          <VlAvatar name="VU" size="lg" m3-shape="clover-4" tone="primary" />
          <VlAvatar name="M3" size="lg" m3-shape="cookie-6" tone="secondary" />
          <VlAvatar name="EX" size="lg" m3-shape="sunny" tone="primary" />
          <VlAvatar name="LV" size="lg" m3-shape="heart" tone="secondary" status="online" />
        </div>

        <VlDivider :label="t.data.kbdDivider" spacing="md" />

        <div class="kbd-row">
          <span>{{ t.data.kbdCommandLabel }}</span>
          <VlKbd keys="Ctrl + K" />
          <span>{{ t.data.kbdSidebarLabel }}</span>
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
