const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const results = document.getElementById('results');
const status = document.getElementById('status');

// Handle Click to Upload
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleImage(e.target.files[0]);

// Handle Paste (The magic part)
window.onpaste = (e) => {
    const item = e.clipboardData.items[0];
    if (item.type.indexOf("image") !== -1) {
        handleImage(item.getAsFile());
    }
};

async function handleImage(file) {
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        processWithAI(e.target.result);
    };
    reader.readAsDataURL(file);
}

async function processWithAI(base64Image) {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        alert("Please enter your Pollinations API Key first!");
        return;
    }

    status.classList.remove('hidden');
    results.classList.add('hidden');

    const systemPrompt = `You are a Thai social assistant. Analyze the chat screenshot. 
    1. Identify the relationship (looks like พี่/น้อง context). 
    2. Provide 3 suggested replies in Thai for 'Tent' (the green bubble user).
    3. Output ONLY a JSON object with keys: 'supportive', 'casual', 'action'. 
    Ensure the Thai particles (ครับ/นะ) match the user's style in the image.`;

    try {
        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "openai",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this chat and suggest replies." },
                            { type: "image_url", image_url: { url: base64Image } }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        // Update UI
        document.getElementById('text1').innerText = content.supportive;
        document.getElementById('text2').innerText = content.casual;
        document.getElementById('text3').innerText = content.action;

        status.classList.add('hidden');
        results.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert("Error analyzing image. Check your API key or connection.");
        status.classList.add('hidden');
    }
}

function copyToClipboard(id) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
}