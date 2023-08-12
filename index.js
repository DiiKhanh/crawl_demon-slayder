const express = require('express');
const cors = require('cors');
const http = require('http');
const cheerio = require('cheerio');
require('dotenv/config');
const app = express();
const axios = require('axios');

const url = process.env.URL_CRAWL;
const url_character = process.env.URL_CHARACTER;

app.use(cors());
app.use(express.json({ limit: '50mb'} ));
app.use(express.urlencoded({parameterLimit: 50000, limit: '50mb', extended: true}));

// get all
app.get('/api/v1', (req, res) => {
  const limit = Number(req.query.limit);
  const listCharacter = [];
  try {
    axios(url).then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $('.portal', html).each(function () {
        const name = $(this).find('a').attr('title');
        const url = $(this).find('a').attr('href');
        const image = $(this).find('a > img').attr('data-src');
        listCharacter.push({
          name,
          url: 'http://localhost:8080/api/v1' + url.split('/wiki')[1],
          image
        });
    })

    if (limit && limit > 0) return res.status(200).json(listCharacter.slice(0, limit));

    return res.status(200).json(listCharacter);
  });
  } catch (error) {
    return res.status(500).json(error);
  }
});

// get detail
app.get('/api/v1/:character', (req, res) => {
  let url = url_character + req.params.character;

  const titles = [];
  const values = [];
  const characterDetail = [];
  const character = {};
  const galleries = [];
  try {
    axios(url).then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

       //Get gallery
      $('.wikia-gallery-item',html).each(function(){
        const gallery = $(this).find('a > img').attr('data-src');
        galleries.push(gallery);
      })

      $('aside', html).each(function(){
        // image
        const image = $(this).find('a > img').attr('src');

        // get key
        $(this).find('section > div > h3').each(function(){
          titles.push($(this).text());
        });
        // get value
        $(this).find('section > div > div').each(function(){
          values.push($(this).text());
        });

        if (image !== undefined) {

          for(let i = 0; i < values.length; i++){
            character[titles[i].toLowerCase()] = values[i];
          }
          characterDetail.push({ 
            name: req.params.character.replace('_', ' '),
            image: image,
            gallery: galleries,
            ...character 
          });
        }
        
      });
      
      return res.status(200).json(characterDetail);
    });

  } catch (error) {
    return res.status(500).json(error);
  }

});

const port = process.env.PORT || 8080;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running port ${port}`);
});