import { createApp } from 'vue'
import App from './Sidepanel.vue'
import { setupApp } from '~/logic/common-setup'
import 'tdesign-vue-next/es/style/index.css'
import '../styles'

const app = createApp(App)
setupApp(app)
app.mount('#app')
