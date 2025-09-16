// js/main.js - Simplified approach without complex imports
console.log('Main.js loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Initialize the application
    initializeApp();
});

// Application state
const appState = {
    currentFile: null,
    fileContent: null,
    fileType: null,
    isGenerating: false,
    charts: []
};

// DOM Elements
const elements = {
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    removeFile: document.getElementById('removeFile'),
    // filePreview: document.getElementById('filePreview'),
    userQuery: document.getElementById('userQuery'),
    apiProvider: document.getElementById('apiProvider'),
    responseDetail: document.getElementById('responseDetail'), // Added this line
    generateBtn: document.getElementById('generateBtn'),
    loadingState: document.getElementById('loadingState'),
    errorMessage: document.getElementById('errorMessage'),
    generatedContent: document.getElementById('generatedContent'),
    outputContainer: document.getElementById('output-container'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText')
};

// Initialize the application
function initializeApp() {
    console.log('Initializing app');
    console.log('Elements found:', elements);
    
    // Check if all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element not found: ${key}`);
        }
    }
    
    // Set up event listeners
    setupEventListeners();
    
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // File upload events
    if (elements.dropZone) {
        elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    }
    
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (elements.removeFile) {
        elements.removeFile.addEventListener('click', removeFile);
    }
    
    // Drag and drop events
    if (elements.dropZone) {
        ['dragover', 'drop'].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, e => e.preventDefault());
        });
        elements.dropZone.addEventListener('dragenter', () => elements.dropZone.classList.add('file-drop-active'));
        elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('file-drop-active'));
        elements.dropZone.addEventListener('drop', e => {
            elements.dropZone.classList.remove('file-drop-active');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }
    if (elements.generateBtn) {
        elements.generateBtn.addEventListener('click', generateGuide);
    }
}

// File handling functions
function handleFileSelect(e) {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
}

