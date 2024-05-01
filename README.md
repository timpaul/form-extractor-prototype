# Form Extractor Prototype

This tool extracts the structure from an image of a form.

It uses the [Claude 3 LLM](https://claude.ai) model by Anthropic.

A single extraction of an A4 form page costs about 10p.

It replicates the form structure in JSON, following the schema used by [GOV.UK Forms](https://www.forms.service.gov.uk/).

It then uses that to generate a multi-page web form in the GOV.UK style.

Here's a short demo video:

https://github.com/timpaul/form-extractor-prototype/assets/1590604/8adea926-808e-4011-80c6-18ce4a549a00


## Run locally

You'll need an [Anthropic API key](https://www.anthropic.com/api).

Add the key as a local environment variable called `ANTHROPIC_API_KEY`.

Install the app locally with `npm install`.

Start the app with `npm start`.

It'll be available at http://localhost:3000/

## Current limitations

- it can only process jpg images of forms, not documents
- it only knows about certain kinds of question types
- you can't provide your own API key via the UI
- you can't browse previous form extractions
- like a lot of Gen AI, it can be unpredictable

## How it works

*Disclaimer: This is a prototype and I am not a developer ;-).*

The main UI is in [app/views/index.html](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/index.html).

Other Nunjucks page templates and macros are in [app/views](https://github.com/timpaul/form-extractor-prototype/tree/main/app/views).

Additional CSS styles are in [public/assets/style.css](https://github.com/timpaul/form-extractor-prototype/blob/main/assets/style.scss).

The script in [public/assets/scripts.js](https://github.com/timpaul/form-extractor-prototype/blob/main/assets/scripts.js) handles the image preview and loading spinner.

The form in [index.html](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/index.html) sends the image at the URL provided by the user to the Claude API. 

It does this via the 'SendToClaude' function in [server.js](https://github.com/timpaul/form-extractor-prototype/blob/main/server.js).

The function makes use of the 'tools' feature of Claude.

That allows you to specify a JSON schema that you'd like it's response to conform to.

The JSON schema is specified in [data/extract-form-questions.json](https://github.com/timpaul/form-extractor-prototype/blob/main/data/extract-form-questions.json).

The results are saved as JSON files in [app/data/](https://github.com/timpaul/form-extractor-prototype/tree/main/app/data).

Those files are used to generate the pages that are loaded into iframes in [app/views/index.html](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/index.html).

The form components are specificed in [app/views/answer-types.njk](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/answer-types.njk)

They are built using the Nunjucks components in [GOV.UK Frontend](https://www.npmjs.com/package/govuk-frontend).

Page rendering is defined in the URL routing rules found at the bottom of [server.js](https://github.com/timpaul/form-extractor-prototype/blob/main/server.js).

