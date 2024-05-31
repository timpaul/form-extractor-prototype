import 'dotenv/config'
import fs from "fs";
import bodyParser from 'body-parser';
import express from 'express';
import nunjucks from 'nunjucks';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { fromPath } from "pdf2pic";
import multer from 'multer';


// === SET UP EXPRESS === //

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// create constants for filename and dirname
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.use('/assets', express.static(path.join(__dirname, '/node_modules/govuk-frontend/dist/govuk/assets')))

nunjucks.configure([
  'app/views',
  'node_modules/govuk-frontend/dist/'
],
  {
    autoescape: true,
    express: app,
    noCache: true
  })

app.set('view engine', 'html')
app.use(express.json());
app.use(express.static('public'));



// === UPLOAD A FILE === //

// Define a temporary location for uploaded files

var storage = multer.diskStorage({  
  destination: function (req, file, cb) { 
      cb(null, './public/results/')
  },
  filename: function (req, file, cb) {
      cb(null, "form" + path.extname(file.originalname));
  }
})

const upload = multer({ storage: storage })

// Define POST route for file upload

app.post('/uploadFile', upload.single('fileUpload'), async (req, res) => {

  // Create a result folder to save the file, images and JSON in

  const now = `${Date.now()}`; // Create unique result ID
  var savePath =  "./public/results/form-" + now;
  fs.mkdirSync(savePath);

  const filetype = req.file.mimetype;
  const tempFilePath = './public/results/' + req.file.filename;

  if (filetype == 'image/jpeg') {
    // Move the JPG file into the result folder
    fs.renameSync(tempFilePath, savePath + '/page.1.jpeg');
    console.log("Saving image...");

  } else if (filetype == 'application/pdf')  {
    // Move the PDF file into the result folder
    fs.renameSync(tempFilePath, savePath + '/form.pdf');

    // Define the PDF-to-image conversion options
    const options = {
      density: 300,
      saveFilename: "page",
      savePath: savePath,
      format: "jpeg",
      width: 600,
      preserveAspectRatio: true
    };
    
    // Save images of all the pages in the PDF
    const convert = fromPath(savePath + '/form.pdf', options)
    console.log("Saving images of PDF pages...");
    await convert.bulk(-1)
  }

  // Create a JSON file for the PDF

  var formJson = {
    "filename": req.file.originalname,
    "formStructure": [],
    "pages": []
  }
  
  // Count the number of image files

  let files = fs.readdirSync( savePath );
  const filePages = files.filter( file => file.match(new RegExp(`.*\.(.jpeg)`, 'ig'))).length;

  // Add an item for each of the pages in the original file

  for(var i=0; i<filePages; i++){
    // The formStructure array stores the original structure of the document
    // Each number in the array is a page of the form
    // The number represents the number of questions on that page
    formJson.formStructure.push(0)
  }

  // Save the JSON in the folder

  try {
      fs.writeFileSync(savePath + '/form.json', JSON.stringify(formJson, null, 2));
    } catch (err) {
      console.error(err);
  }

  res.redirect('/results/form-' + now + "/1");

});


// === DELETE PREVIOUSLY PROCESSED FORMS === //

app.get('/delete/:formId', async (req, res) => {

  const formId = req.params.formId

  fs.rmdirSync('./public/results/form-' + formId, { 
    recursive: true, 
  }); 

  res.redirect('/');

});


// === EXTRACT FORM QUESTIONS FROM IMAGE === //


// Load schemas to use for Anthropic and OpenAI
import extractFormQuestionsAnthropic from './data/extract-form-questions-anthropic.json' assert { type: 'json' };
import extractFormQuestionsOpenAI from './data/extract-form-questions-openai.json' assert { type: 'json' };

// get API Keys from environment variables 
const anthropic = new Anthropic();  // ANTHROPIC_API_KEY
const openai = new OpenAI();        // OPENAI_API_KEY

// Define GET route for form extraction

app.get('/extractForm/:formId/:pageNum/', async (req, res) => {

  // If Anthropic API Key exists, use that
  // Otherwise use an OpenAI API Key

  if (process.env.ANTHROPIC_API_KEY) {
    var llm = "Anthropic";
  } else if (process.env.OPENAI_API_KEY) {
    var llm = "OpenAI";
  }

  return sendToLLM(llm, req, res)

});

// FUNCTION: Call an LLM and send it an image, schema and prompt

