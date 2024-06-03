# Form Extractor Prototype

This tool extracts the structure from a PDF or image of a form.

By default it uses the [Claude 3 LLM](https://claude.ai) model by Anthropic.

But it can also use the OpenAI LLM.

A single extraction of an A4 form page costs about 10p.

It replicates the form structure in JSON, following the schema used by [GOV.UK Forms](https://www.forms.service.gov.uk/).

It then uses that to generate a multi-page web form in the GOV.UK style.

Here's a short demo video:

https://github.com/timpaul/form-extractor-prototype/assets/1590604/81580afb-e3c9-41dd-a451-be418372ef2d

You'll notice that it doesn't try to faithfully replicate every field in a question.
Instead, it uses the relevant components and patterns from the [GOV.UK Design System](https://design-system.service.gov.uk/).
This is a feature not a bug ;-)

## Install

You'll need either an [Anthropic API key](https://www.anthropic.com/api), or an [Open AI one](https://openai.com/index/openai-api/).

Add the key as a local environment variable called `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`.

Install the app locally with `npm install`.

You'll also need to install GraphicsMagick. It's used to convert PDF pages into images.

[There's a guide for doing that here](https://github.com/yakovmeister/pdf2image/blob/HEAD/docs/gm-installation.md).

## Run

Start the app locally with `npm start dev`.

It'll be available at http://localhost:3000/

## Current capabilities

- processing PDF forms or images of forms
- breaking a form down into questions
- distinguishing between question, hint and field text
- distinguishing between single-choice and multiple-choice questions
- recognising common question types like 'name', 'address', 'date' etc.
- recognising when an image isn't a form
- recognising when a question has conditional routing
- processing hand drawn forms
- browsing previously processed forms

## Current limitations

- it only knows about certain kinds of question types
- you can't provide your own API key via the UI
- like a lot of Gen AI, it can be unpredictable

## How it works

*Disclaimer: This is a prototype and I am not a developer ;-).*

The main UI is in [app/views/index.html](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/index.html).

Other Nunjucks page templates and macros are in [app/views](https://github.com/timpaul/form-extractor-prototype/tree/main/app/views).

Additional CSS styles are in [assets/style.scss](https://github.com/timpaul/form-extractor-prototype/blob/main/assets/style.scss).

Generate updates to the CSS with `sass assets/style.scss public/assets/style.css`.

The script in [public/assets/scripts.js](https://github.com/timpaul/form-extractor-prototype/blob/main/assets/scripts.js) enhances file upload and adds loading spinners.

The form in [index.html](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/index.html) uploads the file to the server.

If it's a PDF it uses GraphicsMagick to convert the pages into image files.

Form files are stored in subfolders in [public/results](https://github.com/timpaul/form-extractor-prototype/blob/main/public/results).

The images are sent to an LLM, along with a prompt and JSON schema, via the 'SendToLLM' function in [server.js](https://github.com/timpaul/form-extractor-prototype/blob/main/server.js).

The JSON schema for each LLM is specified in [data/](https://github.com/timpaul/form-extractor-prototype/blob/main/data/).

The results are saved as a JSON files in the subfolders in [public/results](https://github.com/timpaul/form-extractor-prototype/blob/main/public/results).

Those files are used to generate the pages that are loaded into iframes in [app/views/index.html](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/index.html).

The form components are specificed in [app/views/answer-types.njk](https://github.com/timpaul/form-extractor-prototype/blob/main/app/views/answer-types.njk)

They are built using the Nunjucks components in [GOV.UK Frontend](https://www.npmjs.com/package/govuk-frontend).

Page rendering is defined in the URL routing rules found at the bottom of [server.js](https://github.com/timpaul/form-extractor-prototype/blob/main/server.js).

