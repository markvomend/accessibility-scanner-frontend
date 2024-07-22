// Replace this with the actual URL of your backend server
const BACKEND_URL = 'https://accessibility-scanner-backend.onrender.com';

document.getElementById('scan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url').value;
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');

    try {
        const response = await fetch(`${BACKEND_URL}/scan?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        loadingDiv.classList.add('hidden');

        if (data.error) {
            resultsDiv.innerHTML = `<p class="text-red-500">${data.error}</p>`;
        } else {
            let html = `<h2 class="text-xl font-semibold mb-2">Results for ${data.pageUrl}</h2>`;
            html += `<p class="mb-4">Document Title: ${data.documentTitle}</p>`;
            html += `<h3 class="text-lg font-semibold mb-2">Issues:</h3>`;
            
            if (data.issues.length === 0) {
                html += `<p class="text-green-500">No accessibility issues found!</p>`;
            } else {
                data.issues.forEach((issue, index) => {
                    html += `
                        <div class="bg-gray-50 p-4 rounded-md mb-4">
                            <h4 class="font-semibold">${index + 1}. ${issue.type.toUpperCase()}: ${issue.code}</h4>
                            <p class="mt-2">${issue.message}</p>
                            <pre class="bg-gray-100 p-2 mt-2 overflow-x-auto"><code>${issue.context}</code></pre>
                        </div>
                    `;
                });
            }
            resultsDiv.innerHTML = html;
        }
    } catch (error) {
        loadingDiv.classList.add('hidden');
        resultsDiv.innerHTML = `<p class="text-red-500">An error occurred: ${error.message}</p>`;
    }
});