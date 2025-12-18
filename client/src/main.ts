import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
import i18n from './i18n';

app.use(pinia);
app.use(router);
app.use(i18n);

import { Toaster } from 'vue-sonner'
app.component('Toaster', Toaster)

router.isReady().then(() => {
    app.mount('#app')
})
// createApp(App).mount('#app')
