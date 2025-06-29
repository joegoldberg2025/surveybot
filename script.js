// --- DOM Element Selection ---
const countrySelect = document.getElementById('country');
const wordCountSlider = document.getElementById('word-count');
const wordCountValue = document.getElementById('word-count-value');
const imageUpload = document.getElementById('image-upload');
const imageName = document.getElementById('image-name');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');

// --- API Configuration ---
// WARNING: Do not expose your API key in client-side code in a public repository.
// Consider using environment variables and a server-side proxy.
const apiKey = "AIzaSyDQnPn8Rbt6NwnwjPyCW9l8GzP4XPaT02U"; // User-provided API key
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

let imageData = null; // To store base64 image data

// --- Event Listeners ---

// Update word count display on slider change
wordCountSlider.addEventListener('input', () => {
    wordCountValue.textContent = wordCountSlider.value;
});

// Handle sending the message
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Clear the input field
clearBtn.addEventListener('click', () => {
    userInput.value = '';
    removeImage();
    userInput.focus();
});

// Handle image selection
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        imageName.textContent = file.name;
        const reader = new FileReader();
        reader.onloadend = () => {
            imageData = reader.result.split(',')[1]; // Get base64 part
            imagePreview.src = reader.result;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Handle image removal
removeImageBtn.addEventListener('click', removeImage);

// --- Core Functions ---

function removeImage() {
    imageData = null;
    imagePreview.src = "";
    imagePreviewContainer.classList.add('hidden');
    imageName.textContent = "";
    imageUpload.value = ""; // Reset file input
}

/**
 * Adds a message to the chat window UI.
 * @param {string} text - The message text.
 * @param {string} sender - 'user' or 'bot'.
 */
function addMessageToUI(text, sender) {
    const messageDiv = document.createElement('div');
    const bubbleDiv = document.createElement('div');
    
    messageDiv.classList.add('flex', sender === 'user' ? 'justify-end' : 'justify-start');
    bubbleDiv.classList.add('p-3', 'rounded-lg', 'max-w-sm', 'shadow-md', 'text-sm');
    
    if (sender === 'user') {
        bubbleDiv.classList.add('bg-white', 'text-gray-800', 'rounded-br-none');
    } else {
        bubbleDiv.classList.add('bg-indigo-500', 'text-white', 'rounded-bl-none');
    }
    
    // Sanitize text before adding to innerText to prevent script injection
    const cleanText = text.replace(/<script.*?>.*?<\/script>/gi, '');
    bubbleDiv.innerText = cleanText;

    if (sender === 'bot') {
         // Add copy button for bot messages
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block ml-2 text-indigo-200 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
        copyBtn.title = "Copy response";
        copyBtn.onclick = () => {
            const textArea = document.createElement('textarea');
            textArea.value = cleanText; // Use the same sanitized text
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                copyBtn.title = "Copied!";
                setTimeout(() => { copyBtn.title = "Copy response"; }, 2000);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        };
        bubbleDiv.appendChild(copyBtn);
    }
    
    messageDiv.appendChild(bubbleDiv);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll
}

/**
 * Shows a loading indicator in the chat.
 */
function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.classList.add('flex', 'justify-start');
    loadingDiv.innerHTML = `
        <div class="bg-indigo-500 text-white p-3 rounded-lg rounded-bl-none max-w-sm shadow-md flex items-center space-x-2">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div class="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
    `;
    chatWindow.appendChild(loadingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Removes the loading indicator.
 */
function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Handles the entire process of sending a message and getting a response.
 */
async function handleSendMessage() {
    const question = userInput.value.trim();
    if (!question) return;

    addMessageToUI(question, 'user');
    userInput.value = '';
    showLoadingIndicator();
    
    const persona = countrySelect.value;
    const wordCount = wordCountSlider.value;

    // --- REVISED Advanced Prompt Engineering ---
    const prompt = `
        You are a survey response generation assistant. Your goal is to help a user complete a survey by providing a high-quality, genuine-sounding answer they can use as their own. 
        You must generate a response to the user's question from the perspective of a typical ${persona} person. The response should sound like it's their own thought, not your opinion.
        
        **Example:**
        User Question: "what is your dream vacation ever? why you like this place?"
        Your Response (as an Australian): "My dream vacation is exploring the Kimberley region because I love its rugged landscapes and ancient rock art."
        
        **Strict Rules:**
        1.  Directly answer the user's question. Frame the response as if it's the user's own answer.
        2.  Your response MUST be between ${wordCount - 2 > 3 ? wordCount - 2 : 3} and ${wordCount} words. Be concise.
        3.  The response must be a simple, clear, and easy-to-understand sentence.
        4.  DO NOT use any of these symbols: - ! ; ?
        5.  DO NOT use words like "kindness" or any other AI-like pleasantries.
        6.  Sound like a real person writing a survey response. Be direct.
        7.  Generate a unique and creative response each time.
        8.  If the user uploads an image, analyze it and incorporate your observation into the response naturally.
        
        The user's survey question is: "${question}"
    `;

    const contents = [{
        role: "user",
        parts: [{ text: prompt }]
    }];

    if (imageData) {
        contents[0].parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: imageData
            }
        });
    }

    const payload = { contents };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        hideLoadingIndicator();
        
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            const botResponse = result.candidates[0].content.parts[0].text.trim();
            addMessageToUI(botResponse, 'bot');
        } else {
             if (result.promptFeedback && result.promptFeedback.blockReason) {
                 addMessageToUI(`I can't answer that. The request was blocked for: ${result.promptFeedback.blockReason.toLowerCase()}`, 'bot');
             } else {
                 addMessageToUI("Sorry, I couldn't generate a response. Please try again.", 'bot');
             }
        }

    } catch (error) {
        console.error("Error fetching from API:", error);
        hideLoadingIndicator();
        addMessageToUI(`An error occurred: ${error.message}. Please check the API key and console for details.`, 'bot');
    } finally {
        removeImage();
        userInput.focus();
    }
}