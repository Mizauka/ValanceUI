<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()
const toast = useToast()

const name = ref('Valence Workbench')
const search = ref('')
const errorInput = ref('')
const bio = ref(t.value.forms.defaultBio)
const routeMethod = ref('im')
const modelMethod = ref('two_compartment')
const pickedDate = ref('2026-11-26')
const pickedTime = ref('14:35')
const inlineClock24 = ref('20:45')
const inlineClock12 = ref('09:15')
const pickedDateTime = ref('2026-11-26T20:45')
const formTags = ref([...t.value.forms.defaultTags])

watch(
  () => t.value.forms.defaultBio,
  (next, prev) => {
    if (bio.value === prev) bio.value = next
  },
)
watch(
  () => t.value.forms.defaultTags,
  (next, prev) => {
    if (formTags.value.length === prev.length && formTags.value.every((v, i) => v === prev[i])) {
      formTags.value = [...next]
    }
  },
)

const switchA = ref(true)
const switchB = ref(false)
const checkA = ref(true)
const checkB = ref(false)
const checkIndet = ref(true)
const radioVal = ref<'ou' | 'ratio'>('ou')
const weightSlider = ref(62)
const ratioSlider = ref(40)

const routeOptions = computed<SelectOption[]>(() => [
  { value: 'oral', label: t.value.forms.routes.oral.label, description: t.value.forms.routes.oral.description, icon: 'pill', badge: t.value.forms.routes.oral.badge },
  { value: 'sublingual', label: t.value.forms.routes.sublingual.label, description: t.value.forms.routes.sublingual.description, icon: 'sparkles', badge: t.value.forms.routes.sublingual.badge },
  { value: 'im', label: t.value.forms.routes.im.label, description: t.value.forms.routes.im.description, icon: 'curve', badge: t.value.forms.routes.im.badge },
  { value: 'gel', label: t.value.forms.routes.gel.label, description: t.value.forms.routes.gel.description, icon: 'flask' },
])

const modelOptions = computed<SelectOption[]>(() => [
  { value: 'one_compartment', label: t.value.forms.models.one_compartment.label, badge: '1C' },
  { value: 'two_compartment', label: t.value.forms.models.two_compartment.label, badge: '2C' },
  { value: 'three_compartment', label: t.value.forms.models.three_compartment.label, badge: '3C' },
  { value: 'ou_kalman', label: t.value.forms.models.ou_kalman.label, badge: 'ML' },
])

const radioOptions = computed<RadioOption<'ou' | 'ratio'>[]>(() => [
  {
    value: 'ou',
    label: t.value.forms.radios.ou.label,
    description: t.value.forms.radios.ou.description,
  },
  {
    value: 'ratio',
    label: t.value.forms.radios.linear.label,
    description: t.value.forms.radios.linear.description,
  },
])

function submitForm() {
  if (!name.value.trim()) {
    toast.error(t.value.forms.toasts.emptyName)
    return
  }
  toast.success(t.value.forms.toasts.submitted(name.value, pickedDate.value, pickedTime.value))
}
</script>

<template>
  <div class="demo-view">
    <div class="two-col">
      <!-- Self-Drawn Text Inputs & Custom Select -->
      <VlCard :title="t.forms.card1Title" :subtitle="t.forms.card1Subtitle" accent-side="left" accent-tone="primary">
        <div class="form-stack">
          <VlInput
            v-model="name"
            :label="t.forms.rectInputLabel"
            :placeholder="t.forms.rectInputPlaceholder"
            clearable
            :hint="t.forms.rectInputHint"
          />

          <VlInput
            v-model="search"
            shape="pill"
            prefix-icon="search"
            :label="t.forms.pillSearchLabel"
            :placeholder="t.forms.pillSearchPlaceholder"
            clearable
          />

          <VlSelect
            v-model="routeMethod"
            :label="t.forms.selectRouteLabel"
            :options="routeOptions"
          />

          <VlSelect
            v-model="modelMethod"
            searchable
            :label="t.forms.searchableSelectLabel"
            :options="modelOptions"
          />

          <VlTagInput
            v-model="formTags"
            :label="t.forms.tagInputLabel"
            :hint="t.forms.tagInputHint"
          />

          <VlInput
            v-model="errorInput"
            :label="t.forms.errorInputLabel"
            :placeholder="t.forms.errorInputPlaceholder"
            :error="errorInput.trim() ? '' : t.forms.errorInputMessage"
          />

          <VlTextarea
            v-model="bio"
            :label="t.forms.textareaLabel"
            :maxlength="120"
            show-count
            :rows="3"
          />
        </div>
      </VlCard>

      <!-- Switch / Checkbox / Radio / File Dropzone -->
      <VlCard :title="t.forms.card2Title" accent-side="left" accent-tone="secondary">
        <div class="form-stack">
          <VlSwitch
            v-model="switchA"
            :label="t.forms.switch1Label"
            :description="t.forms.switch1Desc"
          />
          <VlSwitch
            v-model="switchB"
            tone="secondary"
            :label="t.forms.switch2Label"
            :description="t.forms.switch2Desc"
          />

          <div class="divider-line" />

          <VlCheckbox v-model="checkA" :label="t.forms.checkRegex" />
          <VlCheckbox v-model="checkB" tone="secondary" :label="t.forms.checkAutoCollapse" />
          <VlCheckbox v-model="checkIndet" indeterminate :label="t.forms.checkIndet" />

          <div class="divider-line" />

          <VlRadioGroup
            v-model="radioVal"
            variant="card"
            :options="radioOptions"
          />

          <VlSlider v-model="weightSlider" :min="35" :max="120" :label="t.forms.weightLabel" unit=" kg" />
          <VlSlider v-model="ratioSlider" :min="20" :max="65" tone="secondary" :label="t.forms.splitLabel" unit="%" />

          <VlFileDropzone
            :title="t.forms.dropTitle"
            :subtitle="t.forms.dropSubtitle"
            @select="(files) => toast.info(t.forms.toasts.filesSelected(files.length))"
          />

          <VlButton variant="primary" icon="check" block @click="submitForm">
            {{ t.forms.submitBtn }}
          </VlButton>
        </div>
      </VlCard>
    </div>

    <!-- Custom Drawn Calendar + Analog Clock Time Picker Showcase -->
    <VlCard
      :title="t.forms.card3Title"
      :subtitle="t.forms.card3Subtitle"
      accent-side="top"
      accent-tone="primary"
    >
      <div class="pickers-top-bar">
        <VlDatePicker v-model="pickedDate" :label="t.forms.datePickerLabel" clearable />
        <VlTimePicker v-model="pickedTime" :label="t.forms.timePickerLabel" />
        <VlDateTimePicker v-model="pickedDateTime" :label="t.forms.dateTimePickerLabel" />
      </div>

      <div class="inline-pickers-grid">
        <div class="picker-panel shape-rect">
          <div class="picker-panel-head">
            <strong>{{ t.forms.inlineCalendarTitle }}</strong>
            <code>{{ pickedDate }}</code>
          </div>
          <VlCalendar v-model="pickedDate" />
        </div>

        <div class="picker-panel shape-rect">
          <div class="picker-panel-head">
            <strong>{{ t.forms.dial24Title }}</strong>
            <code>{{ inlineClock24 }}</code>
          </div>
          <VlTimePicker v-model="inlineClock24" inline format="24h" tone="primary" />
        </div>

        <div class="picker-panel shape-rect">
          <div class="picker-panel-head">
            <strong>{{ t.forms.dial12Title }}</strong>
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
