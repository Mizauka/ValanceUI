import '@valance-ui/vitepress-theme/style.css'
import { createValanceTheme } from '@valance-ui/vitepress-theme'
import { data as posts } from '../posts.data.mjs'

export default createValanceTheme({
  posts,
})
