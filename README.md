# Form Extractor Prototype

This tool extracts the structure from an image of a form.

It uses the [Claude 3 LLM](https://claude.ai) model by Anthropic.

Right now it generates the structue in JSON, following the scema used by [GOV.UK Forms](https://www.forms.service.gov.uk/).

I'm hoping to get it generating actual multi-page web forms in the GOV.UK style though.

## Run locally

You'll need an [Anthropic API key](https://www.anthropic.com/api).

Add the key as a local environment variable called ANTHROPIC_API_KEY.

Install the app locally with 'npm install'.

Start the app with 'npm start'.

It'll be available at http://localhost:3000/

## Current limitations

- it can omly process images of forms, not documents
- it only extracts the question title, hint and type
- you can't provide your own API key via the UI
