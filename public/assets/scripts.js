document.getElementById('submit-url').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent the default form submission

  const imageURL = document.getElementById('imageURL').value;
  
  document.getElementById('formImage').src = imageURL;

  // Trigger the loading spinner
  document.getElementById('jsonTabIframe').src = 'loading.html';
  document.getElementById('listTabIframe').src = 'loading.html';
  document.getElementById('formTabIframe').src = 'loading.html';

  // Send the image to Claude
  fetch('/sendToClaude', { 
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageURL: imageURL })
  })
  .then(response => {
    if (!response.ok) {  
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    document.getElementById('jsonTabIframe').src = data.jsonFilename;
    document.getElementById('listTabIframe').src = data.listFilename;
    document.getElementById('formTabIframe').src = data.formFilename;
  })
  .catch((error) => {
    console.error('Fetch Error:', error);
    document.getElementById('response-output').textContent = 'Error: Could not get a response';
  });

});