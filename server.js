'use strict';



const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const app = express();
const methodOverride = require('method-override');

app.use(express.urlencoded({ extended: true }));
app.use(express.static( "./public"));
app.use(methodOverride('_method'));
const PORT = process.env.PORT || 4000;
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
app.set('view engine', 'ejs');


app.post('/search',createSearch)
app.get('/searches/new', renderSearch)
app.post('/add', addFav)
app.get('/',renderHome)
app.get('/detail/:id',renderDetail)
app.delete('/delete/:id',deleteBook)
app.put('/updat/:id',updatBook)
// app.get('*', (request, response) => response.status(404).send('This route does not exist'));

function Book(info) {
  this.image_url= info.imageLinks?info.imageLinks.thumbnail:'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title || 'No title available';
   this.author=info.authors;
   this.description=info.description;
   this.isbn=info.industryIdentifiers ? info.industryIdentifiers[0].identifier: 'No isbn';
}

function renderSearch(req,res){
res.render('pages/searches/new')
}


function renderHome(req,res){
    const sql='SELECT * FROM books;';
    client.query(sql).then(result=>{
        res.render('pages/index',{results:result.rows})
    })
}

function addFav(req,res){
    const value=req.body;
    const sql= 'INSERT INTO books (title, author, isbn, description,image_url) VALUES($1, $2, $3,$4,$5) RETURNING id;';
    const saveValue=[value.title, value.author, value.isbn, value.description,value.image_url];
    client.query(sql,saveValue).then((results)=>{
        res.redirect('/')


    })
}

function renderDetail(req,res){
    const id=req.params.id;
    const sql= 'SELECT * FROM books WHERE id=$1;'
    const saveValue= [id];
    client.query(sql,saveValue).then(result=>{
        res.render('pages/books/detail', {results:result.rows})
    })
}

function deleteBook(req,res){
    const id=req.params.id;
    const sql= 'DELETE FROM books WHERE id=$1';
    const saveValue= [id];
    client.query(sql,saveValue).then(()=>{
        res.redirect('/')
    })
}

function updatBook(req,res){
    const   Id=req.params.id;
    const {title, author, isbn, description,image_url}=req.body;

    const sql= 'UPDATE books SET title=$1, author=$2, isbn=$3, description=$4, image_url=$5 WHERE id=$6';
    const saveValue=[title, author, isbn, description,image_url,Id];

    client.query(sql,saveValue).then((result)=>{
        res.redirect(`/updat/${Id}`);
    })
}


function createSearch(req, res) {
    let url =`https://www.googleapis.com/books/v1/volumes`;
    console.log(req.body);
    const searchBy = req.body.searchBy;
    const searchValue = req.body.search;
    const queryObj = {};
    if (searchBy === 'title') {
      queryObj['q'] = `+intitle:${searchValue}`;
    } else if (searchBy === 'author') {
      queryObj['q'] = `+inauthor:${searchValue}`;
  
    }
    superagent.get(url).query(queryObj).then(apiResponse => {
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
    }).then(results => {
      res.render('pages/searches/show', { searchResults: results })
    });
  }
  
  client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
  );