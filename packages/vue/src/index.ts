import type { App, Plugin } from 'vue'
import './styles/tokens.css'
import './styles/base.css'

// Zero-delay mobile touch feedback: bypasses the 100-300ms browser :active delay on touchscreens
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  let activeTouchEl: HTMLElement | null = null
  let activePointerId: number | null = null
  let startX = 0
  let startY = 0
  let downAt = 0
  let releaseTimer: ReturnType<typeof setTimeout> | null = null

  const clearTouchActive = (immediate = false) => {
    const el = activeTouchEl
    activeTouchEl = null
    activePointerId = null
    if (releaseTimer !== null) {
      clearTimeout(releaseTimer)
      releaseTimer = null
    }
    if (!el) return
    const elapsed = Date.now() - downAt
    if (immediate || elapsed >= 110) {
      el.classList.remove('is-touch-active')
    } else {
      releaseTimer = setTimeout(() => {
        el.classList.remove('is-touch-active')
        releaseTimer = null
      }, 110 - elapsed)
    }
  }

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('button, a, [role="button"]')
      if (!target || target.hasAttribute('disabled')) return
      clearTouchActive(true)
      activeTouchEl = target
      activePointerId = e.pointerId
      startX = e.clientX
      startY = e.clientY
      downAt = Date.now()
      target.classList.add('is-touch-active')
    },
    { passive: true },
  )

  document.addEventListener(
    'pointermove',
    (e) => {
      if (activePointerId === null || e.pointerId !== activePointerId) return
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
        clearTouchActive(true)
      }
    },
    { passive: true },
  )

  document.addEventListener(
    'pointerup',
    (e) => {
      if (activePointerId !== null && e.pointerId === activePointerId) clearTouchActive(false)
    },
    { passive: true },
  )

  document.addEventListener(
    'pointercancel',
    (e) => {
      if (activePointerId !== null && e.pointerId === activePointerId) clearTouchActive(true)
    },
    { passive: true },
  )
}

// ─── Icons ───────────────────────────────────────────────────────────
import VlIcon from './components/icons/VlIcon.vue'
import {
  ICON_REGISTRY,
  ICON_CATEGORIES,
  registerIcons,
  getAllIconNames,
  type IconName,
  type BuiltinIconName,
  type IconNode,
  type IconCategory,
} from './components/icons/iconRegistry'

export { VlIcon }
export {
  ICON_REGISTRY,
  ICON_CATEGORIES,
  registerIcons,
  getAllIconNames,
  type IconName,
  type BuiltinIconName,
  type IconNode,
  type IconCategory,
}

// ─── Primitives & Expressive Shapes ──────────────────────────────────
import VlButton from './components/primitives/VlButton.vue'
import VlIconButton from './components/primitives/VlIconButton.vue'
import VlBadge from './components/primitives/VlBadge.vue'
import VlTag from './components/primitives/VlTag.vue'
import VlDivider from './components/primitives/VlDivider.vue'
import VlAvatar from './components/primitives/VlAvatar.vue'
import VlKbd from './components/primitives/VlKbd.vue'
import VlShape from './components/primitives/VlShape.vue'

export { VlButton, VlIconButton, VlBadge, VlTag, VlDivider, VlAvatar, VlKbd, VlShape }

export {
  M3_EXPRESSIVE_SHAPES,
  ALL_M3_SHAPES,
  M3_SHAPE_MAP,
  M3_SHAPE_CANONICAL_RECT,
  getM3ShapePath,
  getM3ShapePoints,
  morphM3ShapePath,
  type M3ShapeName,
  type M3ShapeCategory,
  type M3ShapeMeta,
} from './styles/m3Shapes'

// ─── Forms & Pickers ─────────────────────────────────────────────────
import VlInput from './components/forms/VlInput.vue'
import VlTextarea from './components/forms/VlTextarea.vue'
import VlSelect, { type SelectOption } from './components/forms/VlSelect.vue'
import VlSwitch from './components/forms/VlSwitch.vue'
import VlCheckbox from './components/forms/VlCheckbox.vue'
import VlRadioGroup, { type RadioOption } from './components/forms/VlRadioGroup.vue'
import VlSlider from './components/forms/VlSlider.vue'
import VlStepper from './components/forms/VlStepper.vue'
import VlSegmentedControl, { type SegmentOption } from './components/forms/VlSegmentedControl.vue'
import VlPalettePicker from './components/forms/VlPalettePicker.vue'
import VlCalendar from './components/forms/VlCalendar.vue'
import VlDatePicker from './components/forms/VlDatePicker.vue'
import VlTimePicker from './components/forms/VlTimePicker.vue'
import VlDateTimePicker from './components/forms/VlDateTimePicker.vue'
import VlTagInput from './components/forms/VlTagInput.vue'
import VlFileDropzone, { type DroppedFileItem } from './components/forms/VlFileDropzone.vue'

