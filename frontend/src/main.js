import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/aura-light-teal/theme.css'
import 'primeicons/primeicons.css'
import ToastService from 'primevue/toastservice';


const app = createApp(App)
app.use(router)
app.use(ToastService)
app.use(PrimeVue)
app.mount('#app')
