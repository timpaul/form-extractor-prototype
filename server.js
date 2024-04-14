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
  const anthropic = new Anthropic(); // get API Key from environment variable ANTHROPIC_API_KEY
  const image_url = req.body.imageURL; // use the form image hosted on GitHub
  const image_media_type = "image/jpeg"
  const image_array_buffer = await ((await fetch(image_url)).arrayBuffer());
  const image_data = Buffer.from(image_array_buffer).toString('base64');

  
  const htmlSkeleton = (content) => `
    {% extends "govuk/template.njk" %}

    {% block head %}
      <link href="/assets/style.css" rel="stylesheet">
    {% endblock %}

    {% block header %}
    {% endblock %}

    {% block content %}
      <pre style="overflow: hidden; margin: -20px -15px; padding: 20px 15px; background: #f3f2f1">${content}</pre>
    {% endblock %}

    {% block footer %}
    {% endblock %}

    {% block bodyEnd %}
      {# Run JavaScript at end of the <body>, to avoid blocking the initial render. #}
      <script src="/govuk-frontend/all.js"></script>
      <script src="/assets/scripts.js"></script>
      <script>window.GOVUKFrontend.initAll()</script>
    {% endblock %}
  `;
  try {
    const message = await anthropic.beta.tools.messages.create({
      model: 'claude-3-opus-20240229',
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
                                  "enum": ["number", "email", "name", "national_insurance_number", "phone_number", "organisation_name", "address", "date", "selection", "text"]
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
    console.log(result);

    const dirname = `${Date.now()}`;

    fse.outputFile('app/views/examples/' + dirname + '/json.html', htmlSkeleton(JSON.stringify(result, null, 2)), (err) => {
      if (err) {
        console.error('Error writing file:', err);
      }
    });

    const responseObj = {
      filename: 'examples/' + dirname + '/json.html',
      result: result,
      resultJSON: JSON.stringify(result, null, 2)
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

/* Render example pages */
app.get('/examples/:dir/:page', (req, res) => {
  res.render('examples/' + req.params.dir + '/' + req.params.page)
})


app.listen(port, () => {
	console.log('Server running at http://localhost:3000');
})