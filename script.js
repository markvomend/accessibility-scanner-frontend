const BACKEND_URL = 'https://accessibility-scanner-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('scan-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error('Scan form not found in the DOM');
    }
});

async function handleSubmit(e) {
    e.preventDefault();

    const url = document.getElementById('url').value;
    const resultsSection = document.getElementById('results');
    const loadingSection = document.getElementById('loading');
    const issuesList = document.getElementById('issues-list');

    resultsSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    issuesList.innerHTML = '';

    try {
        const encodedUrl = encodeURIComponent(url);
        const timestamp = new Date().getTime();
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
        loadingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        if (data.error) {
            issuesList.innerHTML = `<li class="text-red-500">${data.error}</li>`;
        } else {
            displayResults(data);
        }
    } catch (error) {
        console.error('Scan error:', error);
        loadingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        issuesList.innerHTML = `<li class="text-red-500">An error occurred: ${error.message}. Please try again or contact support if the issue persists.</li>`;
    }
}

function displayResults(data) {
    const reportTitle = document.getElementById('report-title');
    const generatedAt = document.getElementById('generated-at');
    
    reportTitle.textContent = `Accessibility report for ${data.pageUrl}`;
    generatedAt.textContent = `Generated at: ${new Date().toLocaleString()}`;
    
    if (data.issues.length === 0) {
        issuesList.innerHTML = `<li class="text-green-500">No accessibility issues found!</li>`;
    } else {
        renderIssues(data.issues);
        setupToggleListeners(data.issues);
        updateIssueCounts(data.issues);
    }
}

function renderIssues(issues) {
    const issuesList = document.getElementById('issues-list');
    const issuesHtml = issues.map((issue, index) => `
        <li class="bg-gray-50 p-4 rounded-md" data-type="${issue.type}">
            <h4 class="font-semibold">${index + 1}. ${issue.type.toUpperCase()}: ${issue.code}</h4>
            <p class="mt-2">${issue.message}</p>
            ${issue.context ? `<pre class="bg-gray-100 p-2 mt-2 overflow-x-auto text-sm"><code>${escapeHtml(issue.context)}</code></pre>` : ''}
            ${issue.selector ? `<p class="mt-2 text-sm text-gray-600">Selector: ${issue.selector}</p>` : ''}
        </li>
    `).join('');
    
    issuesList.innerHTML = issuesHtml;
}

function setupToggleListeners(issues) {
    const toggles = document.querySelectorAll('#result-toggles button');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const type = toggle.getAttribute('data-type');
            toggles.forEach(t => t.classList.remove('ring-2', 'ring-offset-2'));
            toggle.classList.add('ring-2', 'ring-offset-2');
            
            const filteredIssues = type === 'all' ? issues : issues.filter(issue => issue.type === type);
            renderIssues(filteredIssues);
        });
    });
}

function updateIssueCounts(issues) {
    const counts = {
        error: issues.filter(i => i.type === 'error').length,
        warning: issues.filter(i => i.type === 'warning').length,
        notice: issues.filter(i => i.type === 'notice').length
    };

    const buttons = {
        all: document.querySelector('[data-type="all"]'),
        error: document.querySelector('[data-type="error"]'),
        warning: document.querySelector('[data-type="warning"]'),
        notice: document.querySelector('[data-type="notice"]')
    };

    buttons.error.textContent = `Errors (${counts.error})`;
    buttons.warning.textContent = `Warnings (${counts.warning})`;
    buttons.notice.textContent = `Notices (${counts.notice})`;
    
    const totalIssues = counts.error + counts.warning + counts.notice;
    buttons.all.textContent = `All Issues (${totalIssues})`;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}