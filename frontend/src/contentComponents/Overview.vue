<script>
import TableComp from './TableComp.vue'
import ApiService from '../ApiService';

export default {
  components: {
    TableComp
  },
  data() {
    return {
      data: [],
    }
  },
  mounted() {
    ApiService.webSocketCallBacks[0] = ((type, op, id, entity) => {
        if(op ===  'add') {
          const newVal = {};
          newVal.date = entity.date;
          newVal.votes = [];
          //remove useless fields and add vote field
          for(let v of entity.votes) {
            v.recipe.vote = v.mean;
            delete v.recipe.username;
            delete v.recipe.duration;
            delete v.recipe.isVegi;
            delete v.recipe.active;
            newVal.votes.push(v.recipe);
          }
          //sort by voting outcome
          newVal.votes.sort((v1, v2) => v1.vote - v2.vote);
          //replace mean by position in ranking
          for (let index = 0; index < newVal.votes.length; index++) {
            newVal.votes[index].vote = index+1;
          }
          //add infront
          this.data.splice(0,0,newVal);
        } else if(op === 'update') {
          let index;
          for (let i = 0; i < this.data.length; i++) {
            if((new Date(this.data[i].date)).valueOf() == (new Date(entity.date)).valueOf()) {
              index = i;
            }
          }

          if(index || index == 0) {
            const newVal = {};
            newVal.date = entity.date;
            newVal.votes = [];
            //remove useless fields and add vote field
            for(let v of entity.votes) {
              v.recipe.vote = v.mean;
              delete v.recipe.username;
              delete v.recipe.duration;
              delete v.recipe.isVegi;
              delete v.recipe.active;
              newVal.votes.push(v.recipe);
            }
            //sort by voting outcome
            newVal.votes.sort((v1, v2) => v1.vote - v2.vote);
            //replace mean by position in ranking
            for (let index = 0; index < newVal.votes.length; index++) {
              newVal.votes[index].vote = index+1;
            }
            //add infront
            this.data.splice(index, 1);
            this.data.splice(index,0,newVal);
          } else {
            this.$toast.add({ severity: 'error', summary: 'Error updating Voting', detail: 'An error occured updating the votes please reload the page for accurate results!', life: 3000 });
          }
        }
        });

    ApiService.getLatestVotes().then(data => {
      data.forEach(element => {
        const newVal = {};
        newVal.date = element.date;
        newVal.votes = [];
        //remove useless fields and add vote field
        for(let v of element.votes) {
          v.recipe.vote = v.mean;
          delete v.recipe.username;
          delete v.recipe.duration;
          delete v.recipe.isVegi;
          delete v.recipe.active;
          newVal.votes.push(v.recipe);
        }
        //sort by voting outcome
        newVal.votes.sort((v1, v2) => v1.vote - v2.vote);
        //replace mean by position in ranking
        for (let index = 0; index < newVal.votes.length; index++) {
          newVal.votes[index].vote = index+1;
        }
        this.data.push(newVal);
      });      
    })
  }
}
</script>

<template>
  <div v-for="v of this.data" class="overview">
      <h2>Voting {{ new Date(v.date).toLocaleDateString() }}</h2>
      <TableComp :data="v.votes" :showRank="true"></TableComp>
  </div>    
</template>

<style>

.overview {
  margin-left: 10px;
  padding-right: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
