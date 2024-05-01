import 'dotenv/config'

import fs from "fs";

import bodyParser from 'body-parser';
import express from 'express';
import nunjucks from 'nunjucks';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

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
  express: app,
  noCache: true
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

  // Create the prompt to send with the image and the tool
  const prompt = [
    "Is this a form?", 
    "It's only a form if it contains form field boxes.",
    "If it is a form, extract the questions from it using the extract_form_questions tool."
  ].join();

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
                "text": prompt
            }
        ],
      }]
    });

    console.log(message);

    let result = message.content[1].input; 

    result.imageURL = image_url

    // Write the results into a 'results' folder

    const now = `${Date.now()}`;

    // Write the files
    try {
      fs.writeFileSync('app/data/' + now + '.json', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
    }

    res.redirect('/results/' + now);

  } catch(error) {
    console.error('Error in Claude API call:', error);
      return res.status(500).send('Error processing the request');
  }

});


// THE WEB PAGES

const port = 3000;

/* Render query page */
app.get('/', (req, res) => {
  res.render('index.html')
})

/* Render loading page */
app.get('/loading.html', (req, res) => {
  res.render('loading.html')
})

// load form data

function loadFormData(formId){
  try {
    return JSON.parse(fs.readFileSync('./app/data/'+formId+'.json'))
  } catch (err) {
    console.error(err)
  }
}

/* Render form pages */
app.get('/forms/:formId/:question', (req, res) => {
  const formId = req.params.formId 
  const question = Number(req.params.question)
  const formData = loadFormData(formId)
  res.locals.formData = formData
  res.locals.question = question
  res.render('form.njk');
})

/* Render list pages */
app.get('/lists/:formId', (req, res) => {
  const formId = req.params.formId 
  const formData = loadFormData(formId)
  res.locals.formData = formData
  res.render('list.njk')
})

/* Render JSON pages */
app.get('/json/:formId', (req, res) => {
  const formId = req.params.formId 
  let formData = loadFormData(formId)
  formData = JSON.stringify(formData, null, 2);
  res.locals.formData = formData
  res.render('json.njk')
})

app.get('/results/:formId', (req, res) => {
  const formId = req.params.formId 
  const formData = loadFormData(formId)
  res.locals.formId = formId
  res.locals.formData = formData
  res.render('result')
})

app.listen(port, () => {
	console.log('Server running at http://localhost:3000');
})