<script>
import ApiService from './ApiService';
import Layout_and_Nav from './layoutComponents/Layout_and_Nav.vue'
import Login from './layoutComponents/Login.vue'
import Toast from 'primevue/toast';
import { useRouter } from 'vue-router'

export default {
  components: {
    Layout_and_Nav, 
    Login,
    Toast
  },
  data() {
    return {
      showLogin: false,
      isLoggedin: false,
      router: useRouter()
    }
  },
  mounted() {
    ApiService.setupWebSocketClient();
  },
  methods: {
    loginDone() {
      this.router.push('/');
      this.isLoggedin = ApiService.isLoggedIn();
      this.showLogin = false;
    }
  }
}
</script>

<template>
  <Toast/>
  <div v-if="showLogin">
    <Login @response="() => loginDone()"></Login>
  </div>
  <div v-else>
    <Layout_and_Nav :in="isLoggedin" @showLogin="(res) => this.showLogin = res"></Layout_and_Nav>
  </div>
</template>

<style>
Button {
  width: 100px;
  justify-content: center;
}
</style>
