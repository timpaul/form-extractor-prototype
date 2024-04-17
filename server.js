import 'dotenv/config'

import fs from "fs";

import express from 'express';
import nunjucks from 'nunjucks';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
var app = express();

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

import extractFormQuestions from './data/extract-form-questions.json' assert { type: 'json' };

// get API Key from environment variable ANTHROPIC_API_KEY
const anthropic = new Anthropic();

app.use('/assets', express.static(path.join(__dirname, '/node_modules/govuk-frontend/govuk/assets')))

nunjucks.configure([
  'app/views', 
  'node_modules/govuk-frontend/'
],
{
  autoescape: true,
  express: app
})

app.set('view engine', 'html')

app.use(express.json());
app.use(express.static('public'));


// CALL CLAUDE

app.post('/sendToClaude', async (req, res) => {

  // Encode the image data into base64  
  const image_url = req.body.imageURL;
  const image_media_type = "image/jpeg"
  const image_array_buffer = await ((await fetch(image_url)).arrayBuffer());
  const image_data = Buffer.from(image_array_buffer).toString('base64');

  // Create a HTML wrapper for the JSON result to go in
  const jsonWrapper = (content) => `
    {% extends "json.njk" %}
    {% block result %}${content}{% endblock %}
  `;

  // Create a HTML wrapper for the List result to go in
  const listWrapper = (content) => `
    {% extends "list.njk" %}
    {% set resultJSON = ${content} %}
  `;

  // Create a HTML wrapper for the Form result to go in
  const formWrapper = (content) => `
    {% extends "form.njk" %}
    {% set resultJSON = ${content} %}
  `;

  // Call Claude!

  try {

    const message = await anthropic.beta.tools.messages.create({
      model: 'claude-3-opus-20240229', // The 2 smaller models generate API errors
      temperature: 0.0, // Low temp keeps the results more consistent
      max_tokens: 2048,
      tools: [ extractFormQuestions ],
      messages: [{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": image_media_type,
                    "data": image_data,
                },
            },
            {
                "type": "text",
                "text": 'Extract the questions from this form? Use the extract_form_questions tool'
            }
        ],
      }]
    });
  

    const result = message.content[1].input;

    // Write the results into a 'results' folder

    const dirname = `${Date.now()}`;
    const viewPath = 'app/views/results/' + dirname;

    fs.mkdirSync(viewPath, { recursive: true });

    // Write the files
    try {
      fs.writeFileSync(viewPath + '/json.html', jsonWrapper(JSON.stringify(result, null, 2)));
      fs.writeFileSync(viewPath + '/list.html', listWrapper(JSON.stringify(result, null, 2)));
      fs.writeFileSync(viewPath + '/form.html', formWrapper(JSON.stringify(result, null, 2)));
    } catch (err) {
      console.error(err);
    }

    const responseObj = {
      jsonFilename: 'results/' + dirname + '/json.html',
      listFilename: 'results/' + dirname + '/list.html',
      formFilename: 'results/' + dirname + '/form/1'
    };

    res.json(responseObj);

  } catch(error) {
    console.error('Error in Claude API call:', error);
      return res.status(500).send('Error processing the request');
  }

});


// THE WEB PAGES

const port = 3000;

/* Render query page */
app.get('/', (req, res) => {
  //res.render('index.html', {result: result, resultJSON: JSON.stringify(result, null, 2)})
  res.render('index.html', {})
})

/* Render loading page */
app.get('/loading.html', (req, res) => {
  res.render('loading.html', {})
})

/* Render form pages */
app.get('/results/:dir/form/:question', (req, res) => {
  res.render('results/' + req.params.dir + '/form.html', {question: req.params.question})
})

/* Render results pages */
app.get('/results/:dir/:page', (req, res) => {
  res.render('results/' + req.params.dir + '/' + req.params.page)
})


app.listen(port, () => {
	console.log('Server running at http://localhost:3000');
})