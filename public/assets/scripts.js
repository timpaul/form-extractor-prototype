

// Loading spinner and text for file upload
var el = document.getElementById('file-upload');
el && el.addEventListener('submit', function(e) {
  document.getElementById('file-upload-button').innerText = "Uploading ..."
  document.getElementById('spinner').classList.add("visible")
});

// Loading spinner and text for form extraction
var el = document.getElementById('extract-form-button');
el && el.addEventListener('click', function(e) {
  document.getElementById('extract-form-button').innerText = "Extracting ..."
  document.getElementById('spinner').classList.add("visible")
});


// Add class to body if the page is NOT inside an iframe
// This is to style form pages slightly differently
// if you are viewing them in a seperate tab

if ( window == window.parent ) 
{ 
  console.log("Not iFrame"); 
  document.body.classList.add("noIframe");
}



// File upload widget

var fileName = document.getElementById('selected-file');
var fileInput = document.getElementById('fileUpload');

fileInput && fileInput.addEventListener('change', function(e) {
  fileName.innerText = fileInput.value.split("\\").pop();
});