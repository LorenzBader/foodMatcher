<script>
import { useRouter } from 'vue-router'
import Button from 'primevue/button';
import TabMenu from 'primevue/tabmenu';
import ApiService from '../ApiService';

export default {
  components: {
    Button,
    TabMenu
  },
  props: {
    in: Boolean
  },
  emits: ['showLogin'],
  data() {
    return {
      router: useRouter(),
      isLoggedIn: this.in,
      items: [
      { label: 'Overview', icon: 'pi pi-eye', route: '/' },
      { label: 'Vote', icon: 'pi pi-clipboard', route: '/vote' },
      { label: 'Collection', icon: 'pi pi-folder', route: '/collection' },
      ]
    }
  },
  methods: {
    loginLogout() {
      if(this.isLoggedIn) {
        this.isLoggedIn = false;
        ApiService.logOut();
        this.router.push('/');
      } else {
        this.$emit('showLogin', true);
      }      
    }
  }
}
</script>

<template>
  <div class="container">
    <div class="header">
      <TabMenu :model="this.items">
        <template #item="{ item, props }">
                <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                    <a v-ripple :href="href" v-bind="props.action" @click="navigate">
                        <span v-bind="props.icon" />
                        <span v-bind="props.label">{{ item.label }}</span>
                    </a>
                </router-link>
                </template>
        </TabMenu>
      <h1 id="heading">Food Matcher</h1>
      <Button id="login" @click="loginLogout()">{{ this.isLoggedIn ? 'Logout' : 'Login' }}</Button>
    </div>
    <div class="mainContetn">
      <RouterView />
    </div>
  </div>
</template>

<style>

.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;

  border-bottom: 1px solid grey;
}

.mainContent {
  height: 600px;
  overflow: scroll;
}

#heading {
  margin-right: 10px;
  flex-grow: 2;
  text-align: center;
}

#login {
  height: 50px;
}
</style>