function handleFile(file) {
    if (!file) return;
    
    appState.currentFile = file;
    appState.fileType = file.type;
    
    elements.fileName.textContent = file.name;
    elements.fileInfo.classList.remove('hidden');
    
    const reader = new FileReader();
    
    if (file.type.startsWith('image/')) {
        reader.onload = (e) => {
            appState.fileContent = e.target.result.split(',')[1];
            // elements.filePreview.innerHTML = `<img src="${e.target.result}" class="max-w-full h-48 rounded-lg shadow-md">`;
            showNotification('Image file loaded successfully!');
        };
        reader.readAsDataURL(file);
    } else if (file.name.endsWith('.csv')) {
        reader.onload = (e) => {
            Papa.parse(e.target.result, {
                complete: (results) => {
                    appState.fileContent = results.data;
                    // displayCSVPreview(results.data);
                    showNotification('CSV file loaded successfully!');
                },
                header: true,
                skipEmptyLines: true
            });
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                appState.fileContent = jsonData;
                displayExcelPreview(jsonData);
                showNotification('Excel file loaded successfully!');
            } catch (error) {
                showError('Error reading Excel file. Please try again.');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        appState.fileContent = null;
        // elements.filePreview.innerHTML = '<p class="text-sm text-gray-500">File loaded. Content will be described in the query.</p>';
        showNotification('File uploaded successfully!');
    }
}

// function displayCSVPreview(data) {
//     if (!data || data.length === 0) return;
    
//     const preview = data.slice(0, 6);
//     const headers = Object.keys(preview[0]);
    
//     let html = '<div class="overflow-x-auto bg-white rounded-lg border"><table class="min-w-full text-sm"><thead><tr>';
//     headers.forEach(header => {
//         html += `<th class="px-3 py-2 bg-gray-50 font-medium text-left border-b">${header}</th>`;
//     });
//     html += '</tr></thead><tbody>';
    
//     preview.forEach((row, index) => {
//         html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
//         headers.forEach(header => {
//             html += `<td class="px-3 py-2 border-b text-gray-700">${row[header] || ''}</td>`;
//         });
//         html += '</tr>';
//     });
    
//     html += '</tbody></table></div>';
//     html += `<p class="text-xs text-gray-500 mt-2">📊 Showing first 6 rows of ${data.length} total rows | ${headers.length} columns</p>`;
    
//     elements.filePreview.innerHTML = html;
// }

// function displayExcelPreview(data) {
//     if (!data || data.length === 0) return;
    
//     const preview = data.slice(0, 6);
    
//     let html = '<div class="overflow-x-auto bg-white rounded-lg border"><table class="min-w-full text-sm"><tbody>';
    
//     preview.forEach((row, rowIndex) => {
//         html += `<tr class="${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
//         row.forEach((cell, cellIndex) => {
//             const tag = rowIndex === 0 ? 'th' : 'td';
//             const classes = rowIndex === 0 ? 'px-3 py-2 bg-gray-50 font-medium border-b' : 'px-3 py-2 border-b text-gray-700';
//             html += `<${tag} class="${classes}">${cell || ''}</${tag}>`;
//         });
//         html += '</tr>';
//     });
    
//     html += '</tbody></table></div>';
//     html += `<p class="text-xs text-gray-500 mt-2">📊 Showing first 6 rows of ${data.length} total rows</p>`;
    
//     elements.filePreview.innerHTML = html;
// }

function removeFile() {
    appState.currentFile = null;
    appState.fileContent = null;
    appState.fileType = null;
    elements.fileInfo.classList.add('hidden');
    // elements.filePreview.innerHTML = '';
    elements.fileInput.value = '';
    showNotification('File removed');
}

// Load quick answers with better error handling
async function loadQuickAnswers() {
    elements.quickAnswers.innerHTML = '';
    elements.quickAnswersError.classList.add('hidden');
    try {
        const response = await fetch('data/quickAnswers.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const quickAnswersDB = await response.json();
        
        quickAnswersDB.forEach((item, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'bg-white/50 border border-gray-200 rounded-lg overflow-hidden';
            answerElement.innerHTML = `
                <div class="p-3 cursor-pointer flex justify-between items-center" onclick="toggleAccordion(${index})">
                    <h3 class="font-medium text-gray-700">${item.question}</h3>
                    <svg class="w-5 h-5 text-gray-500 transform transition-transform" id="accordion-icon-${index}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                <div class="accordion-content" id="accordion-content-${index}">
                    <div class="p-4 pt-0 border-t border-gray-100 text-sm text-gray-600">${marked.parse(item.answer)}</div>
                </div>`;
            elements.quickAnswers.appendChild(answerElement);
        });
    } catch (error) {
        console.error('Error loading quick answers:', error);
        elements.quickAnswersError.textContent = 'Could not load quick answers.';
        elements.quickAnswersError.classList.remove('hidden');
    }
}

// UI Helper functions
function showLoading() {
    appState.isGenerating = true;
    elements.loadingState.classList.remove('hidden');
    elements.generateBtn.disabled = true;
    elements.errorMessage.classList.add('hidden');
}

function hideLoading() {
    appState.isGenerating = false;
    elements.loadingState.classList.add('hidden');
    elements.generateBtn.disabled = false;
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
}

function showNotification(message) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    setTimeout(() => { elements.notification.classList.remove('show'); }, 3000);
}

// API Integration functions
async function callBackendAPI(provider, payload) { // Changed to accept a payload object
    const response = await fetch(`/api/${provider}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)}: ${errorData?.error || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    return data.response;
}


// Main generation function with fallback
async function generateGuide() {
    console.log('generateGuide function called');
    
    const query = elements.userQuery.value.trim();
    const selectedProvider = elements.apiProvider.value;
    const responseDetail = elements.responseDetail.value; // Get the detail level
    
    console.log('Query:', query);
    console.log('Selected provider:', selectedProvider);
    
    if (!query) {
        showError('Please enter a question about Excel');
        return;
    }

    try {
        showLoading();
        
        // Create a payload object to send to the backend
        const payload = {
            prompt: query,
            fileContent: appState.fileContent,
            fileType: appState.fileType,
            responseDetail: responseDetail
        };

        const response = await callBackendAPI(selectedProvider, payload);
        
        if (response) {
            displayGeneratedContent(response);
            showNotification(`Guide generated successfully using ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}!`);
        } else {
            // This case might not be reached if callBackendAPI throws an error, but it's good practice
            throw new Error('Received an empty response from the server.');
        }
        
    } catch (error) {
        showError(`Error: ${error.message}`);
        // Show demo content on failure if no API keys are set on the backend
        if (error.message.includes("API key not configured")) {
             showDemoContent(query);
        }
    } finally {
        hideLoading(); // Ensures loading is hidden, even if there's an error
    }
}

// Demo content function
function showDemoContent(query) {
    console.log('Showing demo content for:', query);
    
    const demoResponse = `# Excel Guide: ${query}\n\n## Introduction\n\nThis is a demo response for your query: "${query}". In a real implementation with an API key, this would be replaced with a detailed, AI-generated guide.\n\n## Steps to Implement\n\n1. **Get an API Key**: Visit the provider's website (Google Gemini, Groq, or Hugging Face) to get a free API key.\n2. **Enter Your API Key**: Paste your API key in the API Key field above.\n3. **Generate Guide**: Click the "Generate Guide" button to get a personalized guide.\n\n## Example\n\nHere's a simple example of how to use VLOOKUP:\n\n\`\`\`excel
=VLOOKUP("Apple", A2:C10, 3, FALSE)
\`\`\`\n\nThis formula looks for "Apple" in column A and returns the corresponding value from column C.\n\n## Tips\n\n- Always use FALSE for exact matches in VLOOKUP\n- Ensure your data is properly formatted\n- Use named ranges for easier formulas`;
    
    displayGeneratedContent(demoResponse);
    showNotification('Demo content loaded. Add an API key for personalized responses!');
}

// Display generated content
function displayGeneratedContent(content) {
    console.log('Displaying generated content');
    
    // Clear previous content and charts
    elements.generatedContent.innerHTML = '';
    appState.charts.forEach(chart => chart.destroy());
    appState.charts = [];
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(content);
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Auto-scroll logic
    setTimeout(() => {
        elements.outputContainer.scrollTo({
            top: elements.outputContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
    
    // Process the content and add it to the DOM
    processContent(tempDiv, elements.generatedContent);
}

// Process content for charts and special elements
function processContent(sourceElement, targetElement) {
    // Clone nodes to avoid modifying the original
    const nodes = Array.from(sourceElement.childNodes);
    
    nodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            targetElement.appendChild(node.cloneNode(true));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            
            if (tagName === 'pre' && node.querySelector('code')) {
                // Handle code blocks
                const codeBlock = document.createElement('pre');
                codeBlock.className = 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4';
                
                const code = document.createElement('code');
                code.textContent = node.querySelector('code').textContent;
                codeBlock.appendChild(code);
                
                targetElement.appendChild(codeBlock);
            } else if (tagName === 'table') {
                // Handle tables
                const table = document.createElement('table');
                table.className = 'w-full border-collapse mb-4';
                
                // Copy all child nodes
                Array.from(node.childNodes).forEach(child => {
                    const clonedChild = child.cloneNode(true);
                    
                    if (child.tagName === 'THEAD') {
                        const thead = document.createElement('thead');
                        Array.from(child.childNodes).forEach(row => {
                            const clonedRow = row.cloneNode(true);
                            Array.from(row.childNodes).forEach(cell => {
                                const clonedCell = cell.cloneNode(true);
                                clonedCell.className = 'bg-gray-100 border border-gray-300 px-4 py-2 text-left font-semibold';
                                clonedRow.appendChild(clonedCell);
                            });
                            thead.appendChild(clonedRow);
                        });
                        table.appendChild(thead);
                    } else if (child.tagName === 'TBODY') {
                        const tbody = document.createElement('tbody');
                        Array.from(child.childNodes).forEach(row => {
                            const clonedRow = row.cloneNode(true);
                            Array.from(row.childNodes).forEach(cell => {
                                const clonedCell = cell.cloneNode(true);
                                clonedCell.className = 'border border-gray-300 px-4 py-2';
                                clonedRow.appendChild(clonedCell);
                            });
                            tbody.appendChild(clonedRow);
                        });
                        table.appendChild(tbody);
                    } else {
                        table.appendChild(clonedChild);
                    }
                });
                
                targetElement.appendChild(table);
            } else if (tagName === 'img') {
                // Handle images
                const img = document.createElement('img');
                img.src = node.src;
                img.alt = node.alt || 'Excel example';
                img.className = 'rounded-lg shadow-md my-4 max-w-full';
                targetElement.appendChild(img);
            } else if (tagName === 'p' && node.textContent.includes('[CHART:')) {
                // Handle chart placeholders
                const chartMatch = node.textContent.match(/\[CHART:(.*?)\]/);
                if (chartMatch) {
                    const chartType = chartMatch[1];
                    createChart(chartType, targetElement);
                }
            } else {
                // Recursively process other elements
                const clonedElement = node.cloneNode(false);
                processContent(node, clonedElement);
                targetElement.appendChild(clonedElement);
            }
        }
    });
}

// Create charts
function createChart(type, container) {
    console.log('Creating chart of type:', type);
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    container.appendChild(chartContainer);
    
    const ctx = document.createElement('canvas');
    chartContainer.appendChild(ctx);
    
    let chartConfig;
    
    switch (type.toLowerCase()) {
        case 'bar':
            chartConfig = {
                type: 'bar',
                data: {
                    labels: ['January', 'February', 'March', 'April', 'May'],
                    datasets: [{
                        label: 'Sales Data',
                        data: [65, 59, 80, 81, 56],
                        backgroundColor: [
                            'rgba(102, 126, 234, 0.7)',
                            'rgba(118, 75, 162, 0.7)',
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)'
                        ],
                        borderColor: [
                            'rgba(102, 126, 234, 1)',
                            'rgba(118, 75, 162, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sample Sales Data'
                        }
                    }
                }
            };
            break;
            
        case 'line':
            chartConfig = {
                type: 'line',
                data: {
                    labels: ['January', 'February', 'March', 'April', 'May'],
                    datasets: [{
                        label: 'Revenue',
                        data: [65, 59, 80, 81, 56],
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Revenue Trend'
                        }
                    }
                }
            };
            break;
            
        case 'pie':
            chartConfig = {
                type: 'pie',
                data: {
                    labels: ['Product A', 'Product B', 'Product C', 'Product D'],
                    datasets: [{
                        data: [30, 25, 20, 25],
                        backgroundColor: [
                            'rgba(102, 126, 234, 0.7)',
                            'rgba(118, 75, 162, 0.7)',
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)'
                        ],
                        borderColor: [
                            'rgba(102, 126, 234, 1)',
                            'rgba(118, 75, 162, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Product Distribution'
                        }
                    }
                }
            };
            break;
            
        default:
            // Default to a bar chart
            chartConfig = {
                type: 'bar',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [{
                        label: 'Quarterly Data',
                        data: [25, 30, 35, 40],
                        backgroundColor: 'rgba(102, 126, 234, 0.7)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Quarterly Performance'
                        }
                    }
                }
            };
    }
    
    const chart = new Chart(ctx, chartConfig);
    appState.charts.push(chart);
}