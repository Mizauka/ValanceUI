<script setup lang="ts">
import { ref } from 'vue'
import {
  VlButton,
  VlCalendar,
  VlCard,
  VlCheckbox,
  VlDatePicker,
  VlDateTimePicker,
  VlFileDropzone,
  VlInput,
  VlRadioGroup,
  VlSelect,
  VlSlider,
  VlSwitch,
  VlTagInput,
  VlTextarea,
  VlTimePicker,
  useToast,
  type RadioOption,
  type SelectOption,
} from '@valance-ui/vue'

const toast = useToast()

const name = ref('Valence Workbench')
const search = ref('')
const errorInput = ref('')
const bio = ref('在严格直角 / 正圆 / 胶囊 / M3E 35 种几何图形与零阴影下，保持高密度交互质感。')
const routeMethod = ref('im')
const modelMethod = ref('two_compartment')
const pickedDate = ref('2026-11-26')
const pickedTime = ref('14:35')
const inlineClock24 = ref('20:45')
const inlineClock12 = ref('09:15')
const pickedDateTime = ref('2026-11-26T20:45')
const formTags = ref(['自绘下拉框', '表盘时钟', 'Flat Geometric'])

const switchA = ref(true)
const switchB = ref(false)
const checkA = ref(true)
const checkB = ref(false)
const checkIndet = ref(true)
const radioVal = ref<'ou' | 'ratio'>('ou')
const weightSlider = ref(62)
const ratioSlider = ref(40)

const routeOptions: SelectOption[] = [
  { value: 'oral', label: '口服 · Oral', description: 'Bateman 一室胃肠道吸收模型', icon: 'pill', badge: '常规' },
  { value: 'sublingual', label: '舌下 · Sublingual', description: '黏膜快速首过绕过吸收', icon: 'sparkles', badge: '快效' },
  { value: 'im', label: '肌内注射 · IM', description: '双相缓释长周期稳态曲线', icon: 'curve', badge: '推荐' },
  { value: 'gel', label: '透皮凝胶 · Gel', description: '平滑皮肤储库释放曲线', icon: 'flask' },
]

const modelOptions: SelectOption[] = [
  { value: 'one_compartment', label: '一室模型 (Bateman)', badge: '1C' },
  { value: 'two_compartment', label: '二室模型 (精确特征根)', badge: '2C' },
  { value: 'three_compartment', label: '三室深层储库模型', badge: '3C' },
  { value: 'ou_kalman', label: 'OU-卡尔曼混合平滑', badge: 'ML' },
]

const radioOptions: RadioOption<'ou' | 'ratio'>[] = [
  {
    value: 'ou',
    label: 'OU-卡尔曼平滑模型',
    description: '基于 Ornstein-Uhlenbeck 随机过程的连续置信区间估计',
  },
  {
    value: 'ratio',
    label: '分段比率线性插值',
    description: '适用于少量离散实测值的快速校准',
  },
]

function submitForm() {
  if (!name.value.trim()) {
    toast.error('请先填写名称')
    return
  }
  toast.success(`已保存配置：${name.value}（${pickedDate.value} ${pickedTime.value}）`)
}
</script>

