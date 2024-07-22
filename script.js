const BACKEND_URL = 'https://accessibility-scanner-backend.onrender.com';

document.getElementById('scan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url').value;
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const resultHeader = document.getElementById('result-header');
    const issuesList = document.getElementById('issues-list');

    console.log('Form submitted');

    if (!resultsDiv || !loadingDiv || !resultHeader || !issuesList) {
        console.error('One or more required elements are missing from the DOM');
        return;
    }

    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');
    resultHeader.classList.add('hidden');

    try {
        const encodedUrl = encodeURIComponent(url);
        const timestamp = new Date().getTime();
        console.log('Sending request to:', `${BACKEND_URL}/scan?url=${encodedUrl}&t=${timestamp}`);
        
        const response = await fetch(`${BACKEND_URL}/scan?url=${encodedUrl}&t=${timestamp}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        loadingDiv.classList.add('hidden');

        if (data.error) {
            console.log('Error in data:', data.error);
            issuesList.innerHTML = `<p class="text-red-500">${data.error}</p>`;
        } else {
            console.log('Processing results');
            resultHeader.classList.remove('hidden');
            const reportTitle = document.getElementById('report-title');
            const generatedAt = document.getElementById('generated-at');
            
            if (reportTitle) {
                reportTitle.textContent = `Accessibility report for ${data.pageUrl}`;
                console.log('Report title set');
            } else {
                console.error('report-title element not found');
            }
            
            if (generatedAt) {
                generatedAt.textContent = `Generated at: ${new Date().toLocaleString()}`;
                console.log('Generated at set');
            } else {
                console.error('generated-at element not found');
            }
            
            if (data.issues.length === 0) {
                console.log('No issues found');
                issuesList.innerHTML = `<p class="text-green-500">No accessibility issues found!</p>`;
            } else {
                console.log('Rendering issues');
                renderIssues(data.issues);
                setupToggleListeners(data.issues);
                updateIssueCounts(data.issues);
            }
        }
    } catch (error) {
        console.error('Scan error:', error);
        loadingDiv.classList.add('hidden');
        issuesList.innerHTML = `<p class="text-red-500">An error occurred: ${error.message}. Please try again or contact support if the issue persists.</p>`;
    }
});

function renderIssues(issues) {
    console.log('Inside renderIssues function');
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) {
        console.error('issues-list element not found');
        return;
    }

    issuesList.innerHTML = issues.map((issue, index) => `
        <li class="bg-gray-50 p-4 rounded-md mb-4" data-type="${issue.type}">
            <h4 class="font-semibold">${index + 1}. ${issue.type.toUpperCase()}: ${issue.code}</h4>
            <p class="mt-2">${issue.message}</p>
            ${issue.context ? `<pre class="bg-gray-100 p-2 mt-2 overflow-x-auto text-sm"><code>${escapeHtml(issue.context)}</code></pre>` : ''}
            ${issue.selector ? `<p class="mt-2 text-sm text-gray-600">Selector: ${issue.selector}</p>` : ''}
        </li>
    `).join('');
    console.log('Issues rendered');
}

function setupToggleListeners(issues) {
    const toggles = document.querySelectorAll('#result-toggles button');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const type = toggle.getAttribute('data-type');
            toggles.forEach(t => t.classList.remove('bg-opacity-100'));
            toggle.classList.add('bg-opacity-100');
            
            if (type === 'all') {
                renderIssues(issues);
            } else {
                const filteredIssues = issues.filter(issue => issue.type === type);
                renderIssues(filteredIssues);
            }
        });
    });
}

function updateIssueCounts(issues) {
    const counts = {
        error: issues.filter(i => i.type === 'error').length,
        warning: issues.filter(i => i.type === 'warning').length,
        notice: issues.filter(i => i.type === 'notice').length
    };

    const errorButton = document.querySelector('[data-type="error"]');
    const warningButton = document.querySelector('[data-type="warning"]');
    const noticeButton = document.querySelector('[data-type="notice"]');
    const allButton = document.querySelector('[data-type="all"]');

    if (errorButton) errorButton.textContent = `Errors (${counts.error})`;
    if (warningButton) warningButton.textContent = `Warnings (${counts.warning})`;
    if (noticeButton) noticeButton.textContent = `Notices (${counts.notice})`;
    
    const totalIssues = counts.error + counts.warning + counts.notice;
    if (allButton) allButton.textContent = `All Issues (${totalIssues})`;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}