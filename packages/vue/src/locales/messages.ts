export type ValanceLocale = 'zh-CN' | 'zh-TW' | 'en' | 'ja'
export type LocalePreference = 'system' | ValanceLocale

export interface VlLocaleMessages {
  localeNames: {
    system: string
    'zh-CN': string
    'zh-TW': string
    en: string
    ja: string
  }
  common: {
    close: string
    clear: string
    confirm: string
    ok: string
    cancel: string
    done: string
    now: string
    today: string
  }
  alert: {
    closeLabel: string
  }
  colorSwatch: {
    copied: (val: string, hex: string) => string
  }
  lineChart: {
    emptyText: string
    legendTip: string
  }
  timeline: {
    emptyText: string
    allGroup: string
  }
  calendar: {
    ariaLabel: string
    prevYear: string
    prevMonth: string
    nextMonth: string
    nextYear: string
    formatYearMonth: (year: number, month: number) => string
    weekdaysMon: [string, string, string, string, string, string, string]
    weekdaysSun: [string, string, string, string, string, string, string]
    months: [string, string, string, string, string, string, string, string, string, string, string, string]
    unselected: string
  }
  datePicker: {
    placeholder: string
    clearLabel: string
    selectDate: string
  }
  dateTimePicker: {
    placeholder: string
    selectDateTime: string
  }
  timePicker: {
    placeholder: string
    selectTime: string
    selectHour: string
    selectMinute: string
    dialHourAria: string
    dialMinuteAria: string
    hourLabel: string
    minuteLabel: string
    switchToInput: string
    switchToDial: string
  }
  fileDropzone: {
    title: string
    subtitle: string
    removeFile: string
  }
  palettePicker: {
    standardTitle: string
    standardMeta: string
    lightPaperBgTitle: string
    monetTitle: string
    monetActive: string
    enableMonet: string
    pickSeedTitle: string
    pickSeedAria: string
    seedLabel: string
    seedHexAria: string
    useSeedTitle: (hex: string) => string
    harmonyLabel: string
    primaryChip: (hex: string) => string
    secondaryChip: (hex: string) => string
    surfaceChip: (hex: string) => string
    prideTitle: string
    prideMeta: (count: number) => string
    harmonies: Record<'counterpoint' | 'botanical' | 'prism', { label: string; hint: string }>
    palettes: Record<string, { name: string; subtitle: string }>
  }
  radioGroup: {
    ariaLabel: string
  }
  segmentedControl: {
    ariaLabel: string
  }
  select: {
    placeholder: string
    searchPlaceholder: string
    emptyText: string
    filterAria: string
  }
  stepper: {
    decTitle: (label: string) => string
    incTitle: (label: string) => string
  }
  tagInput: {
    placeholder: string
    maxItems: (max: number) => string
    addTagAria: string
  }
  tag: {
    removeAria: string
  }
  pullRefresh: {
    pullLabel: string
    releaseLabel: string
    refreshingLabel: string
  }
  pushDrawer: {
    leftAriaLabel: string
    rightAriaLabel: string
  }
  snapPager: {
    ariaLabel: string
  }
  splitPane: {
    leftSashTitle: string
    rightSashTitle: string
  }
  nav: {
    activityBarAria: string
    backTopAria: string
    bottomDockAria: string
    breadcrumbsAria: string
    navRailAria: string
    paginationAria: string
    prevPage: string
    nextPage: string
    sideNavAria: string
    tabBarEmpty: string
    tabBarAria: string
    closeTabTitle: string
    tabsAria: string
    titleBarLeftTitle: string
    titleBarRightTitle: string
  }
  commandPalette: {
    placeholder: string
    ariaLabel: string
    toggleRegexTitle: string
    regexSyntaxError: string
    regexErrorPrefix: string
    emptyText: string
    navHint: string
    selectHint: string
    closeHint: string
  }
  dockSheet: {
    defaultTitle: string
    ariaLabel: string
    expandTitle: string
    fullTitle: string
    collapseTitle: string
    expandPill: string
    fullPill: string
    collapsePill: string
    bottomNavAria: string
  }
  sheet: {
    toHalfAria: string
    toFullAria: string
    halfLabel: string
    fullLabel: string
  }
  iconGroups: Record<'navigation' | 'files' | 'actions' | 'status' | 'domain', string>
  shapes: Record<string, string>
}

