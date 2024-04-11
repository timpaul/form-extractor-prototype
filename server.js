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


const anthropic = new Anthropic(); // gets API Key from environment variable ANTHROPIC_API_KEY

/*
async function main() {
  const result = await anthropic.messages.create({
    messages: [
      {
        role: 'user',
        content: 'Hey Claude!?',
      },
    ],
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
  });
  console.dir(result);
}
main();*/

const image_url = "https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg"
const image_media_type = "image/jpeg"
const image_array_buffer = await ((await fetch(image_url)).arrayBuffer());
const image_data = Buffer.from(image_array_buffer).toString('base64');

const message = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1024,
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
                }
            ],
        }
      ]
});
console.log(message);



const port = 3000;

/* Render query page */
app.get('/', (req, res) => {
  res.render('index.html')
})

/* Render other pages */
app.get('/:page', (req, res) => {
  res.render(req.params.page)
})


app.listen(port, () => {
	console.log('Server running at http://localhost:3000');
})