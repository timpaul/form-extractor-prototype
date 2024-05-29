

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

// File upload widget

var fileName = document.getElementById('selected-file');
var fileInput = document.getElementById('fileUpload');

fileInput && fileInput.addEventListener('change', function(e) {
  fileName.innerText = fileInput.value.split("\\").pop();
});