# Form Extractor Prototype

This tool extracts the structure from an image of a form.

It uses the [Claude 3 LLM](https://claude.ai) model by Anthropic.

It replicates the form structue in JSON, following the schema used by [GOV.UK Forms](https://www.forms.service.gov.uk/).

It then uses that to generate a multi-page web form in the GOV.UK style.

## Run locally

You'll need an [Anthropic API key](https://www.anthropic.com/api).

Add the key as a local environment variable called ANTHROPIC_API_KEY.

Install the app locally with `npm install`.

Start the app with `npm start`.

It'll be available at http://localhost:3000/

## Current limitations

- it can only process images of forms, not documents
- it only knows about certain kinds of question types
- you can't provide your own API key via the UI
- you can't browse previous form extractions

## How it works

*Disclaimer: This is a prototype and I am not a developer ;-).*

The main UI is in `app/views/index.html`.

Additional CSS styles are in `public/assets/style.css`

The form in `index.html` is intercepted by the script in `public/assets/scripts.js`.

It sends the image at the URL provided by the user to the Claude API.

It does this via the 'SendToClaude' function in `server.js`.

The function makes use of the 'tools' feature of Claude.

That allows you to specify a JSON schema that you'd like it's response to conform to.

The results are saved as files in subfolders in `app/views/results`.

Those files are then loaded by `scripts.js` into iframes in `app/views/index.html`.

## Do do

- switch from saving files to better use of routes
- let users add an API key via the UI, so I can host the app somewhere
- add more question types - eg. radio and checkbox lists

