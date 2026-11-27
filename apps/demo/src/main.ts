import { createApp } from 'vue'
import '@valance-ui/vue/tokens.css'
import '@valance-ui/vue/base.css'
import '@valance-ui/vue/workbench.css'
import '@valance-ui/vue/prose.css'
import '@valance-ui/vue/style.css'
import ValanceUI, { configureLocale, configureThemeMode } from '@valance-ui/vue'
import App from './App.vue'

configureThemeMode({
  themeStorageKey: 'vl-demo-theme',
  accentStorageKey: 'vl-demo-accent',
  syncMetaThemeColor: true,
})

configureLocale({})

createApp(App).use(ValanceUI).mount('#app')
