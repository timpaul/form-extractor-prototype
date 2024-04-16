import express from 'express';
import nunjucks from 'nunjucks';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import sass from 'sass';
import fse from 'fs-extra';
var app = express();

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

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

  // get API Key from environment variable ANTHROPIC_API_KEY
  const anthropic = new Anthropic();

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
      tools: [
            {
                "name": "extract_form_questions",
                "description": "Extract the questions from an image of a form.",
                "input_schema": {
                  "type": "object",
                  "properties": {
                      "pages": {
                          "type": "array",
                          "description": "An array of the questions in the form",
                          "items": {
                            "type": "object",
                            "properties": {
                              "id": {
                                  "type": "number",
                                  "description": "The number of the question"
                              },
                              "question_text": {
                                  "type": "string",
                                  "description": "The title of the question"
                              },
                              "hint_text": {
                                  "type": "string",
                                  "description": "Any hint text associated with the question. It usually appears just below the question title. Use 'null' if there is no hint text"
                              },
                              "answer_type": {
                                  "type": "string",
                                  "description": "The type of form fields associated with the question",
                                  "enum": ["number", "email", "name", "national_insurance_number", "phone_number", "organisation_name", "address", "date", "selection", "text", "yes_no_question"]
                              },  
                              "answer_settings": {
                                  "type": "object",
                                  "properties": {
                                    "input_type": {
                                      "type": "string",
                                      "description": "The specific form field type for this question",
                                      "enum": ["date_of_birth", "other_date", "full_name", "uk_address", "international_address"]
                                    }
                                  }
                              }                      
                            }
                          }
                      }
                    }
                }
            }
          ],
      messages: [
            {
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
            }
          ]
    });
  

    const result = message.content[1].input;

/*
    const result = {
  "pages": [
    {
      "id": 1,
      "question_text": "What is your name?",
      "answer_type": "name",
      "hint_text": null
    },
    {
      "id": 2,
      "question_text": "What is your date of birth?",
      "answer_type": "date",
      "hint_text": "For example 3 6 1976"
    },
    {
      "id": 3,
      "question_text": "Are you a UK resident?",
      "answer_type": "yes_no_question",
      "hint_text": null
    }
  ]
};
*/
    console.log(result);


    // Write the results into a 'results' folder

    const dirname = `${Date.now()}`;

    // Write the JSON file
    fse.outputFile('app/views/results/' + dirname + '/json.html', jsonWrapper(JSON.stringify(result, null, 2)), (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      }
    });

    // Write the List file
    fse.outputFile('app/views/results/' + dirname + '/list.html', listWrapper(JSON.stringify(result, null, 2)), (err) => {
      if (err) {
        console.error('Error writing List file:', err);
      }
    });

    // Write the Form file
    fse.outputFile('app/views/results/' + dirname + '/form.html', formWrapper(JSON.stringify(result, null, 2)), (err) => {
      if (err) {
        console.error('Error writing Form file:', err);
      }
    });

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