export const VL_MESSAGES: Record<ValanceLocale, VlLocaleMessages> = {
  'zh-CN': {
    localeNames: {
      system: '跟随系统',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      en: 'English',
      ja: '日本語',
    },
    common: {
      close: '关闭',
      clear: '清空',
      confirm: '确认',
      ok: '确定',
      cancel: '取消',
      done: '完成选择',
      now: '此刻',
      today: '今天',
    },
    alert: { closeLabel: '关闭提示' },
    colorSwatch: { copied: (val, hex) => `已复制 ${val} (${hex})` },
    lineChart: {
      emptyText: '暂无可视化时序数据',
      legendTip: '滚轮缩放 · 拖拽平移 · 双击复原',
    },
    timeline: {
      emptyText: '暂无时间线记录',
      allGroup: '全部记录',
    },
    calendar: {
      ariaLabel: '自绘日历选择器',
      prevYear: '上一年',
      prevMonth: '上一月',
      nextMonth: '下一月',
      nextYear: '下一年',
      formatYearMonth: (y, m) => `${y}年 ${String(m).padStart(2, '0')}月`,
      weekdaysMon: ['一', '二', '三', '四', '五', '六', '日'],
      weekdaysSun: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      unselected: '未选择日期',
    },
    datePicker: {
      placeholder: '选择日期 (YYYY-MM-DD)',
      clearLabel: '清除日期',
      selectDate: '选择日期',
    },
    dateTimePicker: {
      placeholder: '选择日期与时间…',
      selectDateTime: '选择日期与时间',
    },
    timePicker: {
      placeholder: '选择时间…',
      selectTime: '选择时间',
      selectHour: '选择小时',
      selectMinute: '选择分钟',
      dialHourAria: '拨动时针选择小时',
      dialMinuteAria: '拨动分针选择分钟',
      hourLabel: '时 (0–23)',
      minuteLabel: '分 (0–59)',
      switchToInput: '切换数字输入',
      switchToDial: '切换表盘拨动',
    },
    fileDropzone: {
      title: '拖入文件到此处，或点击选择上传',
      subtitle: '支持 JSON、Markdown、CSV 等本地文件导入',
      removeFile: '移除文件',
    },
    palettePicker: {
      standardTitle: '高级协调配色预设',
      standardMeta: '高明度微暖白底 + 矿物冷暖主辅',
      lightPaperBgTitle: '浅色微暖纸白背景',
      monetTitle: '莫奈智能取色（双色和谐对位）',
      monetActive: '当前已启用',
      enableMonet: '启用莫奈色',
      pickSeedTitle: '选择种子颜色',
      pickSeedAria: '选择莫奈取色种子颜色',
      seedLabel: '种子',
      seedHexAria: '种子色十六进制值',
      useSeedTitle: (hex) => `使用种子 ${hex}`,
      harmonyLabel: '副色策略',
      primaryChip: (hex) => `主色 ${hex}`,
      secondaryChip: (hex) => `和谐副色 ${hex}`,
      surfaceChip: (hex) => `高明度底 ${hex}`,
      prideTitle: 'Pride 特殊配色',
      prideMeta: (count) => `${count} 套明亮骄傲旗灵感`,
      harmonies: {
        counterpoint: { label: '冷暖矿石', hint: '以沉稳矿石冷暖副色衬托主色，彻底避开红绿/紫绿俗艳撞色' },
        botanical: { label: '茶木柔搭', hint: '温润低饱和陶杏、雾蓝、鼠尾草搭配，耐看舒缓' },
        prism: { label: '晴空邻阶', hint: '同一清澄象限的阶梯邻色对位，多曲线图表高度协调' },
      },
      palettes: {
        monet: { name: '莫奈动态取色', subtitle: '动态种子协调方案' },
        valance: { name: '暖橙青碧（默认）', subtitle: '晴橙 #F9841A × 矿青 #1FA8A0' },
        crimson: { name: '绯樱靛蓝', subtitle: '朱樱 #E35B69 × 晴靛 #3F7FC2' },
        cobalt: { name: '晴空茶金', subtitle: '晴蓝 #4282E8 × 柔茶 #CE9356' },
        forest: { name: '松林暖杏', subtitle: '雪松 #2F9C76 × 陶杏 #CF8B53' },
        violet: { name: '鸢尾海蓝', subtitle: '鸢尾 #826AE8 × 云蓝 #3B9AD9' },
        rose: { name: '山茶丁香', subtitle: '山茶 #E06388 × 雾紫 #7B72CF' },
        'pride-rainbow': { name: 'Rainbow 彩虹', subtitle: '亮虹炽橙 × 晴空海蓝' },
        'pride-trans': { name: 'Transgender 跨性别', subtitle: '透亮晴蓝 × 柔润樱粉 × 极轻纸白' },
        'pride-lesbian': { name: 'Lesbian 日落', subtitle: '暖阳杏橘 × 晚霞玫紫' },
        'pride-bi': { name: 'Bisexual 双性恋', subtitle: '洋红霓粉 × 星蓝靛青' },
        'pride-pan': { name: 'Pansexual 泛性恋', subtitle: '洋红桃粉 × 晴空湖蓝' },
        'pride-nonbinary': { name: 'Non-Binary 非二元', subtitle: '紫罗兰光 × 向日琥珀' },
        'pride-ace': { name: 'Asexual 无性恋', subtitle: '暮兰紫晶 × 青石岩蓝' },
        'pride-aro': { name: 'Aromantic 无浪漫', subtitle: '春叶新绿 × 温润海青' },
        'pride-gay': { name: 'MLM 海洋青蓝', subtitle: '海盐青碧 × 琉璃靛蓝' },
      },
    },
    radioGroup: { ariaLabel: '单选组' },
    segmentedControl: { ariaLabel: '分段选择' },
    select: {
      placeholder: '请选择…',
      searchPlaceholder: '搜索选项…',
      emptyText: '无匹配选项',
      filterAria: '过滤选项',
    },
    stepper: {
      decTitle: (l) => `减小 (${l})`,
      incTitle: (l) => `增大 (${l})`,
    },
    tagInput: {
      placeholder: '输入标签后按 Enter 添加…',
      maxItems: (max) => `最多 ${max} 项`,
      addTagAria: '添加标签',
    },
    tag: { removeAria: '移除标签' },
    pullRefresh: {
      pullLabel: '下拉刷新数据',
      releaseLabel: '松开立即刷新',
      refreshingLabel: '正在同步刷新…',
    },
    pushDrawer: {
      leftAriaLabel: '左侧推挤抽屉',
      rightAriaLabel: '右侧推挤抽屉',
    },
    snapPager: { ariaLabel: '分页视图' },
    splitPane: {
      leftSashTitle: '拖动调整左侧面板宽度 · 双击重置',
      rightSashTitle: '拖动调整右侧面板宽度 · 双击重置',
    },
    nav: {
      activityBarAria: '工作台活动栏',
      backTopAria: '回到顶部',
      bottomDockAria: '底部导航栏',
      breadcrumbsAria: '面包屑导航',
      navRailAria: '竖向手势导航栏',
      paginationAria: '分页导航',
      prevPage: '上一页',
      nextPage: '下一页',
      sideNavAria: '侧边导航菜单',
      tabBarEmpty: '暂无打开的标签页',
      tabBarAria: '工作区标签页',
      closeTabTitle: '关闭标签页',
      tabsAria: '选项卡',
      titleBarLeftTitle: '显示/隐藏左侧面板',
      titleBarRightTitle: '显示/隐藏右侧面板',
    },
    commandPalette: {
      placeholder: '搜索页面、组件、章节或正则模式…',
      ariaLabel: '快捷命令搜索面板',
      toggleRegexTitle: '切换正则匹配',
      regexSyntaxError: '正则语法错误',
      regexErrorPrefix: '正则语法错误：',
      emptyText: '未找到匹配的命令或页面结果',
      navHint: '↑↓ 选择',
      selectHint: 'Enter 跳转',
      closeHint: 'Esc 关闭',
    },
    dockSheet: {
      defaultTitle: '面板',
      ariaLabel: '底部停靠展开面板',
      expandTitle: '展开面板',
      fullTitle: '全屏展开',
      collapseTitle: '收起',
      expandPill: '展开',
      fullPill: '全屏',
      collapsePill: '收起',
      bottomNavAria: '底部导航',
    },
    sheet: {
      toHalfAria: '切换半屏',
      toFullAria: '切换全高',
      halfLabel: '半屏',
      fullLabel: '全高',
    },
    iconGroups: {
      navigation: '导航与布局',
      files: '文档与视图',
      actions: '操作与交互',
      status: '状态与主题',
      domain: '科学、设备与社交',
    },
    shapes: {
      circle: '正圆',
      square: 'M3 方圆',
      slanted: '斜切方',
      arch: '拱门',
      semicircle: '半圆',
      oval: '斜椭圆',
      pill: '斜胶囊',
      triangle: '三角',
      arrow: '箭头三角',
      fan: '折扇',
      diamond: '菱形',
      clamshell: '贝壳',
      pentagon: '五边形',
      gem: '宝石',
      'very-sunny': '八芒晴日',
      sunny: '柔芒太阳',
      'cookie-4': '四瓣曲奇',
      'cookie-6': '六瓣曲奇',
      'cookie-7': '七瓣曲奇',
      'cookie-9': '九瓣曲奇',
      'cookie-12': '十二瓣曲奇',
      'clover-4': '四叶草',
      'clover-8': '八叶草',
      burst: '星芒爆发',
      'soft-burst': '柔角星爆',
      boom: '尖峰辐射',
      'soft-boom': '绒花辐射',
      flower: '繁花',
      puffy: '蓬松云朵',
      'puffy-diamond': '蓬松菱花',
      ghost: '波浪幽灵',
      'pixel-circle': '像素圆',
      'pixel-triangle': '像素三角',
      bun: '双层软包',
      heart: '爱心',
      rect: '标准直角',
    },
  },

  'zh-TW': {
    localeNames: {
      system: '跟隨系統',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      en: 'English',
      ja: '日本語',
    },
    common: {
      close: '關閉',
      clear: '清空',
      confirm: '確認',
      ok: '確定',
      cancel: '取消',
      done: '完成選擇',
      now: '此刻',
      today: '今天',
    },
    alert: { closeLabel: '關閉提示' },
    colorSwatch: { copied: (val, hex) => `已複製 ${val} (${hex})` },
    lineChart: {
      emptyText: '暫無視覺化時序資料',
      legendTip: '滾輪縮放 · 拖曳平移 · 雙擊還原',
    },
    timeline: {
      emptyText: '暫無時間軸記錄',
      allGroup: '全部記錄',
    },
    calendar: {
      ariaLabel: '自繪日曆選擇器',
      prevYear: '上一年',
      prevMonth: '上一月',
      nextMonth: '下一月',
      nextYear: '下一年',
      formatYearMonth: (y, m) => `${y}年 ${String(m).padStart(2, '0')}月`,
      weekdaysMon: ['一', '二', '三', '四', '五', '六', '日'],
      weekdaysSun: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      unselected: '未選擇日期',
    },
    datePicker: {
      placeholder: '選擇日期 (YYYY-MM-DD)',
      clearLabel: '清除日期',
      selectDate: '選擇日期',
    },
    dateTimePicker: {
      placeholder: '選擇日期與時間…',
      selectDateTime: '選擇日期與時間',
    },
    timePicker: {
      placeholder: '選擇時間…',
      selectTime: '選擇時間',
      selectHour: '選擇小時',
      selectMinute: '選擇分鐘',
      dialHourAria: '撥動時針選擇小時',
      dialMinuteAria: '撥動分針選擇分鐘',
      hourLabel: '時 (0–23)',
      minuteLabel: '分 (0–59)',
      switchToInput: '切換數字輸入',
      switchToDial: '切換錶盤撥動',
    },
    fileDropzone: {
      title: '拖入檔案至此處，或點擊選擇上傳',
      subtitle: '支援 JSON、Markdown、CSV 等本地檔案匯入',
      removeFile: '移除檔案',
    },
    palettePicker: {
      standardTitle: '高階協調配色預設',
      standardMeta: '高明度微暖白底 + 礦物冷暖主輔',
      lightPaperBgTitle: '淺色微暖紙白背景',
      monetTitle: '莫內智慧取色（雙色和諧對位）',
      monetActive: '目前已啟用',
      enableMonet: '啟用莫內色',
      pickSeedTitle: '選擇種子顏色',
      pickSeedAria: '選擇莫內取色種子顏色',
      seedLabel: '種子',
      seedHexAria: '種子色十六進位值',
      useSeedTitle: (hex) => `使用種子 ${hex}`,
      harmonyLabel: '副色策略',
      primaryChip: (hex) => `主色 ${hex}`,
      secondaryChip: (hex) => `和諧副色 ${hex}`,
      surfaceChip: (hex) => `高明度底 ${hex}`,
      prideTitle: 'Pride 特殊配色',
      prideMeta: (count) => `${count} 套明亮驕傲旗靈感`,
      harmonies: {
        counterpoint: { label: '冷暖礦石', hint: '以沉穩礦石冷暖副色襯托主色，徹底避開紅綠/紫綠俗豔撞色' },
        botanical: { label: '茶木柔搭', hint: '溫潤低飽和陶杏、霧藍、鼠尾草搭配，耐看舒緩' },
        prism: { label: '晴空鄰階', hint: '同一清澄象限的階梯鄰色對位，多曲線圖表高度協調' },
      },
      palettes: {
        monet: { name: '莫內動態取色', subtitle: '動態種子協調方案' },
        valance: { name: '暖橙青碧（預設）', subtitle: '晴橙 #F9841A × 礦青 #1FA8A0' },
        crimson: { name: '緋櫻靛藍', subtitle: '朱櫻 #E35B69 × 晴靛 #3F7FC2' },
        cobalt: { name: '晴空茶金', subtitle: '晴藍 #4282E8 × 柔茶 #CE9356' },
        forest: { name: '松林暖杏', subtitle: '雪松 #2F9C76 × 陶杏 #CF8B53' },
        violet: { name: '鳶尾海藍', subtitle: '鳶尾 #826AE8 × 雲藍 #3B9AD9' },
        rose: { name: '山茶丁香', subtitle: '山茶 #E06388 × 霧紫 #7B72CF' },
        'pride-rainbow': { name: 'Rainbow 彩虹', subtitle: '亮虹熾橙 × 晴空海藍' },
        'pride-trans': { name: 'Transgender 跨性別', subtitle: '透亮晴藍 × 柔潤櫻粉 × 極輕紙白' },
        'pride-lesbian': { name: 'Lesbian 日落', subtitle: '暖陽杏橘 × 晚霞玫紫' },
        'pride-bi': { name: 'Bisexual 雙性戀', subtitle: '洋紅霓粉 × 星藍靛青' },
        'pride-pan': { name: 'Pansexual 泛性戀', subtitle: '洋紅桃粉 × 晴空湖藍' },
        'pride-nonbinary': { name: 'Non-Binary 非二元', subtitle: '紫羅蘭光 × 向日琥珀' },
        'pride-ace': { name: 'Asexual 無性戀', subtitle: '暮蘭紫晶 × 青石岩藍' },
        'pride-aro': { name: 'Aromantic 無浪漫', subtitle: '春葉新綠 × 溫潤海青' },
        'pride-gay': { name: 'MLM 海洋青藍', subtitle: '海鹽青碧 × 琉璃靛藍' },
      },
    },
    radioGroup: { ariaLabel: '單選組' },
    segmentedControl: { ariaLabel: '分段選擇' },
    select: {
      placeholder: '請選擇…',
      searchPlaceholder: '搜尋選項…',
      emptyText: '無符合選項',
      filterAria: '過濾選項',
    },
    stepper: {
      decTitle: (l) => `減小 (${l})`,
      incTitle: (l) => `增大 (${l})`,
    },
    tagInput: {
      placeholder: '輸入標籤後按 Enter 新增…',
      maxItems: (max) => `最多 ${max} 項`,
      addTagAria: '新增標籤',
    },
    tag: { removeAria: '移除標籤' },
    pullRefresh: {
      pullLabel: '下拉重新整理資料',
      releaseLabel: '放開立即重新整理',
      refreshingLabel: '正在同步重新整理…',
    },
    pushDrawer: {
      leftAriaLabel: '左側推擠抽屜',
      rightAriaLabel: '右側推擠抽屜',
    },
    snapPager: { ariaLabel: '分頁檢視' },
    splitPane: {
      leftSashTitle: '拖動調整左側面板寬度 · 雙擊重設',
      rightSashTitle: '拖動調整右側面板寬度 · 雙擊重設',
    },
    nav: {
      activityBarAria: '工作台活動列',
      backTopAria: '回到頂部',
      bottomDockAria: '底部導覽列',
      breadcrumbsAria: '麵包屑導覽',
      navRailAria: '直向手勢導覽列',
      paginationAria: '分頁導覽',
      prevPage: '上一頁',
      nextPage: '下一頁',
      sideNavAria: '側邊導覽選單',
      tabBarEmpty: '暫無開啟的分頁',
      tabBarAria: '工作區分頁',
      closeTabTitle: '關閉分頁',
      tabsAria: '頁籤',
      titleBarLeftTitle: '顯示/隱藏左側面板',
      titleBarRightTitle: '顯示/隱藏右側面板',
    },
    commandPalette: {
      placeholder: '搜尋頁面、元件、章節或正則表達式…',
      ariaLabel: '快捷指令搜尋面板',
      toggleRegexTitle: '切換正則匹配',
      regexSyntaxError: '正則語法錯誤',
      regexErrorPrefix: '正則語法錯誤：',
      emptyText: '找不到符合的指令或頁面結果',
      navHint: '↑↓ 選擇',
      selectHint: 'Enter 跳轉',
      closeHint: 'Esc 關閉',
    },
    dockSheet: {
      defaultTitle: '面板',
      ariaLabel: '底部停靠展開面板',
      expandTitle: '展開面板',
      fullTitle: '全螢幕展開',
      collapseTitle: '收合',
      expandPill: '展開',
      fullPill: '全螢幕',
      collapsePill: '收合',
      bottomNavAria: '底部導覽',
    },
    sheet: {
      toHalfAria: '切換半螢幕',
      toFullAria: '切換全高',
      halfLabel: '半螢幕',
      fullLabel: '全高',
    },
    iconGroups: {
      navigation: '導覽與版面',
      files: '文件與檢視',
      actions: '操作與互動',
      status: '狀態與主題',
      domain: '科學、裝置與社群',
    },
    shapes: {
      circle: '正圓',
      square: 'M3 方圓',
      slanted: '斜切方',
      arch: '拱門',
      semicircle: '半圓',
      oval: '斜橢圓',
      pill: '斜膠囊',
      triangle: '三角',
      arrow: '箭頭三角',
      fan: '折扇',
      diamond: '菱形',
      clamshell: '貝殼',
      pentagon: '五邊形',
      gem: '寶石',
      'very-sunny': '八芒晴日',
      sunny: '柔芒太陽',
      'cookie-4': '四瓣曲奇',
      'cookie-6': '六瓣曲奇',
      'cookie-7': '七瓣曲奇',
      'cookie-9': '九瓣曲奇',
      'cookie-12': '十二瓣曲奇',
      'clover-4': '四葉草',
      'clover-8': '八葉草',
      burst: '星芒爆發',
      'soft-burst': '柔角星爆',
      boom: '尖峰輻射',
      'soft-boom': '絨花輻射',
      flower: '繁花',
      puffy: '蓬鬆雲朵',
      'puffy-diamond': '蓬鬆菱花',
      ghost: '波浪幽靈',
      'pixel-circle': '像素圓',
      'pixel-triangle': '像素三角',
      bun: '雙層軟包',
      heart: '愛心',
      rect: '標準直角',
    },
  },

  en: {
    localeNames: {
      system: 'System',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      en: 'English',
      ja: '日本語',
    },
    common: {
      close: 'Close',
      clear: 'Clear',
      confirm: 'Confirm',
      ok: 'OK',
      cancel: 'Cancel',
      done: 'Done',
      now: 'Now',
      today: 'Today',
    },
    alert: { closeLabel: 'Dismiss alert' },
    colorSwatch: { copied: (val, hex) => `Copied ${val} (${hex})` },
    lineChart: {
      emptyText: 'No time-series data yet',
      legendTip: 'Wheel to zoom · Drag to pan · Double-click to reset',
    },
    timeline: {
      emptyText: 'No timeline records',
      allGroup: 'All Records',
    },
    calendar: {
      ariaLabel: 'Calendar date picker',
      prevYear: 'Previous year',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      nextYear: 'Next year',
      formatYearMonth: (y, m) => `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] ?? m} ${y}`,
      weekdaysMon: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      weekdaysSun: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      unselected: 'No date selected',
    },
    datePicker: {
      placeholder: 'Select date (YYYY-MM-DD)',
      clearLabel: 'Clear date',
      selectDate: 'Select Date',
    },
    dateTimePicker: {
      placeholder: 'Select date & time…',
      selectDateTime: 'Select Date & Time',
    },
    timePicker: {
      placeholder: 'Select time…',
      selectTime: 'Select Time',
      selectHour: 'Select hour',
      selectMinute: 'Select minute',
      dialHourAria: 'Drag dial hand to pick hour',
      dialMinuteAria: 'Drag dial hand to pick minute',
      hourLabel: 'Hour (0–23)',
      minuteLabel: 'Min (0–59)',
      switchToInput: 'Switch to numeric input',
      switchToDial: 'Switch to analog dial',
    },
    fileDropzone: {
      title: 'Drop files here, or click to upload',
      subtitle: 'Supports JSON, Markdown, CSV and local files',
      removeFile: 'Remove file',
    },
    palettePicker: {
      standardTitle: 'Curated Palette Presets',
      standardMeta: 'Warm rice-paper light base + mineral pairs',
      lightPaperBgTitle: 'Warm off-white paper background',
      monetTitle: 'Monet Dynamic Palette (Harmonized Pair)',
      monetActive: 'Active',
      enableMonet: 'Enable Monet',
      pickSeedTitle: 'Pick seed color',
      pickSeedAria: 'Pick Monet palette seed color',
      seedLabel: 'Seed',
      seedHexAria: 'Seed color hex value',
      useSeedTitle: (hex) => `Use seed ${hex}`,
      harmonyLabel: 'Harmony',
      primaryChip: (hex) => `Primary ${hex}`,
      secondaryChip: (hex) => `Secondary ${hex}`,
      surfaceChip: (hex) => `Surface ${hex}`,
      prideTitle: 'Pride Palettes',
      prideMeta: (count) => `${count} vibrant Pride palettes`,
      harmonies: {
        counterpoint: { label: 'Mineral', hint: 'Balanced cool/warm mineral complement avoiding harsh contrasts' },
        botanical: { label: 'Botanical', hint: 'Soft muted terracotta, mist blue, and sage tones' },
        prism: { label: 'Adjacent', hint: 'Harmonic adjacent quadrant hues for multi-series readability' },
      },
      palettes: {
        monet: { name: 'Monet Dynamic', subtitle: 'Seed-derived harmony' },
        valance: { name: 'Amber & Teal (Default)', subtitle: 'Sun Amber #F9841A × Mineral Teal #1FA8A0' },
        crimson: { name: 'Crimson & Indigo', subtitle: 'Vermilion #E35B69 × Cobalt Indigo #3F7FC2' },
        cobalt: { name: 'Azure & Tea Gold', subtitle: 'Sky Azure #4282E8 × Tea Gold #CE9356' },
        forest: { name: 'Cedar & Apricot', subtitle: 'Pine #2F9C76 × Warm Apricot #CF8B53' },
        violet: { name: 'Iris & Cerulean', subtitle: 'Iris #826AE8 × Cloud Blue #3B9AD9' },
        rose: { name: 'Camellia & Lilac', subtitle: 'Camellia #E06388 × Mist Violet #7B72CF' },
        'pride-rainbow': { name: 'Rainbow', subtitle: 'Radiant Coral × Clear Azure' },
        'pride-trans': { name: 'Transgender', subtitle: 'Translucent Sky × Soft Sakura × Warm Paper' },
        'pride-lesbian': { name: 'Lesbian Sunset', subtitle: 'Warm Tangerine × Dusk Rose' },
        'pride-bi': { name: 'Bisexual', subtitle: 'Neon Magenta × Indigo Azure' },
        'pride-pan': { name: 'Pansexual', subtitle: 'Bright Pink × Clear Cyan' },
        'pride-nonbinary': { name: 'Non-Binary', subtitle: 'Iris Violet × Sunflower Amber' },
        'pride-ace': { name: 'Asexual', subtitle: 'Twilight Amethyst × Slate Blue' },
        'pride-aro': { name: 'Aromantic', subtitle: 'Spring Leaf × Marine Teal' },
        'pride-gay': { name: 'MLM Ocean', subtitle: 'Sea Salt Teal × Lapis Indigo' },
      },
    },
    radioGroup: { ariaLabel: 'Radio group' },
    segmentedControl: { ariaLabel: 'Segmented control' },
    select: {
      placeholder: 'Select…',
      searchPlaceholder: 'Search options…',
      emptyText: 'No matching options',
      filterAria: 'Filter options',
    },
    stepper: {
      decTitle: (l) => `Decrease (${l})`,
      incTitle: (l) => `Increase (${l})`,
    },
    tagInput: {
      placeholder: 'Type tag and press Enter…',
      maxItems: (max) => `Max ${max} items`,
      addTagAria: 'Add tag',
    },
    tag: { removeAria: 'Remove tag' },
    pullRefresh: {
      pullLabel: 'Pull down to refresh',
      releaseLabel: 'Release to refresh',
      refreshingLabel: 'Refreshing…',
    },
    pushDrawer: {
      leftAriaLabel: 'Left push drawer',
      rightAriaLabel: 'Right push drawer',
    },
    snapPager: { ariaLabel: 'Paged view' },
    splitPane: {
      leftSashTitle: 'Drag to resize left panel · Double-click to reset',
      rightSashTitle: 'Drag to resize right panel · Double-click to reset',
    },
    nav: {
      activityBarAria: 'Activity bar',
      backTopAria: 'Back to top',
      bottomDockAria: 'Bottom navigation bar',
      breadcrumbsAria: 'Breadcrumbs',
      navRailAria: 'Vertical navigation rail',
      paginationAria: 'Pagination',
      prevPage: 'Prev',
      nextPage: 'Next',
      sideNavAria: 'Sidebar menu',
      tabBarEmpty: 'No open tabs',
      tabBarAria: 'Workspace tabs',
      closeTabTitle: 'Close tab',
      tabsAria: 'Tabs',
      titleBarLeftTitle: 'Toggle left panel',
      titleBarRightTitle: 'Toggle right panel',
    },
    commandPalette: {
      placeholder: 'Search views, components, or regex…',
      ariaLabel: 'Command palette',
      toggleRegexTitle: 'Toggle regex matching',
      regexSyntaxError: 'Invalid regex syntax',
      regexErrorPrefix: 'Regex error: ',
      emptyText: 'No matching commands or pages',
      navHint: '↑↓ Select',
      selectHint: 'Enter Open',
      closeHint: 'Esc Close',
    },
    dockSheet: {
      defaultTitle: 'Sheet',
      ariaLabel: 'Bottom dockable sheet',
      expandTitle: 'Expand sheet',
      fullTitle: 'Expand full height',
      collapseTitle: 'Collapse',
      expandPill: 'Expand',
      fullPill: 'Full',
      collapsePill: 'Close',
      bottomNavAria: 'Bottom navigation',
    },
    sheet: {
      toHalfAria: 'Switch to half height',
      toFullAria: 'Switch to full height',
      halfLabel: 'Half',
      fullLabel: 'Full',
    },
    iconGroups: {
      navigation: 'Navigation & Layout',
      files: 'Docs & Views',
      actions: 'Actions & Controls',
      status: 'Status & Theme',
      domain: 'Science, Devices & Social',
    },
    shapes: {
      circle: 'Circle',
      square: 'M3 Squircle',
      slanted: 'Slanted',
      arch: 'Arch',
      semicircle: 'Semicircle',
      oval: 'Oval',
      pill: 'Tilted Pill',
      triangle: 'Triangle',
      arrow: 'Arrow',
      fan: 'Fan',
      diamond: 'Diamond',
      clamshell: 'Clamshell',
      pentagon: 'Pentagon',
      gem: 'Gem',
      'very-sunny': 'Very Sunny',
      sunny: 'Sunny',
      'cookie-4': '4-Sided Cookie',
      'cookie-6': '6-Sided Cookie',
      'cookie-7': '7-Sided Cookie',
      'cookie-9': '9-Sided Cookie',
      'cookie-12': '12-Sided Cookie',
      'clover-4': '4-Leaf Clover',
      'clover-8': '8-Leaf Clover',
      burst: 'Burst',
      'soft-burst': 'Soft Burst',
      boom: 'Boom',
      'soft-boom': 'Soft Boom',
      flower: 'Flower',
      puffy: 'Puffy Cloud',
      'puffy-diamond': 'Puffy Diamond',
      ghost: 'Ghost',
      'pixel-circle': 'Pixel Circle',
      'pixel-triangle': 'Pixel Triangle',
      bun: 'Bun',
      heart: 'Heart',
      rect: 'Canonical Rect',
    },
  },

  ja: {
    localeNames: {
      system: 'システムに従う',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      en: 'English',
      ja: '日本語',
    },
    common: {
      close: '閉じる',
      clear: 'クリア',
      confirm: '確認',
      ok: '決定',
      cancel: 'キャンセル',
      done: '完了',
      now: '現在',
      today: '今日',
    },
    alert: { closeLabel: '通知を閉じる' },
    colorSwatch: { copied: (val, hex) => `${val} (${hex}) をコピーしました` },
    lineChart: {
      emptyText: '時系列データがありません',
      legendTip: 'ホイールで拡大・ドラッグで移動・ダブルクリックでリセット',
    },
    timeline: {
      emptyText: 'タイムライン記録がありません',
      allGroup: 'すべて',
    },
    calendar: {
      ariaLabel: 'カレンダー選択',
      prevYear: '前年',
      prevMonth: '前月',
      nextMonth: '翌月',
      nextYear: '翌年',
      formatYearMonth: (y, m) => `${y}年 ${String(m).padStart(2, '0')}月`,
      weekdaysMon: ['月', '火', '水', '木', '金', '土', '日'],
      weekdaysSun: ['日', '月', '火', '水', '木', '金', '土'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      unselected: '日付未選択',
    },
    datePicker: {
      placeholder: '日付を選択 (YYYY-MM-DD)',
      clearLabel: '日付をクリア',
      selectDate: '日付を選択',
    },
    dateTimePicker: {
      placeholder: '日時を選択…',
      selectDateTime: '日時を選択',
    },
    timePicker: {
      placeholder: '時刻を選択…',
      selectTime: '時刻を選択',
      selectHour: '時を選択',
      selectMinute: '分を選択',
      dialHourAria: '文字盤で時を選択',
      dialMinuteAria: '文字盤で分を選択',
      hourLabel: '時 (0–23)',
      minuteLabel: '分 (0–59)',
      switchToInput: '数値入力に切替',
      switchToDial: 'ダイヤル入力に切替',
    },
    fileDropzone: {
      title: 'ここにファイルをドロップ、またはクリックしてアップロード',
      subtitle: 'JSON・Markdown・CSV などのローカルファイルに対応',
      removeFile: 'ファイルを削除',
    },
    palettePicker: {
      standardTitle: '厳選カラープリセット',
      standardMeta: '高明度ウォームペーパー＋ミネラル配色',
      lightPaperBgTitle: 'ウォームペーパーライト背景',
      monetTitle: 'モネ動的配色（調和ペア）',
      monetActive: '有効中',
      enableMonet: 'モネ配色を有効化',
      pickSeedTitle: 'シードカラーを選択',
      pickSeedAria: 'モネ配色のシードカラーを選択',
      seedLabel: 'シード',
      seedHexAria: 'シード色の HEX 値',
      useSeedTitle: (hex) => `シード ${hex} を使用`,
      harmonyLabel: '調和ルール',
      primaryChip: (hex) => `メイン ${hex}`,
      secondaryChip: (hex) => `アクセント ${hex}`,
      surfaceChip: (hex) => `ベース ${hex}`,
      prideTitle: 'Pride スペシャル配色',
      prideMeta: (count) => `${count} 種のブライトプライドパレット`,
      harmonies: {
        counterpoint: { label: 'ミネラル', hint: '落ち着いた寒暖ミネラル補色でコントラストを整えます' },
        botanical: { label: 'ボタニカル', hint: '低彩度テラコッタ・ミストブルー・セージの柔らかな組み合わせ' },
        prism: { label: '隣接調和', hint: '同象限の隣接色相で複数系列チャートを見やすく構成' },
      },
      palettes: {
        monet: { name: 'モネ動的配色', subtitle: 'シード連動ハーモニー' },
        valance: { name: 'アンバー × ティール（既定）', subtitle: '晴橙 #F9841A × 鉱青 #1FA8A0' },
        crimson: { name: '緋桜 × インディゴ', subtitle: '朱桜 #E35B69 × 晴藍 #3F7FC2' },
        cobalt: { name: '晴空 × ティーゴールド', subtitle: '晴青 #4282E8 × 柔茶 #CE9356' },
        forest: { name: '松林 × アプリコット', subtitle: '雪松 #2F9C76 × 陶杏 #CF8B53' },
        violet: { name: 'アイリス × スカイブルー', subtitle: '鳶尾 #826AE8 × 雲青 #3B9AD9' },
        rose: { name: 'カメリア × ライラック', subtitle: '山茶 #E06388 × 霧紫 #7B72CF' },
        'pride-rainbow': { name: 'Rainbow レインボー', subtitle: 'ブライトコーラル × スカイブルー' },
        'pride-trans': { name: 'Transgender トランスジェンダー', subtitle: 'クリアブルー × さくらピンク × 紙白' },
        'pride-lesbian': { name: 'Lesbian サンセット', subtitle: 'アプリコット × ダスクローズ' },
        'pride-bi': { name: 'Bisexual バイセクシュアル', subtitle: 'ネオンマゼンタ × インディゴ' },
        'pride-pan': { name: 'Pansexual パンセクシュアル', subtitle: 'ブライトピンク × シアンブルー' },
        'pride-nonbinary': { name: 'Non-Binary ノンバイナリー', subtitle: 'バイオレット × サンフラワー' },
        'pride-ace': { name: 'Asexual アセクシュアル', subtitle: 'アメジスト × スレートブルー' },
        'pride-aro': { name: 'Aromantic アロマンティック', subtitle: 'リーフグリーン × マリンティール' },
        'pride-gay': { name: 'MLM オーシャン', subtitle: 'シーティール × ラピスブルー' },
      },
    },
    radioGroup: { ariaLabel: 'ラジオグループ' },
    segmentedControl: { ariaLabel: 'セグメント切替' },
    select: {
      placeholder: '選択してください…',
      searchPlaceholder: '選択肢を検索…',
      emptyText: '一致する項目がありません',
      filterAria: '選択肢を絞り込み',
    },
    stepper: {
      decTitle: (l) => `減らす (${l})`,
      incTitle: (l) => `増やす (${l})`,
    },
    tagInput: {
      placeholder: 'タグを入力して Enter で追加…',
      maxItems: (max) => `最大 ${max} 件`,
      addTagAria: 'タグを追加',
    },
    tag: { removeAria: 'タグを削除' },
    pullRefresh: {
      pullLabel: '下に引いて更新',
      releaseLabel: '離してすぐ更新',
      refreshingLabel: '更新中…',
    },
    pushDrawer: {
      leftAriaLabel: '左スライドドロワー',
      rightAriaLabel: '右スライドドロワー',
    },
    snapPager: { ariaLabel: 'ページビュー' },
    splitPane: {
      leftSashTitle: 'ドラッグで左パネル幅を調整 · ダブルクリックでリセット',
      rightSashTitle: 'ドラッグで右パネル幅を調整 · ダブルクリックでリセット',
    },
    nav: {
      activityBarAria: 'アクティビティバー',
      backTopAria: 'トップへ戻る',
      bottomDockAria: 'ボトムナビゲーション',
      breadcrumbsAria: 'パンくずリスト',
      navRailAria: '縦型ナビゲーションレール',
      paginationAria: 'ページネーション',
      prevPage: '前へ',
      nextPage: '次へ',
      sideNavAria: 'サイドメニュー',
      tabBarEmpty: '開いているタブはありません',
      tabBarAria: 'ワークスペースタブ',
      closeTabTitle: 'タブを閉じる',
      tabsAria: 'タブ',
      titleBarLeftTitle: '左パネルを表示/非表示',
      titleBarRightTitle: '右パネルを表示/非表示',
    },
    commandPalette: {
      placeholder: 'ページ・コンポーネント・正規表現を検索…',
      ariaLabel: 'コマンドパレット',
      toggleRegexTitle: '正規表現切替',
      regexSyntaxError: '正規表現の構文エラー',
      regexErrorPrefix: '構文エラー：',
      emptyText: '一致する結果が見つかりません',
      navHint: '↑↓ 選択',
      selectHint: 'Enter 移動',
      closeHint: 'Esc 閉じる',
    },
    dockSheet: {
      defaultTitle: 'パネル',
      ariaLabel: 'ドック式ボトムシート',
      expandTitle: '展開',
      fullTitle: '全画面展開',
      collapseTitle: '閉じる',
      expandPill: '展開',
      fullPill: '全画面',
      collapsePill: '閉じる',
      bottomNavAria: 'ボトムナビ',
    },
    sheet: {
      toHalfAria: 'ハーフサイズに切替',
      toFullAria: 'フルサイズに切替',
      halfLabel: '半画面',
      fullLabel: '全高',
    },
    iconGroups: {
      navigation: 'ナビゲーション・配置',
      files: 'ドキュメント・表示',
      actions: '操作・インタラクション',
      status: 'ステータス・テーマ',
      domain: '科学・デバイス・ソーシャル',
    },
    shapes: {
      circle: '正円',
      square: 'M3 スクワークル',
      slanted: 'スラント',
      arch: 'アーチ',
      semicircle: '半円',
      oval: '斜め楕円',
      pill: '斜めピル',
      triangle: '三角',
      arrow: '矢印三角',
      fan: '扇形',
      diamond: 'ひし形',
      clamshell: 'シェル',
      pentagon: '五角形',
      gem: 'ジェム',
      'very-sunny': '八芒サン',
      sunny: 'ソフトサン',
      'cookie-4': '4弁クッキー',
      'cookie-6': '6弁クッキー',
      'cookie-7': '7弁クッキー',
      'cookie-9': '9弁クッキー',
      'cookie-12': '12弁クッキー',
      'clover-4': '四つ葉クローバー',
      'clover-8': '八つ葉クローバー',
      burst: 'バースト',
      'soft-burst': 'ソフトバースト',
      boom: 'ブーム',
      'soft-boom': 'ソフトブーム',
      flower: 'フラワー',
      puffy: 'クラウド',
      'puffy-diamond': 'フラワードット',
      ghost: 'ゴースト',
      'pixel-circle': 'ピクセル円',
      'pixel-triangle': 'ピクセル三角',
      bun: 'ダブルバン',
      heart: 'ハート',
      rect: '標準矩形',
    },
  },
}
