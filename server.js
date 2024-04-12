import express from 'express';
import nunjucks from 'nunjucks';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import sass from 'sass';
import fs from 'fs';
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

const anthropic = new Anthropic(); 
// get API Key from environment variable ANTHROPIC_API_KEY

const image_url = "https://raw.githubusercontent.com/timpaul/form-converter/main/assets/CH2_English_online.jpg"
// use the form image hosted on GitHub

const image_media_type = "image/jpeg"
const image_array_buffer = await ((await fetch(image_url)).arrayBuffer());
const image_data = Buffer.from(image_array_buffer).toString('base64');


// CREATE THE MESSAGE
// The 'tools' section specifies the JSON schema that the response should conform to
// The 'messages' section send the image and a prompt to Claude

const message = await anthropic.beta.tools.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1024,
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


// THE WEB PAGES

const port = 3000;

/* Render query page */
app.get('/', (req, res) => {
  res.render('index.html', {result: JSON.stringify(result, null, 2)})
})

/* Render other pages */
app.get('/:page', (req, res) => {
  res.render(req.params.page)
})

app.listen(port, () => {
	console.log('Server running at http://localhost:3000');
})