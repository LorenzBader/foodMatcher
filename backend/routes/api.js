var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const Database = require('../database');
const WebSocket = require('ws');

const jwtSecret = process.env.JWT_SECRET;

const db = new Database();

const wss = new WebSocket.Server({ port: 3001 })
wss.on('connection', (clientWS, req) => {
  console.log(`WS client connected, now ${wss.clients.size} connected`)

  clientWS.on('message', (data) => {
    const message = JSON.parse(data)
    console.log(`WS client sent: ${message}`)  
  })

  clientWS.on('close', () => {
    console.log(`WS Client disconnected, now ${wss.clients.size} connected`)
  })
})

function broadcast(info) {
  const strInfo = JSON.stringify(info, null, 2)
  console.log(`broadcasting ${strInfo}`)
  for(broadcastTarget of [...wss.clients]) {
    if(broadcastTarget.readyState === WebSocket.OPEN) {
      broadcastTarget.send(strInfo)
    }
  }
}

function isLoggedIn(req, res, next) {
    if (!req.jwtProvided) {
      console.log("Denied: Authentication required");
      return res.status(401).send('Authentication required');
    } else if (req.jwtVerifyError || req.jwtExpired) {
      console.log("Denied: Invalid authentication token");
      return res.status(401).send('Invalid authentication token');
    }
    next();
  }

// Connect to the database
db.connect().catch(err => {
    console.error("Error connecting to the database:", err);
});