<template>
  <div class="demo-view">
    <div class="two-col">
      <!-- Self-Drawn Text Inputs & Custom Select -->
      <VlCard title="输入框与自绘选择器（无原生弹窗）" subtitle="100% 自绘扁平弹出层 · 支持键盘上下选择、内置搜索、描述与图标" accent-side="left" accent-tone="primary">
        <div class="form-stack">
          <VlInput
            v-model="name"
            label="直角标准输入框"
            placeholder="请输入项目名称…"
            clearable
            hint="聚焦时高亮 2px 主色调内描边，保持零阴影。"
          />

          <VlInput
            v-model="search"
            shape="pill"
            prefix-icon="search"
            label="胶囊搜索框（shape='pill'）"
            placeholder="输入正则表达式或关键词…"
            clearable
          />

          <VlSelect
            v-model="routeMethod"
            label="全自绘 Select 下拉（支持图标与副标题）"
            :options="routeOptions"
          />

          <VlSelect
            v-model="modelMethod"
            searchable
            label="可搜索自绘 Select（统一位置动效 + 顶部胶囊搜索框）"
            :options="modelOptions"
          />

          <VlTagInput
            v-model="formTags"
            label="动态标签输入框（VlTagInput）"
            hint="输入后按 Enter 或英文逗号添加，Backspace 删除最后一项"
          />

          <VlInput
            v-model="errorInput"
            label="错误校验状态"
            placeholder="输入空值将显示错误态"
            :error="errorInput.trim() ? '' : '此字段不能为空（演示错误描边）'"
          />

          <VlTextarea
            v-model="bio"
            label="多行备注文本"
            :maxlength="120"
            show-count
            :rows="3"
          />
        </div>
      </VlCard>

      <!-- Switch / Checkbox / Radio / File Dropzone -->
      <VlCard title="开关（支持拖拽手势）、选择组、滑杆与文件拖拽区" accent-side="left" accent-tone="secondary">
        <div class="form-stack">
          <VlSwitch
            v-model="switchA"
            label="启用桌面端多标签栏（支持点击或横向滑动切换）"
            description="在工作台顶部展示已打开文档标签页 · 可直接按住滑块左右拖动"
          />
          <VlSwitch
            v-model="switchB"
            tone="secondary"
            label="启用 PWA 离线推送提醒"
            description="到达周期时间后触发系统通知"
          />

          <div class="divider-line" />

          <VlCheckbox v-model="checkA" label="忽略正则大小写 (i)" />
          <VlCheckbox v-model="checkB" tone="secondary" label="打开新篇章时自动折叠旧章节" />
          <VlCheckbox v-model="checkIndet" indeterminate label="半选状态（Indeterminate）" />

          <div class="divider-line" />

          <VlRadioGroup
            v-model="radioVal"
            variant="card"
            :options="radioOptions"
          />

          <VlSlider v-model="weightSlider" :min="35" :max="120" label="生理体重参数" unit=" kg" />
          <VlSlider v-model="ratioSlider" :min="20" :max="65" tone="secondary" label="双栏分屏比例" unit="%" />

          <VlFileDropzone
            title="拖拽或点击导入 JSON / Markdown 备份"
            subtitle="支持本地选择展示文件名、容量与删除管理"
            @select="(files) => toast.info(`已选中 ${files.length} 个文件`)"
          />

          <VlButton variant="primary" icon="check" block @click="submitForm">
            提交表单示例
          </VlButton>
        </div>
      </VlCard>
    </div>

    <!-- Custom Drawn Calendar + Analog Clock Time Picker Showcase -->
    <VlCard
      title="自绘日历、拨动式时钟表盘与日期时间组合选择器"
      subtitle="Material 风格自绘 SVG 表盘（支持指针拖拽拨动小时/分钟、24H 内外双圈与 12H AM/PM）+ 扁平日历网格"
      accent-side="top"
      accent-tone="primary"
    >
      <div class="pickers-top-bar">
        <VlDatePicker v-model="pickedDate" label="弹出式自绘日期框（VlDatePicker）" clearable />
        <VlTimePicker v-model="pickedTime" label="弹出式表盘时间框（VlTimePicker）" />
        <VlDateTimePicker v-model="pickedDateTime" label="日期时间一体框（VlDateTimePicker）" />
      </div>

      <div class="inline-pickers-grid">
        <div class="picker-panel shape-rect">
          <div class="picker-panel-head">
            <strong>内联自绘日历（VlCalendar）</strong>
            <code>{{ pickedDate }}</code>
          </div>
          <VlCalendar v-model="pickedDate" />
        </div>

        <div class="picker-panel shape-rect">
          <div class="picker-panel-head">
            <strong>24H 双圈拨动表盘（VlTimePicker inline）</strong>
            <code>{{ inlineClock24 }}</code>
          </div>
          <VlTimePicker v-model="inlineClock24" inline format="24h" tone="primary" />
        </div>

        <div class="picker-panel shape-rect">
          <div class="picker-panel-head">
            <strong>12H AM/PM 表盘（副色调）</strong>
            <code>{{ inlineClock12 }}</code>
          </div>
          <VlTimePicker v-model="inlineClock12" inline format="12h" tone="secondary" />
        </div>
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

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.divider-line {
  height: 1px;
  background-color: var(--divider-hairline);
  margin: 2px 0;
}

.pickers-top-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.inline-pickers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.picker-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.picker-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--ui-font-xs);
  color: var(--text-primary);
}

.picker-panel-head code {
  font-family: var(--font-mono);
  color: var(--accent-primary-text);
  background-color: var(--accent-primary-soft);
  padding: 1px 6px;
}
</style>
