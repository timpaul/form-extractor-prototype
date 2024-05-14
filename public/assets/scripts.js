
import { JSDOM } from 'jsdom';

// Create a virtual DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

// Access the document object
const document = dom.window.document;

// Add your event listener to the form submission
document.getElementById('submit-url').addEventListener('submit', function(e) {

  // Prevent the default form submission behavior
  e.preventDefault();

  // Load image preview, loading message, and spinner when image is submitted
  const imageURL = document.getElementById('imageURL').value;
  document.getElementById('submit-url-button').innerText = "Extracting ...";
  document.getElementById('formImage').src = imageURL;
  document.getElementById('formImage').alt = "Original image";
  document.getElementById('formTabIframe').src = '/loading.html';
  document.getElementById('listTabIframe').src = '/loading.html';
  document.getElementById('jsonTabIframe').src = '/loading.html';
});

// Output the modified HTML
console.log(dom.serialize());