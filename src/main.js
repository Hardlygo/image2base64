import Vue from 'vue'
import './registerServiceWorker'
import router from './router'
import store from './store'



import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue'


import VueClipboard from 'vue-clipboard2'
Vue.use(ElementUI);
Vue.use(VueClipboard)


Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
