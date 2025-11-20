export default {
  userName: undefined,
  jwt: { // Retrieve JWT from local storage
    token: localStorage.getItem("jwt"),
    expiresAt: localStorage.getItem("expiresAt") ? new Date(+localStorage.getItem("expiresAt")) : null
  },
  webSocketCallBacks: null,
  websocket: null,

  setupWebSocketClient() {
    const vue = this
    const url = "ws://localhost:3001"
    this.websocket = new WebSocket(url)
    this.webSocketCallBacks = new Array();

    vue.websocket.onopen = function(event) {
      console.log("Connected to WS")
    }
    vue.websocket.onerror = function(event) {
      console.error("Could not connect to WS / connection to WS closed unexpectedly!")
    }
    vue.websocket.onclose = function(event) {
      console.log("Connection to WS server closed")
      setTimeout(() => {
        this.setupWebSocketClient();
      }, 1000);
    }

    vue.websocket.onmessage = function(event) {
      const message = JSON.parse(event.data);

      const { type, op, id, entity} = message;

      if(type === 'recipe') {
        vue.webSocketCallBacks[1] ? vue.webSocketCallBacks[1](type, op, id, entity): null;
      } else if(type === 'voting') {
        vue.webSocketCallBacks[0] ? vue.webSocketCallBacks[0](type, op, id, entity): null;
      }
    }
  },

  async login(email, password) {
    const url = new URL('http://localhost:3000/users/login');
    url.search = new URLSearchParams({
      mail: email,
      pw: password
    }).toString();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      this.jwt.token = data.token;
      localStorage.setItem('expiresAt', data.expiresAt);
      this.jwt.expiresAt = new Date(+data.expiresAt);
      this.userName = data.userName;
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
  async register(name, emial, password) {
    const url = new URL('http://localhost:3000/users/register');
    url.search = new URLSearchParams({
      name: name,
      mail: emial,
      pw: password
    }).toString();


    const response = await fetch(url);
    return response;
  },
  async getRecipes() {
    const url = new URL('http://localhost:3000/api/recipes/all');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Get recipes failed');
      }
      const data = await response.json();
      const recipes = [];
      for(let r of data.recipes) {
        if(r.active) {
          delete r.active;
          recipes.push(r);
        }
      }
      return recipes;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
  async putRecipe(recipe) {
    const url = new URL('http://localhost:3000/api/recipes/new');
    const header = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.jwt.token}`,
        },
        body: JSON.stringify(recipe)
    }
    
    const response = await fetch(url, header);
    if (!response.ok) {
      throw new Error(response.status);
    }
    const data = await response.json();
    return data.recipe;
  },
  async deleteRecipe(title) {
    const url = new URL('http://localhost:3000/api/recipes/delete');
    url.search = new URLSearchParams({
      title: title,
      username: this.userName
    }).toString();
    const header = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.jwt.token}`,
      }
    }
    const response = await fetch(url, header);
    if (!response.ok) {
      throw new Error(response.status);
    }
    const data = await response.json();
    return data.recipe;
  },
  async getTodaysVote() {
    const url = new URL('http://localhost:3000/api/votings/today');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Get todays vote failed');
      }
      const data = await response.json();
      return data.voting;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
  async getLatestVotes() {
    const url = new URL('http://localhost:3000/api/votings/latest');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Get votes failed');
      }
      const data = await response.json();
      return data.votings;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
  async pushVote(vote) {
    const url = new URL('http://localhost:3000/api/votings/pushVoting');
    const header = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.jwt.token}`,
    },
    body: JSON.stringify({data: vote, username: this.userName})
    }
    const response = await fetch(url, header);
    if (!response.ok) {
      throw new Error('Adding new vote failed');
    }
    return await response.json();
  },
  async hasVoted() {
    const url = new URL(`http://localhost:3000/api/votings/usersForDate`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    url.search = new URLSearchParams({
      date: today
    }).toString();
    const header = {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.jwt.token}`,
      }
    }

    try {
      const response = await fetch(url, header);
      if (!response.ok) {
        throw new Error('Get users failed');
      }
      const data = await response.json();
      return data.users.some(u => u.username == this.userName);
    } catch (error) {
      console.log(error);
      return null;
    }
  },
  isLoggedIn() {
    return this.jwt.token && this.jwt.expiresAt && this.jwt.expiresAt > new Date();
  },
  logOut() {
    this.userName = null;
    this.jwt.expiresAt = null;
    this.jwt.token = null;
  }
};