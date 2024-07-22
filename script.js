const BACKEND_URL = 'https://accessibility-scanner-backend.onrender.com';

document.getElementById('scan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url').value;
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const resultHeader = document.getElementById('result-header');
    const issuesList = document.getElementById('issues-list');

    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');
    resultHeader.classList.add('hidden');

    try {
        const response = await fetch(`${BACKEND_URL}/scan?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        loadingDiv.classList.add('hidden');

        if (data.error) {
            issuesList.innerHTML = `<p class="text-red-500">${data.error}</p>`;
        } else {
            resultHeader.classList.remove('hidden');
            document.getElementById('report-title').textContent = `Accessibility report for ${data.pageUrl}`;
            document.getElementById('generated-at').textContent = `Generated at: ${new Date().toLocaleString()}`;
            
            if (data.issues.length === 0) {
                issuesList.innerHTML = `<p class="text-green-500">No accessibility issues found!</p>`;
            } else {
                renderIssues(data.issues);
                setupToggleListeners(data.issues);
            }
        }
    } catch (error) {
        loadingDiv.classList.add('hidden');
        issuesList.innerHTML = `<p class="text-red-500">An error occurred: ${error.message}</p>`;
    }
});

function renderIssues(issues) {
    const issuesList = document.getElementById('issues-list');
    issuesList.innerHTML = issues.map((issue, index) => `
        <li class="bg-gray-50 p-4 rounded-md" data-type="${issue.type}">
            <h4 class="font-semibold">${index + 1}. ${issue.type.toUpperCase()}: ${issue.code}</h4>
            <p class="mt-2">${issue.message}</p>
            ${issue.context ? `<pre class="bg-gray-100 p-2 mt-2 overflow-x-auto text-sm"><code>${escapeHtml(issue.context)}</code></pre>` : ''}
            ${issue.selector ? `<p class="mt-2 text-sm text-gray-600">Selector: ${issue.selector}</p>` : ''}
        </li>
    `).join('');
}

function setupToggleListeners(issues) {
    const toggles = document.querySelectorAll('#result-toggles button');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const type = toggle.getAttribute('data-type');
            const filteredIssues = issues.filter(issue => issue.type === type);
            renderIssues(filteredIssues);
        });
    });
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}