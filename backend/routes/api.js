const express = require('express');
const router = express.Router();

const getSystemPrompt = (responseDetail) => {
    let basePrompt = `You are "ExcelHub AI", an expert-level Excel assistant. Your responses must be clear, accurate, and formatted in Markdown. When providing formulas, use Markdown code blocks. When a visual is better, use placeholders like [CHART:bar] or [IMAGE:Description of image].`;

    if (responseDetail === 'concise') {
        return basePrompt + ` The user wants a concise answer. Be brief and to the point. Use bullet points or numbered lists. Provide ONE clear, simple example. Your entire response must be under 150 words.`;
    } else { // 'detailed'
        return basePrompt + ` The user wants a detailed answer. Provide a comprehensive explanation with logical sections (e.g., ## Syntax, ## Example). Explain the 'why' behind the steps.`;
    }
};

const handleApiRequest = async (req, res, provider) => {
  try {
    const { prompt, fileContent, fileType, responseDetail } = req.body;
    const systemPrompt = getSystemPrompt(responseDetail);

    let apiKey, url, body;

    const userParts = [{ text: prompt }];
    if (fileContent) {
        if (fileType && fileType.startsWith('image/')) {
            userParts.push({ inline_data: { mime_type: fileType, data: fileContent } });
        } else {
            const context = JSON.stringify(fileContent).slice(0, 5000);
            userParts.push({ text: `\n\nFile Context:\n${context}` });
        }
    }

    switch (provider) {
        case 'gemini':
            apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });
            url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            body = {
                contents: [{ role: "user", parts: userParts }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { maxOutputTokens: 2048 }
            };
            break;

        case 'groq':
            apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });
            url = 'https://api.groq.com/openai/v1/chat/completions';
            body = {
                model: 'llama-3.3-70b-versatile', // Latest Groq model as of 2024-06
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userParts.map(p => p.text).join('\n') } // Groq doesn't support multimodal like Gemini, so we only send text
                ],
                max_tokens: 2048
            };
            break;
        
        default:
            return res.status(400).json({ error: 'Invalid provider specified' });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': provider === 'groq' ? `Bearer ${apiKey}` : undefined
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`${provider} API Error:`, errorData);
      return res.status(response.status).json({ error: errorData?.error?.message || `HTTP ${response.status}` });
    }

    const data = await response.json();
    let responseText = '';
    if (provider === 'gemini') {
        responseText = data.candidates[0].content.parts[0].text;
    } else if (provider === 'groq') {
        responseText = data.choices[0].message.content;
    }

    res.json({ response: responseText });

  } catch (error) {
    console.error(`${provider} Server Error:`, error);
    res.status(500).json({ error: `Failed to generate response with ${provider}` });
  }
};

router.post('/gemini', (req, res) => handleApiRequest(req, res, 'gemini'));
router.post('/groq', (req, res) => handleApiRequest(req, res, 'groq'));

module.exports = router;

