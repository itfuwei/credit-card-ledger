// 应用入口：注册 Vue、Element Plus 中文语言包和全局主题样式后挂载根组件。
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './app/App.vue'
import './assets/styles/tokens.css'
import './assets/styles/base.css'
import './assets/styles/utilities.css'

createApp(App).use(ElementPlus, { locale: zhCn }).mount('#app')
