import Vue from 'vue'
import App from './App.vue'
import {Form, FormItem, Input, Button, Table, TableColumn, Row, Col} from 'element-ui';

Vue.config.productionTip = false;

Vue.use(Row);
Vue.use(Col);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Input);
Vue.use(Button);
Vue.use(Table);
Vue.use(TableColumn);

new Vue({
	render: h => h(App),
}).$mount('#app');
