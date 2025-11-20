<script>
import TableComp from './TableComp.vue';
import ApiService from '../ApiService';

export default {
  components: {
    TableComp
  },
  data() {
    return {
      arr: [],
    }
  },
  mounted() {
    ApiService.getTodaysVote().then(data=> {
      for(let v of data.votes) {
        this.arr.push(v.recipe);
      }
      for(let r of this.arr) {
        delete r.description;
        delete r.link;
        delete r.active;
      }
    })
  }
}
</script>

<template>
  <div class="voting">
    <TableComp :data="this.arr" :showRankInput="true"></TableComp>
  </div>    
</template>

<style>

.voting {
  height: 100%;
  margin-left: 10px;

  display: flex;
  flex-direction: row;
  justify-content: center;
}
</style>