export {
  VlInput,
  VlTextarea,
  VlSelect,
  VlSwitch,
  VlCheckbox,
  VlRadioGroup,
  VlSlider,
  VlStepper,
  VlSegmentedControl,
  VlPalettePicker,
  VlCalendar,
  VlDatePicker,
  VlTimePicker,
  VlDateTimePicker,
  VlTagInput,
  VlFileDropzone,
}
export type { SelectOption, RadioOption, SegmentOption, DroppedFileItem }

// ─── Color Engine ────────────────────────────────────────────────────
export {
  STANDARD_PALETTES,
  PRIDE_PALETTES,
  ALL_PRESET_PALETTES,
  MONET_HARMONY_OPTIONS,
  generateMonetPalette,
  pickHarmoniousSecondaryHue,
  getPaletteById,
  resolvePaletteTokens,
  hexToHsl,
  hslToHex,
  relativeLuminance,
  contrastRatio,
  type PaletteGroup,
  type MonetHarmonyMode,
  type MonetHarmonyOption,
  type PaletteDefinition,
  type AccentRamp,
  type SurfacePalette,
  type PaletteThemeMode,
} from './styles/colorEngine'

// ─── Navigation ──────────────────────────────────────────────────────
import VlTitleBar from './components/navigation/VlTitleBar.vue'
import VlActivityBar, {
  type ActivityBarItem,
  type ActivityBarGroup,
  type ActivityBarGroupAlign,
} from './components/navigation/VlActivityBar.vue'
import VlSideNav, { type SideNavGroup, type SideNavItem } from './components/navigation/VlSideNav.vue'
import VlNavRail, { type NavRailItem } from './components/navigation/VlNavRail.vue'
import VlBottomDock, { type BottomDockItem } from './components/navigation/VlBottomDock.vue'
import VlTabBar, { type TabBarItem } from './components/navigation/VlTabBar.vue'
import VlTabs, { type TabOption } from './components/navigation/VlTabs.vue'
import VlBreadcrumb, { type BreadcrumbItem } from './components/navigation/VlBreadcrumb.vue'
import VlPagination from './components/navigation/VlPagination.vue'
import VlStatusBar from './components/navigation/VlStatusBar.vue'
import VlSteps, { type StepItem } from './components/navigation/VlSteps.vue'
import VlBackTop from './components/navigation/VlBackTop.vue'

export {
  VlTitleBar,
  VlActivityBar,
  VlSideNav,
  VlNavRail,
  VlBottomDock,
  VlTabBar,
  VlTabs,
  VlBreadcrumb,
  VlPagination,
  VlStatusBar,
  VlSteps,
  VlBackTop,
}
export type {
  ActivityBarItem,
  ActivityBarGroup,
  ActivityBarGroupAlign,
  SideNavGroup,
  SideNavItem,
  NavRailItem,
  BottomDockItem,
  TabBarItem,
  TabOption,
  BreadcrumbItem,
  StepItem,
}

// ─── Layout ──────────────────────────────────────────────────────────
import VlScrollArea from './components/layout/VlScrollArea.vue'
import VlSplitPane from './components/layout/VlSplitPane.vue'
import VlPushDrawer from './components/layout/VlPushDrawer.vue'
import VlPanel from './components/layout/VlPanel.vue'
import VlCard from './components/layout/VlCard.vue'
import VlAccordion from './components/layout/VlAccordion.vue'
import VlWorkbenchShell from './components/layout/VlWorkbenchShell.vue'
import VlPullRefresh from './components/layout/VlPullRefresh.vue'

export {
  VlScrollArea,
  VlSplitPane,
  VlPushDrawer,
  VlPanel,
  VlCard,
  VlAccordion,
  VlPullRefresh,
  VlWorkbenchShell,
}

// ─── Overlays & Feedback ─────────────────────────────────────────────
import VlDockSheet, {
  type DockSheetDetent,
  type DockSheetMorphState,
} from './components/overlays/VlDockSheet.vue'
import VlSheet from './components/overlays/VlSheet.vue'
import VlDialog from './components/overlays/VlDialog.vue'
import VlToast from './components/overlays/VlToast.vue'
import VlTooltip from './components/overlays/VlTooltip.vue'
import VlDropdown, { type DropdownItem } from './components/overlays/VlDropdown.vue'
import VlPopover from './components/overlays/VlPopover.vue'
import VlPopconfirm from './components/overlays/VlPopconfirm.vue'
import VlContextMenu from './components/overlays/VlContextMenu.vue'
import VlCommandPalette, { type CommandPaletteItem } from './components/overlays/VlCommandPalette.vue'

