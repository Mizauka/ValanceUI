import type { AccentScheme, ThemePreference } from '@valance-ui/vue'

export interface DemoSectionText {
  title: string
  group: string
  badge?: string
  summary: string
}

export interface DemoMessages {
  meta: {
    documentTitle: string
  }
  catalog: {
    sections: Record<string, DemoSectionText>
  }
  app: {
    brandSubtitle: string
    activity: {
      catalog: string
      search: string
      inspector: string
      settings: string
    }
    mobileDock: {
      overview: string
      gestures: string
      buttons: string
    }
    themeOptions: Record<ThemePreference, string>
    accentOptions: Record<AccentScheme, string>
    panels: {
      mobileCatalogTitle: string
      mobileSearchTitle: string
      mobileSearchPlaceholder: string
      mobileSettingsTitle: string
      leftCatalogTitle: string
      leftCatalogBadge: string
      leftSearchTitle: string
      leftSearchPlaceholder: string
      leftSettingsTitle: string
      paletteSectionTitle: string
      appearanceModeTitle: string
      accentSwapTitle: string
      languageSectionTitle: string
      mobilePagerAria: string
    }
    actions: {
      expandQuickSettings: string
      toggleTheme: string
      swapAccent: string
      cycleLocale: string
      toggleLeftSidebar: string
      toggleRightInspector: string
      cleanTabs: string
      goGesturesLab: string
    }
    inspector: {
      panelTitle: string
      currentModuleCard: string
      moduleId: string
      moduleGroup: string
      themeStateCard: string
      themeMode: string
      palette: string
      accentScheme: string
      language: string
      openTabs: string
      tabCountUnit: (count: number) => string
    }
    statusBar: {
      tabsCount: (count: number) => string
      themeLabel: (resolved: 'light' | 'dark', hex: string) => string
    }
  }
  overview: {
    heroDesc: string
    heroButtons: {
      gestures: string
      swapAccent: (scheme: AccentScheme) => string
      toggleTheme: (resolved: 'light' | 'dark') => string
    }
    stats: {
      componentsTitle: string
      componentsSubtitle: string
      iconsTitle: string
      iconsSubtitle: string
      shapesTitle: string
      shapesSubtitle: string
      shadowTitle: string
      shadowSubtitle: string
    }
    rules: {
      cardTitle: string
      cardSubtitle: string
      rectTitle: string
      rectDesc: string
      circleTitle: string
      circleDesc: string
      pillTitle: string
      pillDesc: string
    }
    banAlert: {
      title: string
      body: string
    }
  }
  colors: {
    themeOptions: Record<ThemePreference, string>
    accentOptions: Record<AccentScheme, string>
    modeCardTitle: string
    currentSchemeText: (paletteName: string, resolved: 'light' | 'dark', hex: string) => string
    accentControlLabel: string
    rippleToggleTheme: string
    rippleSwapAccent: string
    libraryCardTitle: string
    libraryCardSubtitle: string
    headings: {
      surface: string
      accents: string
      ink: string
      semantic: string
    }
    tokens: Record<string, string>
  }
  shapes: {
    categories: {
      all: string
      basic: string
      polygon: string
      scalloped: string
      organic: string
      expressive: string
    }
    variants: {
      solid: string
      soft: string
      outline: string
    }
    tones: {
      primary: string
      secondary: string
      neutral: string
    }
    cardTitle: string
    cardSubtitle: string
    inspectorDesc: (shapeId: string) => string
    morphEngineTitle: string
    morphEngineDesc: string
    morphRatioLabel: string
    targets: {
      flower: string
      heart: string
      sunny: string
      burst: string
    }
    autoCyclePause: string
    autoCycleStart: string
  }
  motion: {
    measureOptions: {
      narrow: string
      standard: string
      wide: string
    }
    raceCardTitle: string
    raceCardSubtitle: string
    raceReset: string
    raceStart: string
    decelBadge: string
    snappyBadge: string
    emphasizedBadge: string
    morphCardTitle: string
    squareCircleTitle: string
    squareCircleDesc: string
    squarePillTitle: string
    squarePillDesc: string
    measureCardTitle: string
    measureCardSubtitle: string
    measureBody1: string
    measureBody2: string
    typoCardTitle: string
    typoScale: {
      xs: string
      sm: string
      md: string
      base: string
      lg: string
    }
  }
  icons: {
    cardTitle: string
    cardSubtitle: string
    searchPlaceholder: string
    sizeLabel: string
    countBadge: (count: number) => string
    allCategories: string
    copyTitle: (name: string) => string
    copiedToast: (snippet: string) => string
  }
  buttons: {
    slideOpts: { tree: string; tiles: string; list: string }
    morphOpts: { system: string; light: string; dark: string }
    matrixTitle: string
    matrixSubtitle: string
    variantsTag: string
    primary: string
    secondary: string
    neutral: string
    outline: string
    ghost: string
    danger: string
    primaryToast: string
    secondaryToast: string
    dangerToast: string
    shapesTag: string
    morphBtn: string
    rectBtn: string
    pillBtn: string
    circleBtnTitle: string
    sizeStateTag: string
    lgBtn: string
    loadingBtn: string
    disabledBtn: string
    iconBtnCardTitle: string
    iconBtnToggleTitle: string
    iconBtnSecondaryTitle: string
    iconBtnDangerTitle: string
    iconBtnPrimaryTitle: string
    iconBtnLargeTitle: string
    iconBtnXsTitle: string
    stepperCardTitle: string
    fontSizeLabel: string
    lineHeightLabel: string
    segmentedCardTitle: string
    slidingTag: string
    morphGridTag: string
    badgeTagCardTitle: string
    badges: {
      inProgress: string
      verified: string
      pending: string
      error: string
      info: string
    }
    restoreTags: string
  }
  forms: {
    defaultBio: string
    defaultTags: string[]
    routes: {
      oral: { label: string; description: string; badge: string }
      sublingual: { label: string; description: string; badge: string }
      im: { label: string; description: string; badge: string }
      gel: { label: string; description: string }
    }
    models: {
      one_compartment: { label: string }
      two_compartment: { label: string }
      three_compartment: { label: string }
      ou_kalman: { label: string }
    }
    radios: {
      ou: { label: string; description: string }
      linear: { label: string; description: string }
    }
    toasts: {
      emptyName: string
      submitted: (name: string, date: string, time: string) => string
      filesSelected: (count: number) => string
    }
    card1Title: string
    card1Subtitle: string
    rectInputLabel: string
    rectInputPlaceholder: string
    rectInputHint: string
    pillSearchLabel: string
    pillSearchPlaceholder: string
    selectRouteLabel: string
    searchableSelectLabel: string
    tagInputLabel: string
    tagInputHint: string
    errorInputLabel: string
    errorInputPlaceholder: string
    errorInputMessage: string
    textareaLabel: string
    card2Title: string
    switch1Label: string
    switch1Desc: string
    switch2Label: string
    switch2Desc: string
    checkRegex: string
    checkAutoCollapse: string
    checkIndet: string
    weightLabel: string
    splitLabel: string
    dropTitle: string
    dropSubtitle: string
    submitBtn: string
    card3Title: string
    card3Subtitle: string
    datePickerLabel: string
    timePickerLabel: string
    dateTimePickerLabel: string
    inlineCalendarTitle: string
    dial24Title: string
    dial12Title: string
  }
  navigation: {
    actTop: { explorer: string; search: string; plans: string }
    actCenter: { lab: string; clock: string }
    actBottom: { comment: string; settings: string }
    sideGroups: {
      ch0: { label: string; meta: string; s1: string; full: string }
      ch1: { label: string; meta: string; s1: string; s2: string }
    }
    dockItems: { curve: string; records: string; calibration: string }
    barItems: { home: string; explore: string; archive: string; user: string }
    initialTabs: { curve: string; plan: string }
    newTabTitle: (index: number) => string
    subTabs: { calibration: string; inspector: string; logs: string }
    steps: {
      step1Title: string
      step1Desc: string
      step2Title: string
      step2Desc: string
      step3Title: string
      step3Desc: string
    }
    actCardTitle: string
    actCardSubtitle: string
    actExpandSwitch: string
    actCurrentSection: (id: string) => string
    actCardBody: string
    sideCardTitle: string
    sideCardSubtitle: string
    railCardTitle: string
    railCardSubtitle: string
    railCapsuleTitle: string
    railCapsuleDesc: string
    railBarTitle: string
    railBarDesc: string
    selectedBadge: (id: string) => string
    dockCardTitle: string
    dockCapsuleTitle: string
    dockCapsuleDesc: string
    dockBarTitle: string
    dockBarDesc: string
    tabsCardTitle: string
    addTabBtn: string
    breadcrumbRoot: string
    breadcrumbLeaf: string
    titleStatusCardTitle: string
    titleBarCenter: string
    progressBadge: string
    stepsCardTitle: string
    prevStep: string
    nextStep: string
  }
  gestures: {
    pullToast: (count: number) => string
    rightInspectorOpts: { layout: string; tokens: string }
    drawerActItems: { files: string; search: string }
    drawerActBottom: { settings: string }
    drawerGroup: { label: string; s1: string; s2: string; full: string }
    dockModeOpts: { unified: string; unifiedFlush: string; floatingOnly: string }
    dockNavItems: { read: string; archive: string; about: string }
    detentOpts: { docked: string; half: string; full: string }
    soloStyleOpts: { floating: string; flush: string }
    lab1: {
      title: string
      subtitle: string
      leftBtn: string
      rightBtn: string
      activeLabel: string
      leftProgress: string
      rightProgress: string
      velocityLabel: string
      drawerWidthLabel: string
      leftDrawerHead: string
      rightDrawerHead: string
      rightWidthKey: string
      openGestureKey: string
      openGestureVal: string
      closeGestureKey: string
      closeGestureVal: string
      pointerDriverKey: string
      easingKey: string
      collapseRightBtn: string
      phoneTitle: string
      rightToggleTitle: string
      bannerTitle: string
      bannerDesc: string
      sampleText: string
      toggleLeftBtn: string
      toggleRightBtn: string
    }
    lab2: {
      title: string
      subtitle: string
      heightLabel: string
      morphRateLabel: string
      insetLabel: string
      radiusLabel: string
      centerTitleUnified: (tab: string) => string
      centerTitleFlush: (tab: string) => string
      centerTitleFloating: string
      bannerRead: string
      bannerArchive: string
      bannerAbout: string
      bannerDesc: string
      sheetTitle: string
      sheetBadge: string
      currentModeLabel: string
      modeFlush: string
      modeFloating: string
      itemTitle: (i: number) => string
      itemDesc: string
    }
    lab3: {
      title: string
      subtitle: string
      styleLabel: string
      heightLabel: string
      insetLabel: string
      radiusLabel: string
      centerFloating: string
      centerFlush: string
      bannerFloatingTitle: string
      bannerFlushTitle: string
      bannerFloatingDesc: string
      bannerFlushDesc: string
      sampleText: string
      sheetTitle: string
      sheetBadge: string
      emptyTitle: string
      emptyDesc: string
      commentTitle: (i: number) => string
      commentDesc: string
    }
    splitLab: {
      title: string
      subtitle: string
      leftBtn: string
      rightBtn: string
      leftPanel: (w: number) => string
      leftDesc: string
      centerTitle: string
      scrollLine: (n: number) => string
      rightPanel: (w: number) => string
      rightDesc: string
    }
    pullLab: {
      title: string
      subtitle: string
      triggerBtn: (count: number) => string
      itemTitle: (idx: number) => string
      itemDesc: string
    }
  }
  overlays: {
    paletteItems: {
      overview: { label: string; excerpt: string; group: string }
      shapes: { label: string; excerpt: string; group: string }
      forms: { label: string; excerpt: string; group: string }
      data: { label: string; excerpt: string; group: string }
    }
    menuItems: {
      edit: string
      copy: string
      share: string
      delete: string
    }
    toasts: {
      dangerMenu: (label: string) => string
      menuAction: (label: string) => string
      toastInfo: string
      toastSuccess: string
      toastWarning: string
      toastError: string
      emptyCta: string
      popConfirm: string
      popCancel: string
      commandJump: (label: string) => string
      sheetSaved: string
      dialogConfirmed: string
      dangerConfirmed: string
    }
    sheetDialogCardTitle: string
    sheetDialogCardSubtitle: string
    openBottomSheet: string
    openRightSheet: string
    openStdDialog: string
    openDangerDialog: string
    toastCardTitle: string
    toastInfoBtn: string
    toastSuccessBtn: string
    toastWarningBtn: string
    toastErrorBtn: string
    topTooltipText: string
    bottomTooltipText: string
    rightTooltipText: string
    dropdownBtn: string
    alertCardTitle: string
    alerts: {
      infoTitle: string
      infoBody: string
      tipTitle: string
      tipBody: string
      warningTitle: string
      warningBody: string
      dangerTitle: string
      dangerBody: string
    }
    progressCardTitle: string
    progressLabel: string
    emptyCardTitle: string
    emptyTitle: string
    emptyDesc: string
    emptyCta: string
    popoverCardTitle: string
    popoverCardSubtitle: string
    popoverTitle: string
    popoverTrigger: string
    popoverBody: string
    popconfirmTitle: string
    popconfirmDesc: string
    popconfirmTrigger: string
    contextArea: string
    openCommandBtn: string
    bottomSheetTitle: string
    bottomSheetDesc: string
    bottomSheetInputLabel: string
    bottomSheetInputPlaceholder: string
    cancel: string
    save: string
    sideSheetTitle: string
    sideSheetDesc: string
    dialogTitle: string
    dialogDesc: string
    dialogBody: string
    close: string
    confirm: string
    dangerDialogTitle: string
    dangerDialogDesc: string
    dangerDialogBody: string
    confirmDelete: string
  }
  data: {
    columns: { name: string; model: string; halfLife: string; status: string }
    rows: {
      evModel: string
      evStatus: string
      oralModel: string
      oralStatus: string
      cpaModel: string
      cpaStatus: string
      p4Model: string
      p4Status: string
    }
    chart: {
      e2SeriesName: string
      e2Point1: string
      e2Point2: string
      cpaSeriesName: string
      cardTitle: string
      cardSubtitle: string
      chartTitle: string
      nowLineLabel: string
    }
    timeline: {
      item1Group: string
      item1Title: string
      item1Sub: string
      item1Badge: string
      item2Group: string
      item2Title: string
      item2Sub: string
      item2Badge: string
      item3Group: string
      item3Title: string
      item3Sub: string
      item3Badge: string
      cardTitle: string
      cardSubtitle: string
      selectToast: (title: string) => string
    }
    stats: {
      e2Title: string
      e2Subtitle: string
      e2Badge: string
      cpaTitle: string
      cpaSubtitle: string
      cpaBadge: string
    }
    tableCardTitle: string
    accordionCardTitle: string
    acc1Title: string
    acc1Body: string
    acc2Title: string
    acc2Body: string
    avatarCardTitle: string
    kbdDivider: string
    kbdCommandLabel: string
    kbdSidebarLabel: string
  }
}
