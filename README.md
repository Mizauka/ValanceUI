# Valance UI (`@valance-ui/*`)

基于 **CatsOnPlains** 与 **The-Valence-Project** 提炼而成的普适 **Vue 3 扁平几何 + M3 Expressive 设计系统、组件库、交互演示台、VitePress 主题与博客模板**。

- **在线演示（GitHub Pages）**：
  - 组件库与设计规范交互演示：`https://mizauka.github.io/ValanceUI/`
  - VitePress 博客模板预览：`https://mizauka.github.io/ValanceUI/blog/`

---

## 核心设计规范

### 1. 严格几何轮廓体系与零阴影原则
- **基础三大几何形态**：
  1. **纯直角矩形**（`border-radius: 0px` / `.shape-rect`）
  2. **纯正圆形**（宽高相等、动画态严格使用精确 `px` 圆角半径避免 `% -> px` 突变）
  3. **纯胶囊形**（曲率严格等于窄边一半 `calc(height / 2)`，严禁在动画态使用 `9999px`）
- **Material 3 Expressive 35 种矢量几何图形（`VlShape` / `m3Shapes.ts`）**：涵盖 `circle`, `square`, `slanted`, `arch`, `semicircle`, `oval`, `pill`, `triangle`, `arrow`, `fan`, `diamond`, `clamshell`, `pentagon`, `gem`, `very-sunny`, `sunny`, `cookie-4/6/7/9/12`, `clover-4/8`, `burst`, `soft-burst`, `boom`, `soft-boom`, `flower`, `puffy`, `puffy-diamond`, `ghost`, `pixel-circle`, `pixel-triangle`, `bun`, `heart` 及 72 顶点重采样平滑形变引擎（`morphM3ShapePath`），同时**严禁中等圆角矩形（`4px–12px`）与一切 `box-shadow` / `drop-shadow` / `text-shadow`**。
- **统一基础控件高度**：桌面端默认 `--ui-row-height: 34px`、移动端流体自适应；搜索框可选胶囊、普通输入框与自绘下拉触发器保持直角，所有基础输入与分段控件高度一致。

### 2. 明亮主题与和谐冷暖取色引擎
- **Bright Rice-White**（`#FDFCF9`，高明度近纯白 `L* > 90` 非 `#FFFFFF`）与 **Dark Cool Slate Charcoal**（`#273033`），搭配 CSS View Transition 圆形扩散动画（`useThemeMode`）。
- **明亮多主题色库**：
  - **6 套明亮预设**：暖橙晴青（默认 `#FA871E` × `#1EB5A8`）、珊瑚晴翠、晴空金盏、青梅紫藤、星薰薄荷、樱桃天水。
  - **莫奈智能对位取色（`generateMonetPalette`）**：提供「冷暖对位 (`counterpoint`) / 自然植系 (`botanical`) / 晶透棱镜 (`prism`)」三种分扇区平滑对位算法，提取明亮高饱和度主副强调色并满足 WCAG 对比度。
  - **9 套 Pride 特殊配色**：Rainbow、Transgender、Lesbian、Bisexual、Pansexual、Non-Binary、Asexual、Aromantic、MLM 海洋青蓝。

### 3. 动效、手势与类安卓返回栈
- **柔和 Material 动效与 3 套固定界面切换预设**：
  - Preset 1 横向无缝纯位移（`vl-slide-h-next/prev`）：移动端底栏与小幅横向切换；
  - Preset 2 纯淡入淡出（`vl-fade`）；
  - Preset 3 位移 + 淡入淡出（`vl-slide-fade-v-*` / `vl-slide-fade-h-*`）：桌面端工作台侧边栏切换。
- **双模式侧面导航 + 物理手势**：
  - **工作台活动栏 `VlActivityBar`**：无拖拽干扰、纯点击 0px 正方↔正圆变形与分组对齐；
  - **竖向手势导航栏 `VlNavRail`** 与 **底部导航栏 `VlBottomDock`**：支持浮动胶囊与固定贴边栏双形态、按下即刻滑向目标项、二维向量渐近微位移跟随、容器与色块双层级缩放、`±12px` 有上限弹性微越界及 `>= 45%` 几何覆盖反色检测；
  - **二合一停靠面板 `VlDockSheet`**：同心圆角与三边等距留白、`docked / half / full` 三挡拖拽；
  - **挤压式侧边栏 `VlPushDrawer`** 与 **下拉刷新 `VlPullRefresh`**：自动排除可聚焦元素、分屏手柄、嵌套抽屉与桌面端鼠标框选文字；移动端内置 0ms 延迟触摸圆角反馈。
- **类安卓统一返回栈（`useBackNavigation` / `useBackHandler`）**：按优先级与 LIFO 顺序统一拦截 `popstate`、鼠标侧键（`button === 3`）、`BrowserBack` / `Alt+ArrowLeft` 及自定义原生桥接事件 `valance:back`，便于直接打包 Electron / Tauri / Android WebView。

---

## Monorepo 结构

| 包 / 应用 | 路径 | 说明 |
|---|---|---|
| `@valance-ui/vue` | `packages/vue` | 核心 Vue 3 组件库（63+ 组件、88 个几何 SVG 图标、35 种 M3E 矢量图形、8 个 Composables、Monet/Pride 取色引擎） |
| `@valance-ui/vitepress-theme` | `packages/vitepress-theme` | VitePress 扁平几何工作台 & 博客主题（含 Node 安全入口 `@valance-ui/vitepress-theme/config`） |
| `@valance-ui/demo` | `apps/demo` | 设计系统与组件交互式演示应用（11 个专题视图 + `Ctrl+K` 命令搜索面板） |
| `@valance-ui/blog-template` | `apps/blog-template` | 使用 `@valance-ui/vitepress-theme` 构建的 VitePress 博客网站模板 |

---

## 本地开发与构建

```bash
pnpm install
pnpm dev:demo     # 启动组件规范演示站 (http://localhost:5174)
pnpm dev:blog     # 启动 VitePress 博客模板
pnpm test         # 运行 Vitest 单元测试
pnpm build        # 构建组件库、主题、Demo 与博客模板
pnpm typecheck    # 全仓库 TypeScript 类型检查
```

## GitHub Actions & Pages

- **CI（`.github/workflows/ci.yml`）**：每次 Push / PR 自动执行 `pnpm test`、`pnpm build` 与 `pnpm typecheck`。
- **Pages 自动部署（`.github/workflows/deploy-pages.yml`）**：推送至 `main` 后自动构建 Demo 站与博客模板，分别发布至 `/ValanceUI/` 与 `/ValanceUI/blog/`。

---

## 关联业务仓库

1. **[The-Valence-Project](https://github.com/Mizauka/The-Valence-Project)**：药历与血药浓度工作台，全面接入 `@valance-ui/vue` 三档响应式工作台、手势导航、自绘表单与返回栈。
2. **[CatsOnPlains](https://github.com/Mizauka/CatsOnPlains)**：长篇阅读工作台（`Site/`），接入 `@valance-ui/vue` 壳层、Desktop 三栏 / Tablet 双栏 / Phone 推挤抽屉与二合一停靠面板。
