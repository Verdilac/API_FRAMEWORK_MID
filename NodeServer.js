// NodeServer.js
// Name - Lathindu Welhenage
// ID - 200574922
// Date - 2/23/2024

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); 
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database
const db = new sqlite3.Database(':memory:');


// Create Table
db.serialize(() => {
    db.run(`
    CREATE TABLE recipes (
      recipeId INTEGER PRIMARY KEY,
      title TEXT,
      cuisine TEXT,
      ingredients TEXT,
      instructions TEXT,
      prepTime INTEGER,
      cookTime INTEGER
    )
  `);


    const recipesData = require('./recipes.json');
    const stmt = db.prepare(`
    INSERT INTO recipes (recipeId, title, cuisine, ingredients, instructions, prepTime, cookTime)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    recipesData.forEach(recipe => {
        stmt.run(
            recipe.recipeId,
            recipe.title,
            recipe.cuisine,
            JSON.stringify(recipe.ingredients),
            recipe.instructions,
            recipe.prepTime,
            recipe.cookTime
        );
    });
    stmt.finalize();
});



////////// Routes //////////////
app.get('/recipes', (req, res) => {
    db.all('SELECT recipeId, title, cuisine FROM recipes', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

///////////// All Ingredients ///////////////
app.get('/ingredients', (req, res) => {
    db.all('SELECT DISTINCT json_each.value AS ingredient FROM recipes CROSS JOIN json_each(ingredients)', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const ingredients = rows.map(row => row.ingredient);
        res.json(ingredients);
    });
});

///////// Cuisine ///////////
app.get('/recipes/cuisine/:cuisine', (req, res) => {
    const cuisine = req.params.cuisine;
    db.all('SELECT recipeId, title, cuisine FROM recipes WHERE cuisine = ?', [cuisine], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//////////////// Recipe //////////////////
app.get('/recipe/:recipeId', (req, res) => {
    const recipeId = req.params.recipeId;
    db.get('SELECT * FROM recipes WHERE recipeId = ?', [recipeId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Recipe not found' });
            return;
        }
        res.json(row);
    });
});

///////////// Ingredient //////////////////
app.get('/ingredient/:ingredientName', (req, res) => {
    const ingredientName = req.params.ingredientName;
    db.all('SELECT * FROM recipes WHERE ingredients LIKE ?', [`%${ingredientName}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
