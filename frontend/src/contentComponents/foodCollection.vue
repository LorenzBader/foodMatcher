<script>
import TableComp from './TableComp.vue'
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ApiService from '../ApiService';

//TODO delete with enter
//TODO edit fields

export default {
  components: {
    TableComp,
    Button,
    InputText
  },
  data() {
    return {
      newEntry: {title: '', duration: '', description: '', link: '', isVegi: 'no', username: '', active: true},
      arr: [],
      input: '',
      label: '',
      placeholder: 'enter name',
      counter: 0,
      deleteName: '',
    }
  },
  mounted() {
    ApiService.getRecipes().then(recipes => {
      this.arr = recipes
    });
  },
  methods: {
    next() {
      if(!ApiService.isLoggedIn()) {
        this.$toast.add({ severity: 'error', summary: 'Please Login', life: 3000 });
      } else {
        if (this.input != '') {
          this.newEntry[Object.keys(this.newEntry)[this.counter]] = this.input;
          this.input = '';
          this.placeholder = this.pickPlaceholder();
          this.counter++;
          if (this.counter == 5) {
            this.counter = 0;
            this.newEntry.username = ApiService.userName;
            ApiService.putRecipe(this.newEntry).then(newRecipe => {
                //no need anymore, is added with websockets now
                //this.arr = newRecipes;     
            }).catch(err => {
              const code = parseInt(err.message);
              if(code == 409) {
                this.$toast.add({ severity: 'error', summary: 'Recipe already exists with this name or from this user', life: 3000 });
              } else {
                this.$toast.add({ severity: 'error', summary: 'Internal server Error!', life: 3000 });
              }
            });
          }
        } 
      }
           
    },
    reset() {
      if(!ApiService.isLoggedIn()) {
        this.$toast.add({ severity: 'error', summary: 'Please Login', life: 3000 });
      } else {
        this.counter = 0
        this.input = ''
        this.placeholder = 'enter name'
      }
    },
    pickPlaceholder() {
      switch (this.counter) {
        case 4:
          return 'enter name'
        case 0:
          return 'enter duration'
        case 1:
          return 'enter description'
        case 2:
          return 'enter link'
        case 3:
          return 'enter is vegi'
        default:
          break
      }
    },
    deleteRec() {
      if(!ApiService.isLoggedIn()) {
        this.$toast.add({ severity: 'error', summary: 'Please Login', life: 3000 });
      } else {
        ApiService.deleteRecipe(this.deleteName).then(recipe => {
          //no need anymore is done in ws
          //this.arr = recipes;
          this.deleteName = '';
        }).catch(err => {
          const code = parseInt(err.message);
          if(code == 404) {
            this.$toast.add({ severity: 'error', summary: 'Recipe not found or you didnt create this recipe', life: 3000 });
          } else {
            this.$toast.add({ severity: 'error', summary: 'Internal server Error!', life: 3000 });
          }
        });
      }
    },
  }
}
</script>

<template>
  <div id="addField">
    <label :v-model="label" for="rname">Add new entry:</label>
    <InputText v-model="input" type="text" :placeholder="[[placeholder]]" name="rname" required @keyup.enter="next"/>
    <Button @click="next()" >Next</Button>
    <Button @click="reset()" >Reset</Button>
    <label for="delete">Name to delete:</label>
    <InputText v-model="deleteName" type="text" placeholder="Name" name="delete" required @keyup.enter="deleteRec"/>
    <Button @click="deleteRec()"  severity="danger">Delete</Button>
  </div>
  <TableComp :data="this.arr"></TableComp>
</template>

<style scoped>
#addField {
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  margin: 10px 10px;
  gap: 10px;
}
</style>