async function sendToLLM (llm, req, res) {

  const formId = req.params.formId 
  var savePath = "./public/results/form-" + formId
  const pageNum = Number(req.params.pageNum)

  try{
    console.log("Sending data to " + llm);

    // Encode the image data into base64  
    const image_media_type = "image/jpeg"
    const image = fs.readFileSync(savePath + "/page." + pageNum + ".jpeg")
    const image_data = Buffer.from(image).toString('base64')

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
      "Hand drawn forms, questionnaires and surveys are all valid forms.",
      "If it is a form, extract the questions from it using the extract_form_questions tool.",
      "If there is no output, explain why."
    ].join();

    // Call OpenAI or Anthropic LLM
    
    if (llm == "OpenAI"){
      var result = await callOpenAI(image_data, image_media_type, prompt)

    } else if (llm == "Anthropic"){
      var result = await callAnthropic(image_data, image_media_type, prompt)

    }

    // Load the file JSON

    const formJson = loadFileData(formId);

    // Calculate index to insert extracted questions into the pages array
    var index = 0;
    for(let i = 0; i < pageNum-1; i++){
         index += formJson.formStructure[i];
    }

    // Update the pages array
    var index = arraySum(formJson.formStructure, 0, pageNum-1)
    formJson.pages.splice(index, 0, ...result.pages);

    // Update the formStructure array
    formJson.formStructure.splice(pageNum-1,1,result.pages.length);

    // Save the updated file JSON
    fs.writeFileSync(savePath + '/form.json', JSON.stringify(formJson, null, 2));

    res.redirect('/results/form-' + formId + '/' + pageNum);

      } catch(error) {
    console.error('Error in Claude API call:', error);
    return res.status(500).send('Error processing the request');
  }
};



// FUNCTION: Call Chat GPT!
async function callOpenAI(image_data, image_media_type, prompt) {

  let img_str = `data:image/jpeg;base64,${image_data}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.0,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { "url": img_str }

          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    tools: [extractFormQuestionsOpenAI]
  });

  let result = JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments);
  console.log(result);

  return result;

};

// FUNCTION: Call Claude!
async function callAnthropic(image_data, image_media_type, prompt) {

  const completion = await anthropic.beta.tools.messages.create({
    model: 'claude-3-opus-20240229', // The 2 smaller models generate API errors
    temperature: 0.0, // Low temp keeps the results more consistent
    max_tokens: 2048,
    tools: [extractFormQuestionsAnthropic],
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

  let result = completion.content[1].input;
  console.log(result);
  
  return result;

};



// === THE USER INTERFACE === //

/* FUNCTION: Sum the items between two indexes in a numerical array */
function arraySum(array, start, end){
    var sum = 0;
    for(let i = start; i < end; i++){
         sum += array[i];
    } 
    return sum;
}

/* FUNCTION: Load file data  */

function loadFileData(formId){
  try {
    return JSON.parse(fs.readFileSync('./public/results/form-'+formId+'/form.json'))
  } catch (err) {
    return err
  }
}

const port = 3000;

/* Render home page */
app.get('/', (req, res) => {
  const formList = fs.readdirSync('./public/results').filter((item) => item.startsWith("form-"));
  res.locals.formList = formList;
  res.render('index.njk')
})

/* Render results pages */
app.get('/results/form-:formId/:pageNum/:question?', (req, res) => {
  const formId = req.params.formId 
  const pageNum = Number(req.params.pageNum) 
  const question = req.params.question ? Number(req.params.question) : 1
  const fileData = loadFileData(formId)
  res.locals.formId = formId
  res.locals.pageNum = pageNum
  res.locals.question = question
  res.locals.fileData = fileData
  res.render('result.njk')
})

/* Render pop-up check-answers pages */
app.get('/form-popup/:formId/:question/check-answers', (req, res) => {
  const formId = req.params.formId
  const question = req.params.question
  const fileData = loadFileData(formId)
  res.locals.formId = formId
  res.locals.fileData = fileData
  res.locals.question = question
  res.render('check-answers-popup.njk')
})

/* Render check-answers pages */
app.get('/forms/:formId/:pageNum/:question/check-answers', (req, res) => {
  const formId = req.params.formId
  const pageNum = req.params.pageNum
  const question = req.params.question
  const fileData = loadFileData(formId)
  res.locals.fileData = fileData
  res.locals.pageNum = pageNum
  res.locals.question = question
  res.render('check-answers.njk')
})

/* Render form pages */
app.get('/forms/:formId/:pageNum/:question', (req, res) => {
  const formId = req.params.formId
  const fileData = loadFileData(formId)
  const pageNum = Number(req.params.pageNum)
  const question = Number(req.params.question)
  res.locals.formId = formId
  res.locals.fileData = fileData
  res.locals.pageNum = pageNum
  res.locals.question = question
  res.locals.questionIndex = arraySum(fileData.formStructure, 0, pageNum-1) + question -1
  res.render('form.njk');
})

/* Render popup form pages */
app.get('/form-popup/:formId/:questionIndex', (req, res) => {
  const formId = req.params.formId
  const fileData = loadFileData(formId)
  const pageNum = Number(req.params.pageNum)
  const questionIndex = Number(req.params.questionIndex)
  res.locals.formId = formId
  res.locals.fileData = fileData
  res.locals.pageNum = Number(req.params.pageNum)
  res.locals.question = questionIndex
  res.render('form-popup.njk');
})


/* Render list pages */
app.get('/lists/:formId/:pageNum', (req, res) => {
  const formId = req.params.formId 
  const fileData = loadFileData(formId)
  res.locals.fileData = fileData
  res.render('list.njk')
})

/* Render JSON pages */
app.get('/json/:formId/:pageNum', (req, res) => {  
  const formId = req.params.formId 
  const fileData = loadFileData(formId)
  res.locals.formId = formId
  res.locals.fileData = fileData
  res.render('json.njk')
})

app.listen(port, () => {
  console.log('Server running at http://localhost:3000');
})