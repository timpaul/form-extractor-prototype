document.getElementById('submit-url').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent the default form submission

  const imageURL = document.getElementById('imageURL').value;
  
  document.getElementById('extractedWindow').src = 'loading.html';
  document.getElementById('formImage').src = imageURL;


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
    console.log(data);
    document.getElementById('extractedWindow').scrolling = "auto";
    document.getElementById('extractedWindow').src = data.filename;
  })
  .catch((error) => {
    console.error('Fetch Error:', error);
    document.getElementById('response-output').textContent = 'Error: Could not get a response';
  });

});