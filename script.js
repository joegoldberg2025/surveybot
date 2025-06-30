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
const clearInputBtn = document.getElementById('clear-btn'); // Renamed for clarity
const clearChatBtn = document.getElementById('clear-chat-btn'); // New button for clearing history

// --- API Configuration ---
// WARNING: Do not expose your API key in client-side code in a public repository.
// Consider using environment variables and a server-side proxy.
const apiKey = "AIzaSyDQnPn8Rbt6NwnwjPyCW9l8GzP4XPaT02U"; // User-provided API key
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

// --- State Management ---
let imageData = null; // To store base64 image data
let chatHistory = []; // To store the conversation history

// --- Event Listeners ---

// Update word count display on slider change
wordCountSlider.addEventListener('input', () => {
    wordCountValue.textContent = wordCountSlider.value;
});

// Handle sending the message (click and Enter)
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Clear the input field and remove image
clearInputBtn.addEventListener('click', () => {
    userInput.value = '';
    removeImage();
    userInput.focus();
});

// **NEW**: Clear the entire chat history and UI
clearChatBtn.addEventListener('click', () => {
    chatWindow.innerHTML = '';
    chatHistory = [];
    removeImage();
    userInput.focus();
    // Optionally, add a "Chat cleared" message
    addMessageToUI("Chat history has been cleared.", 'system');
});


// Handle image selection via file dialog
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

// **NEW**: Handle pasting images from clipboard
userInput.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            handleImageFile(file);
            e.preventDefault(); // Prevent text paste
            break; // Handle only the first image
        }
    }
});


// Handle image removal
removeImageBtn.addEventListener('click', removeImage);

// --- Core Functions ---

/**
 * Processes an image file (from upload or paste) and displays a preview.
 * @param {File} file - The image file to process.
 */
function handleImageFile(file) {
    if (!file.type.startsWith('image/')) return;

    imageName.textContent = `Pasted: ${file.name}`;
    const reader = new FileReader();

    reader.onloadend = () => {
        imageData = reader.result.split(',')[1]; // Get base64 part
        imagePreview.src = reader.result;
        imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}


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
 * @param {string} sender - 'user', 'bot', or 'system'.
 */
function addMessageToUI(text, sender) {
    const messageDiv = document.createElement('div');
    const bubbleDiv = document.createElement('div');

    messageDiv.classList.add('flex', 'mb-4');
    bubbleDiv.classList.add('p-3', 'rounded-lg', 'max-w-xl', 'shadow-md', 'text-sm');

    switch (sender) {
        case 'user':
            messageDiv.classList.add('justify-end');
            bubbleDiv.classList.add('bg-white', 'text-gray-800', 'rounded-br-none');
            break;
        case 'bot':
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-indigo-500', 'text-white', 'rounded-bl-none');
            break;
        case 'system':
             messageDiv.classList.add('justify-center');
             bubbleDiv.classList.add('bg-gray-200', 'text-gray-600', 'text-xs');
             break;
    }

    // Sanitize text before adding to innerText
    const cleanText = text.replace(/<script.*?>.*?<\/script>/gi, '');
    bubbleDiv.innerText = cleanText;

    if (sender === 'bot') {
        const copyBtn = createCopyButton(cleanText);
        bubbleDiv.appendChild(copyBtn);
    }

    messageDiv.appendChild(bubbleDiv);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Creates a copy button for bot messages.
 * @param {string} textToCopy - The text the button will copy.
 * @returns {HTMLButtonElement} The configured copy button element.
 */
function createCopyButton(textToCopy) {
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block ml-2 text-indigo-200 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
    copyBtn.title = "Copy response";
    copyBtn.className = "ml-2 focus:outline-none";

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.title = "Copied!";
            setTimeout(() => { copyBtn.title = "Copy response"; }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };
    return copyBtn;
}

function showLoadingIndicator() {
    // Implementation remains the same...
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.classList.add('flex', 'justify-start', 'mb-4');
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

function hideLoadingIndicator() {
    // Implementation remains the same...
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
    if (!question && !imageData) return; // Don't send if both are empty

    addMessageToUI(question, 'user');
    userInput.value = '';
    showLoadingIndicator();

    const persona = countrySelect.value;
    const wordCount = wordCountSlider.value;

    // --- REVISED Prompt Engineering with History ---
    // The system prompt is now separated from the user messages.
    const systemPrompt = `
        You are a survey response generation assistant. Your goal is to help a user complete a survey by providing a high-quality, genuine-sounding answer they can use as their own.
        You must generate a response to the user's latest question from the perspective of a typical ${persona} person.
        Consider the entire conversation history to provide a relevant and contextual answer.

        **Strict Rules:**
        1. Directly answer the user's question. Frame the response as if it's the user's own answer.
        2. Your response MUST be between ${wordCount - 5 > 3 ? wordCount - 5 : 3} and ${wordCount} words. Be concise.
        3. The response must be a simple, clear, and easy-to-understand sentence.
        4. DO NOT use any of these symbols: - ! ; ?
        5. DO NOT use words like "kindness" or any other AI-like pleasantries.
        6. Sound like a real person writing a survey response. Be direct.
        7. If the user uploads an image, analyze it and incorporate your observation into the response naturally.
    `;

    // Construct the user's part of the message
    const userParts = [{ text: question }];
    if (imageData) {
        userParts.push({
            inlineData: {
                mimeType: "image/jpeg", // Or detect dynamically
                data: imageData
            }
        });
    }

    // **NEW**: Add the current user message to the history
    chatHistory.push({
        role: "user",
        parts: userParts
    });


    // --- Construct the API Payload with History ---
    const payload = {
        contents: chatHistory, // Send the whole history
        systemInstruction: { // Use the new system instruction field
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            temperature: 0.7,
        }
    };


    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorBody.error.message}`);
        }

        const result = await response.json();
        hideLoadingIndicator();

        if (result.candidates && result.candidates.length > 0) {
            const botResponsePart = result.candidates[0].content.parts[0];
            const botResponse = botResponsePart.text.trim();
            addMessageToUI(botResponse, 'bot');

            // **NEW**: Add bot's response to history
            chatHistory.push({
                role: 'model', // The API uses 'model' for its role
                parts: [{ text: botResponse }]
            });

        } else {
             if (result.promptFeedback && result.promptFeedback.blockReason) {
                addMessageToUI(`I can't answer that. Blocked for: ${result.promptFeedback.blockReason.toLowerCase()}`, 'bot');
             } else {
                addMessageToUI("Sorry, I couldn't generate a response. Please check the response payload.", 'bot');
             }
        }

    } catch (error) {
        console.error("Error fetching from API:", error);
        hideLoadingIndicator();
        addMessageToUI(`An error occurred: ${error.message}. Check the console for details.`, 'bot');
    } finally {
        removeImage(); // Clear image after sending
        userInput.focus();
    }
}