// Update user endpoint
router.put('/users/update', isLoggedIn, async function(req, res, next) {
    const { email, newData } = req.body;
    try {
        const updatedCount = await db.updateUserByMail(email, newData);
        if (updatedCount > 0) {
            res.send({ status: 'success', message: 'User updated' });
        } else {
            res.status(404).send({ status: 'fail', message: 'User not found' });
        }
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Get all users endpoint
router.get('/users/all', isLoggedIn, async function(req, res, next) {
    try {
        const users = await db.getAllUsers();
        res.send({ status: 'success', users: users });
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Get a specific user by email endpoint
router.get('/users/email', isLoggedIn, async function(req, res, next) {
    const { email } = req.query;
    try {
        const user = await db.getUserByMail(email);
        if (user) {
            res.send({ status: 'success', user: user });
        } else {
            res.status(404).send({ status: 'fail', message: 'User not found' });
        }
    } catch (error) {
        console.error("Error fetching user by email:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Get a specific user by username endpoint
router.get('/users/username', isLoggedIn, async function(req, res, next) {
    const { username } = req.query;
    try {
        const user = await db.getUserByUsername(username);
        if (user) {
            res.send({ status: 'success', user: user });
        } else {
            res.status(404).send({ status: 'fail', message: 'User not found' });
        }
    } catch (error) {
        console.error("Error fetching user by username:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Gets all recipes endpoint
router.get('/recipes/all', async function(req, res, next) {
    try {
        const recipes = await db.getAllRecipes();
        res.send({ status: 'success', recipes: recipes });
    } catch (error) {
        console.error("Error fetching all recipes:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Gets a specific recipe by title endpoint
router.get('/recipes/title', async function(req, res, next) {
    const { title } = req.query;
    try {
        const recipes = await db.getRecipeByTitle(title);
        if (recipes) {
            res.send({ status: 'success', recipe: recipes });
        } else {
            res.status(404).send({ status: 'fail', message: 'Recipe not found' });
        }
    } catch (error) {
        console.error("Error fetching recipe by title:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Add new Recipe endpoint
router.post('/recipes/new', isLoggedIn, async function(req, res, next) {
    const recipeData = req.body;
    let existsError = false;
    try {
        const exists = await db.getRecipeByTitle(recipeData.title)
        if(exists != null) {
            exists.forEach(async (element) => {
                if (element.username == recipeData.username) {
                    if (!element.active) {
                        await db.deleteRecipe(element._id)
                    } else {
                        existsError = true;
                    }
                }
            });
            if (existsError) {
                res.status(409).send({ status: 'error', message: 'Recipe already exists' });
                return;
            }
        }
        const ack = await db.addRecipe(recipeData);
        recipeData._id = ack.insertedId;
        broadcast({type:'recipe', id: ack.insertedId, entity: recipeData, op: 'add'});
        res.send({ status: 'success', message: 'Recipe added', recipe: recipeData });
    } catch (error) {
        console.error("Error adding recipe:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Update recipe endpoint
router.put('/recipes/update', isLoggedIn, async function(req, res, next) {
    const { title, username, newData } = req.body;
    try {
        const updated = await db.updateRecipe(title, username, newData);
        if (updated) {
            broadcast({type:'recipe', id: updated._id, entity: updated, op: 'update'});
            res.send({ status: 'success', message: 'Recipe updated', recipe: updated });
        } else {
            res.status(404).send({ status: 'fail', message: 'Recipe not found' });
        }
    } catch (error) {
        console.error("Error updating recipe:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Deletes a recipe (deactivate) endpoint (user can only deactivate his own recipes)
router.delete('/recipes/delete', isLoggedIn, async function(req, res, next) {
    const { title, username } = req.query;
    try {
        const updated = await db.updateRecipe(title, username, {active: false});
        if (updated) {
            broadcast({type:'recipe', id: updated._id, entity: updated, op: 'delete'});
            res.send({ status: 'success', message: 'Recipe deactivated', recipe: updated });
        } else {
            res.status(404).send({ status: 'fail', message: 'Recipe not found or wrong user' });
        }
    } catch (error) {
        console.error("Error deactivating recipe:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Gets all votings endpoint
router.get('/votings/latest', async function(req, res, next) {
    try {
        const votings = await db.getLastVotings();
        const fullVotings = [];
        for(let voting of votings) {
            fullVotings.push(await getRecipesForVoting(voting));
        }
        res.send({ status: 'success', votings: fullVotings });
    } catch (error) {
        console.error("Error fetching all votings:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

router.get('/votings/today', async function(req, res, next) {
    const dateFormat = new Date();
    dateFormat.setHours(0, 0, 0, 0);
    let voting = await db.getVotingByDate(dateFormat);
    if(voting) {
        voting = await getRecipesForVoting(voting);
        res.send({ status: 'success', voting: voting});
    } else {
        const recipes = await db.getAllRecipes();
        let recipesAmount = 0;
        recipes.forEach(r => {
            if(r.active && recipesAmount < 10) recipesAmount++;
        })
        const votingRecipes = [];
        const allRecipes = await db.getAllRecipes();
        while (votingRecipes.length < recipesAmount) {
            let rand = Math.floor(Math.random() * (recipes.length));
            let randVal = recipes[rand];
            if(!votingRecipes.find(e => e.recipe == randVal._id)) {
                const fullRecipe = allRecipes.find(r => r._id.equals(randVal._id));
                if(fullRecipe.active) {
                    const newVal = {mean: 0.0};
                    newVal.recipe = randVal._id;
                    votingRecipes.push(newVal);
                }                
            }
        }
        let newVote = {
            date: dateFormat,
            users: [],
            votes: votingRecipes
        }
        await db.addNewVoting(newVote);
        newVote = await getRecipesForVoting(newVote);
        broadcast({ type: 'voting', id: newVote._id, entity: newVote, op: 'add' })
        res.send({ status: 'success', voting: newVote});
    }
});

// Gets a voting by date endpoint
router.get('/votings/date', isLoggedIn, async function(req, res, next) {
    const { date } = req.query;
    try {
        let dateFormat = new Date(date);
        let voting = await db.getVotingByDate(dateFormat);
        if (voting) {
            voting = await getRecipesForVoting(voting);
            res.send({ status: 'success', voting: voting});
        } else {
            res.status(404).send({ status: 'fail', message: 'Voting not found' });
        }
    } catch (error) {
        console.error("Error fetching voting by date:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Gets all users that voted for a date endpoint
router.get('/votings/usersForDate', isLoggedIn, async function(req, res, next) {
    const { date } = req.query;
    try {
        let dateFormat = new Date(date);
        const voting = await db.getVotingByDate(dateFormat);
        if (voting) {
            const users = [];
            for(let u of voting.users) {
                const user = await db.getUserById(u);
                users.push(user);
            }
            res.send({ status: 'success', users: users });
        } else {
            res.status(404).send({ status: 'fail', message: 'Users not found' });
        }
    } catch (error) {
        console.error("Error fetching users by voting date:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

// Update the mean of a recipe in a vote endpoint
router.put('/votings/pushVoting', isLoggedIn, async function(req, res, next) {
    const username = req.body.username;
    const data = req.body.data;
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0);
        const user = await db.getUserByUsername(username);
        await db.addUserToVoting(today, user._id);
        let currentVoting = await db.getVotingByDate(today);
        let updatedCount = 0;
        for(let d of data) {
            let addVal = d.vote ? d.vote : 5;
            const currEl = currentVoting.votes.find(v => v.recipe == d._id);
            let curVal = currEl.mean;
            let newVal = curVal * (currentVoting.users.length - 1);
            newVal = (newVal + addVal) / currentVoting.users.length;
            updatedCount += await db.updateRecipeVoteCount(today, d._id, newVal);
            currEl.mean = newVal;
        }

        if (updatedCount > 0) {
            currentVoting = await getRecipesForVoting(currentVoting);
            broadcast({ type: 'voting', id: currentVoting._id, entity: currentVoting, op: 'update' });
            res.send({ status: 'success', message: 'Recipe mean updated', voting: currentVoting });
        } else {
            res.status(404).send({ status: 'fail', message: 'Recipe not found in voting' });
        }
    } catch (error) {
        console.error("Error updating recipe mean in voting:", error);
        res.status(500).send({ status: 'error', message: 'Internal server error' });
    }
});

async function getRecipesForVoting(voting) {
    //Todo: Build a MongoDb query which does that
    const recipes = await db.getAllRecipes();
    for(let v of voting.votes) {
        v.recipe = recipes.find(r => r._id.equals(v.recipe));
    }
    return voting;
}

module.exports = router;