import 'dotenv/config'
import fs from "fs";
import bodyParser from 'body-parser';
import express from 'express';
import nunjucks from 'nunjucks';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { fromPath } from "pdf2pic";
import multer from 'multer';


// === SET UP EXPRESS === //

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

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



// === UPLOAD DOCUMENT === //

// Define a temporary location for uploaded PDFs
var storage = multer.diskStorage({  
  destination: function (req, file, cb) { 
      cb(null, './public/results/')
  },
  filename: function (req, file, cb) {
      cb(null, "form" + path.extname(file.originalname));
  }
})

// Define a function for counting files with specific extensions
function getFilesFromPath(path, extension) {
    let files = fs.readdirSync( path );
    return files.filter( file => file.match(new RegExp(`.*\.(${extension})`, 'ig')));
}

const upload = multer({ storage: storage })

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
    await convert.bulk(-1)
  }

  // Create a JSON file for the PDF
  const filePages = getFilesFromPath(savePath, ".jpeg").length
  var formJson = {
    "filename": req.file.originalname,
    "formStructure": [],
    "pages": []
  }

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


// === EXTRACT QUESTIONS === //

// get JSON schema to pass to Claude
import extractFormQuestions from './data/extract-form-questions.json' assert { type: 'json' };

// get API Key from environment variable ANTHROPIC_API_KEY
const anthropic = new Anthropic();

app.get('/extractForm/:formId/:pageNum/', async (req, res) => {
  const formId = req.params.formId 
  const pageNum = parseFloat(req.params.pageNum)
  const savePath = "./public/results/form-" + formId;

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
    "Is this image a form?", 
    "It's only a form if it contains form field boxes.",
    "Hand drawn forms, questionnaires and surveys are all valid forms.",
    "If it is a form, extract the questions from it using the extract_form_questions tool."
  ].join();

  // Call Claude!
  try {
    const message = await anthropic.beta.tools.messages.create({
      model: 'claude-3-opus-20240229', // The 2 smaller models generate API errors
      temperature: 0.0, // Low temp keeps the results more consistent
      max_tokens: 4096,
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
    result.extracted = true
    result.pageNum = pageNum
    result.formId = formId

    // Update the form JSON file

    const formJson = loadFileData(formId);

    // Calculate index to insert extracted questions into pages array
    var index = 0;
    for(let i = 0; i < pageNum-1; i++){
         index += formJson.formStructure[i];
    } 

    // Update the pages array
    var index = arraySum(formJson.formStructure, 0, pageNum-1)
    formJson.pages.splice(index, 0, ...result.pages);

    // Update the formStructure array
    formJson.formStructure.splice(pageNum-1,1,result.pages.length);

    fs.writeFileSync(savePath + '/form.json', JSON.stringify(formJson, null, 2));



    // Write the page JSON file
    try {
      fs.writeFileSync(savePath + '/page.'+ pageNum +'.json', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
    }

    res.redirect('/results/form-' + formId + '/' + pageNum);

  } catch(error) {
    console.error('Error in Claude API call:', error);
    return res.status(500).send('Error processing the request');
  }
});


// THE WEB PAGES

const port = 3000;

/* Render query page */
app.get('/', (req, res) => {
  const formList = fs.readdirSync('./public/results').filter((item) => item.startsWith("form-"));
  res.locals.formList = formList;
  res.render('index.njk')
})

/* Render loading page */
app.get('/loading.html', (req, res) => {
  res.render('loading.njk')
})


/* Sum the items between two indexes in a numerical array */
function arraySum(array, start, end){
    var sum = 0;
    for(let i = start; i < end; i++){
         sum += array[i];
    } 
    return sum;
}

/* Load form and file data functions */

function loadFormData(formId, pageNum){
  try {
    return JSON.parse(fs.readFileSync('./public/results/form-'+formId+'/page.'+pageNum+'.json'))
  } catch (err) {
    return JSON.parse('{"extracted": false}')
  }
}
function loadFileData(formId){
  try {
    return JSON.parse(fs.readFileSync('./public/results/form-'+formId+'/form.json'))
  } catch (err) {
    return JSON.parse('{"extracted": false}')
  }
}

/* Render form pages */
app.get('/forms/:formId/:pageNum/:question', (req, res) => {
  const formId = req.params.formId 
  const pageNum = Number(req.params.pageNum)
  const question = Number(req.params.question)

  const fileData = loadFileData(formId)
  
  res.locals.questionIndex = arraySum(fileData.formStructure, 0, pageNum-1) + question -1

  res.locals.fileData = fileData
  res.locals.question = question
  res.locals.formId = formId
  res.locals.pageNum = pageNum
  res.render('form.njk');
})

/* Render check-answers pages */
app.get('/check-answers/:formId/:pageNum', (req, res) => {
  const formId = req.params.formId 
  const pageNum = req.params.pageNum 
  const formData = loadFormData(formId, pageNum)
  res.locals.formData = formData
  res.locals.formId = formId
  res.locals.pageNum = pageNum
  res.render('check-answers.njk')
})

/* Render list pages */
app.get('/lists/:formId/:pageNum', (req, res) => {
  const formId = req.params.formId 
  const pageNum = req.params.pageNum 
  const formData = loadFormData(formId, pageNum)
  res.locals.formData = formData
  res.locals.formId = formId
  res.locals.pageNum = pageNum
  res.render('list.njk')
})

/* Render JSON pages */
app.get('/json/:formId/:pageNum', (req, res) => {  
  const formId = req.params.formId 
  const pageNum = req.params.pageNum 
  var formData = loadFormData(formId, pageNum)
  formData = JSON.stringify(formData, null, 2);
  res.locals.formData = formData
  res.locals.formId = formId
  res.locals.pageNum = pageNum
  res.render('json.njk')
})

/* Render results pages */
app.get('/results/form-:formId/:pageNum', (req, res) => {
  const formId = req.params.formId 
  const pageNum = req.params.pageNum 
  const formData = loadFormData(formId, pageNum)
  const fileData = loadFileData(formId)
  res.locals.formId = formId
  res.locals.pageNum = pageNum
  res.locals.formData = formData
  res.locals.fileData = fileData
  res.render('result.njk')
})


app.listen(port, () => {
	console.log('Server running at http://localhost:3000');
})