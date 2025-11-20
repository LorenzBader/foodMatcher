<script>
import Button from 'primevue/button';
import Password from 'primevue/password';
import InputText from 'primevue/inputtext';
import ApiService from '../ApiService';

//TODO edit login data
//TODO two users with same email?

export default {
  components: {
    Button,
    Password,
    InputText,
  },
  emits: ['response'],
  data() {
    return {
      login: true,
      loginEmail: '',
      loginPassword: '',
      registerName: '',
      registerEmail: '',
      registerPassword1: '',
      registerPassword2: '',
    }
  },
  methods: {
    loginFetch() {
      ApiService.login(this.loginEmail, this.loginPassword).then(worked => {
        if(worked){
          this.$toast.add({ severity: 'success', summary: 'Login Successful', life: 3000 });
          this.$emit('response', true);
        } else {
          this.$toast.add({ severity: 'error', summary: 'Login Failed', detail: 'Username or Password is wrong', life: 3000 });
          this.resetInputs();
        }
      })
      
    },
    registerFetch() {
      if(this.registerPassword1 !== this.registerPassword2) {
        this.resetInputs();
        this.$toast.add({ severity: 'error', summary: 'Passwords not matching', life: 3000 });
      } else{
        ApiService.register(this.registerName, this.registerEmail, this.registerPassword1)
        .then(async res => {
          const data = await res.json();
          if(res.ok) {
            this.$toast.add({ severity: 'success', summary: 'Registration Successful', detail: data.message, life: 3000 });
            this.login = true;
            this.resetInputs();
          } else {
            this.$toast.add({ severity: 'error', summary: 'Registration Failed', detail: data.message, life: 3000 });
            this.resetInputs();
          }
        })
      }
    },
    resetInputs() {
      this.registerName = '';
      this.registerEmail = '';
      this.registerPassword1 = '';
      this.registerPassword2 = '';
      this.loginEmail = '';
      this.loginPassword = '';
    }
  }
}
</script>

<template>
  <form v-if="login" @submit.prevent="loginFetch">
    <div class="loginBox">
      <div class="loginRow">
        <label for="email"><b>E-Mail</b></label>
        <InputText v-model="loginEmail" placeholder="Enter E-Mail" id="email" required />
      </div>
      <div class="loginRow">
        <label for="psw"><b>Password</b></label>
        <Password v-model="loginPassword" placeholder="Enter Password" id="psw" :feedback="false" required />
      </div>
      <div class="buttons">
        <Button type="submit">Login</Button>
        <Button @click="login = false" type="button">Register</Button>
        <Button @click="this.$emit('response', false)" type="button">Return</Button>
      </div>      
    </div>
  </form>
  
  <form v-else @submit.prevent="registerFetch">
    <div class="loginBox">
      <div class="loginRow">
        <label for="name"><b>Name</b></label>
        <InputText v-model="registerName" placeholder="Enter your name" id="name" required />
      </div>
      <div class="loginRow">
        <label for="remail"><b>E-Mail</b></label>
        <InputText v-model="registerEmail" placeholder="Enter E-Mail" id="remail" required />
      </div>
      <div class="loginRow">
        <label for="rpsw1"><b>Enter Password</b></label>
        <Password v-model="registerPassword1" placeholder="Enter Password" id="rpsw1" required />
      </div>
      <div class="loginRow">
        <label for="rpsw2"><b>Repeat Password</b></label>
        <Password v-model="registerPassword2" placeholder="Repeat Password" id="rpsw2" :feedback="false" required />
      </div>
      <div class="buttons">
        <Button type="submit">Register</Button>
        <Button @click="this.login = true" type="button">Return</Button>
      </div>
    </div>
  </form>
</template>

<style>
.loginBox {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100vh;
  align-items: center;
  justify-content: center;
}

.loginRow {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  width: 400px;
  justify-content: space-between;
}

.buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 400px;
  margin-top: 20px;
  gap: 20px;
}
</style>
