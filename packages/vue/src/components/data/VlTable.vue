<script setup lang="ts">
export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

withDefaults(
  defineProps<{
    columns: TableColumn[]
    rows: Record<string, unknown>[]
    compact?: boolean
    striped?: boolean
    hoverable?: boolean
  }>(),
  {
    compact: false,
    striped: false,
    hoverable: true,
  },
)
</script>

<template>
  <div class="vl-table-wrap shape-rect">
    <table class="vl-table" :class="{ compact, striped, hoverable }">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{
              textAlign: col.align ?? 'left',
              width: col.width,
            }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rIdx) in rows" :key="rIdx">
          <td
            v-for="col in columns"
            :key="col.key"
            :style="{ textAlign: col.align ?? 'left' }"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="rIdx">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.vl-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--divider-hairline);
  background-color: var(--bg-base);
}

.vl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--ui-font-md);
  font-variant-numeric: tabular-nums;
}

.vl-table th {
  padding: 9px 12px;
  font-size: var(--ui-font-sm);
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--text-primary);
  background-color: var(--bg-activity);
  border-bottom: 2px solid var(--divider-strong);
  white-space: nowrap;
}

.vl-table td {
  padding: 9px 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-table.compact th,
.vl-table.compact td {
  padding: 6px 10px;
}

.vl-table tbody tr:last-child td {
  border-bottom: none;
}

.vl-table.striped tbody tr:nth-child(even) td {
  background-color: var(--bg-surface);
}

.vl-table.hoverable tbody tr:hover td {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}
</style>
