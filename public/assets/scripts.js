document.getElementById('question-submission').addEventListener('submit', function(e) {
	e.preventDefault(); // Prevent the default form submission

	const question = document.getElementById('question-input').value;
  
  document.getElementById('previewWindow').src = 'loading.html';
  
	fetch('/sendToOpenAI', { // Adjust the URL as needed
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: question })
	})
	.then(response => {
    if (!response.ok) {  
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
	})
	.then(data => {
    console.log(data);
    document.getElementById('previewWindow').scrolling = "auto";
    document.getElementById('previewWindow').src = data.filename;
	})
	.catch((error) => {
    console.error('Fetch Error:', error);
    document.getElementById('response-output').textContent = 'Error: Could not get a response';
	});
});