<!-- eslint-disable vue/no-mutating-props -->
<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';   
import Row from 'primevue/row';                   
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import ApiService from '../ApiService';

export default {
  components: {
    Column,
    ColumnGroup,
    Row,
    DataTable,
    Button,
    Dropdown
  },
    props: {
        data: [],
        showRankInput: {
          type: Boolean,
          default: false
        },
        showRank: {
          type: Boolean,
          default: false
        },
    },
  data() {
    return {
        columns: [],
        ranks: [],
    }
  },
  beforeUpdate() {
    this.reload();
  },
  mounted() {
    this.reload();
    if(!this.showRankINput){
      //collection callback
      ApiService.webSocketCallBacks[1] = ((type, op, id, entity) => {
        if(op === 'add') {
          delete entity.active;
          entity._id = id;
          this.data.push(entity);
        } else if(op === 'delete'){
          let index;
          for (let i = 0; i < this.data.length; i++) {
            if(this.data[i]._id == entity._id) {
              index = i;
            }
          }
          if(index) {
            this.data.splice(index, 1);
          }
        } else if(op === 'update'){
          let index;
          for (let i = 0; i < this.data.length; i++) {
            if(this.data[i]._id == entity._id) {
              index = i;
            }
          }
          if(index) {
            this.data[index] = entity;
          }
        }
      });
    }
  },
  methods: {
    reload() {
      if(this.data && this.data[0]) {
        this.columns = [];
        for (let index = 0; index < this.data.length; index++) {
          this.ranks.push(index+1);
        }
        if(this.showRank) {
          //overview nad vote
          this.columns.push({ field: "vote", header: "VOTE" })
        }
        Object.keys(this.data[0]).forEach(key => {
          if(key != "link" && key != "vote" && key != "_id") {
            this.columns.push({ field: key, header: key.toUpperCase() })
          }
        });
      }
    },
    existsLink() {
      if(this.data && this.data[0]) {
        return Object.keys(this.data[0]).includes('link');
      } else {
        return false;
      }        
    },
    getLink(link) {
      if(!link.includes("https://")) {
        link = "https://" + link;
      }
      return link;
    },
    dropdownChange(event, slotProps) {
      this.data.forEach(el => {
        if(el.vote == event.value && el.title != slotProps.data.title) {
          el.vote = -1;
        }
      })
    },
    async submitVoting() {
      if(!ApiService.isLoggedIn()) {
        this.$toast.add({ severity: 'error', summary: 'Please Login', life: 3000 });
      } else {
        const hasVoted = await ApiService.hasVoted();
        if(hasVoted) {
          this.$toast.add({ severity: 'error', summary: 'You have already voted today', life: 3000 });
        } else {
          ApiService.pushVote(this.data)
          .then(res => {
            for (let index = 0; index < this.data.length; index++) {
              //reset inputs
              delete this.data[index].vote;              
            }
            this.$toast.add({ severity: 'success', summary: 'New Voting submitted', life: 3000 })
          })
          .catch(error => this.$toast.add({ severity: 'error', summary: 'Submiting new vote failed', life: 3000 }))
        }
      }
    },
  }
}
</script>

<template>
  <div v-if="data.length > 0" class="table">
    <DataTable :value="data" tableStyle="min-width: 50rem" showGridlines>
      <Column v-if="this.showRankInput" header="Vote">
        <template #body="slotProps">
            <Dropdown :options="ranks" v-model="slotProps.data.vote" @change="dropdownChange($event, slotProps)" placeholder="Select Ranking"></Dropdown>
        </template>
      </Column>
      <Column v-for="col of columns" :key="col.field" :field="col.field" :header="col.header"></Column>
      <Column v-if="this.existsLink()" field="link" header="LINK">
        <template #body="slotProps">
            <a :href="this.getLink(slotProps.data.link)">Link</a>
        </template>
      </Column>
    </DataTable>
    <Button v-if="this.showRankInput" @click="submitVoting()">Submit voting</Button>
  </div>
  <p v-else>No Data yet!</p>
</template>

<style>
  .table {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
</style>