export {
  VlDockSheet,
  VlSheet,
  VlDialog,
  VlToast,
  VlTooltip,
  VlDropdown,
  VlPopover,
  VlPopconfirm,
  VlContextMenu,
  VlCommandPalette,
}
export type { DockSheetDetent, DockSheetMorphState, DropdownItem, CommandPaletteItem }

// ─── Data Display & Charts ───────────────────────────────────────────
import VlProgress from './components/data/VlProgress.vue'
import VlAlert from './components/data/VlAlert.vue'
import VlEmptyState from './components/data/VlEmptyState.vue'
import VlSkeleton from './components/data/VlSkeleton.vue'
import VlTable, { type TableColumn } from './components/data/VlTable.vue'
import VlStatTile from './components/data/VlStatTile.vue'
import VlColorSwatch from './components/data/VlColorSwatch.vue'
import VlLineChart, {
  type ChartPoint,
  type ChartMarkerPoint,
  type ChartSeriesInput,
  type ChartReferenceLine,
} from './components/data/VlLineChart.vue'
import VlTimeline, {
  type TimelineItem,
  type TimelineGroup,
} from './components/data/VlTimeline.vue'

export {
  VlProgress,
  VlAlert,
  VlEmptyState,
  VlSkeleton,
  VlTable,
  VlStatTile,
  VlColorSwatch,
  VlLineChart,
  VlTimeline,
}
export type {
  TableColumn,
  ChartPoint,
  ChartMarkerPoint,
  ChartSeriesInput,
  ChartReferenceLine,
  TimelineItem,
  TimelineGroup,
}

// ─── Composables ─────────────────────────────────────────────────────
export {
  useThemeMode,
  configureThemeMode,
  createThemeInitScript,
  type ThemePreference,
  type ResolvedTheme,
  type AccentScheme,
  type ThemeModeOptions,
} from './composables/useThemeMode'

export { useSplitResize, type SplitResizeOptions } from './composables/useSplitResize'

export {
  usePushDrawerGesture,
  type PushDrawerGestureOptions,
} from './composables/usePushDrawerGesture'

export {
  useNavScrubGesture,
  type NavScrubGestureOptions,
  type NavScrubItemMetric,
  type NavContainerFollowConfig,
} from './composables/useNavScrubGesture'

export {
  useViewportTier,
  useViewportTier as useViewportTierState,
  type ViewportTier,
  type ViewportTierOptions,
} from './composables/useViewportTier'

export { useToast, type ToastTone, type ToastMessage } from './composables/useToast'

export {
  useBackNavigation,
  useBackHandler,
  registerBackHandler,
  dispatchBack,
  clearBackHandlers,
  type BackHandlerEntry,
} from './composables/useBackNavigation'

export { useWidthTransition, type WidthTransitionOptions } from './composables/useWidthTransition'

// ─── Plugin Registration ─────────────────────────────────────────────
const components = {
  VlIcon,
  VlButton,
  VlIconButton,
  VlBadge,
  VlTag,
  VlDivider,
  VlAvatar,
  VlKbd,
  VlShape,
  VlInput,
  VlTextarea,
  VlSelect,
  VlSwitch,
  VlCheckbox,
  VlRadioGroup,
  VlSlider,
  VlStepper,
  VlSegmentedControl,
  VlPalettePicker,
  VlCalendar,
  VlDatePicker,
  VlTimePicker,
  VlDateTimePicker,
  VlTagInput,
  VlFileDropzone,
  VlTitleBar,
  VlActivityBar,
  VlSideNav,
  VlNavRail,
  VlBottomDock,
  VlTabBar,
  VlTabs,
  VlBreadcrumb,
  VlPagination,
  VlStatusBar,
  VlSteps,
  VlBackTop,
  VlScrollArea,
  VlSplitPane,
  VlPushDrawer,
  VlPanel,
  VlCard,
  VlAccordion,
  VlPullRefresh,
  VlWorkbenchShell,
  VlDockSheet,
  VlSheet,
  VlDialog,
  VlToast,
  VlTooltip,
  VlDropdown,
  VlPopover,
  VlPopconfirm,
  VlContextMenu,
  VlCommandPalette,
  VlProgress,
  VlAlert,
  VlEmptyState,
  VlSkeleton,
  VlTable,
  VlStatTile,
  VlColorSwatch,
  VlLineChart,
  VlTimeline,
}

export const ValanceUI: Plugin = {
  install(app: App) {
    for (const [name, comp] of Object.entries(components)) {
      app.component(name, comp)
    }
  },
}

export default ValanceUI
