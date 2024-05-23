/*
document.getElementById('submit-url').addEventListener('submit', function(e) {

  // Load image preview, loading message and spinner when image is submitted
  const imageURL = document.getElementById('imageURL').value;
  document.getElementById('submit-url-button').innerText = "Extracting ..."
  document.getElementById('formImage').src = imageURL;
  document.getElementById('formImage').alt = "Original image";
  document.getElementById('formTabIframe').src = '/loading.html';
  document.getElementById('listTabIframe').src = '/loading.html';
  document.getElementById('jsonTabIframe').src = '/loading.html';
});
*/


// Add class to body if the page is NOT inside an iframe
// This is to style form pages slightly differently
// if you are viewing them in a seperate tab

if ( window == window.parent ) 
{ 
  console.log("Not iFrame"); 
  document.body.classList.add("noIframe");
}



// File upload

var fileName = document.getElementById('selected-file');
var fileInput = document.getElementById('fileUpload');

fileInput.addEventListener('change', function(e) {
  fileName.innerText = fileInput.value.split("\\").pop();
});