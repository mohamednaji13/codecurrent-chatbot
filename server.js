const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const conversationHistory = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = sessionId || Date.now().toString();

    if (!conversationHistory.has(session)) {
      conversationHistory.set(session, [
        {
          role: 'system',
          content: `You are a helpful assistant for CodeCurrent.io. Be friendly, concise, and helpful. Answer questions about the website, services, and provide general assistance.`
        }
      ]);
    }

    const history = conversationHistory.get(session);
    history.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: history,
      max_tokens: 500,
      temperature: 0.7
    });

    const assistantMessage = completion.choices[0].message.content;
    history.push({ role: 'assistant', content: assistantMessage });

    // Keep history manageable (last 20 messages)
    if (history.length > 21) {
      history.splice(1, 2);
    }

    res.json({
      reply: assistantMessage,
      sessionId: session
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

app.listen(PORT, () => {
  console.log(`Chatbot server running on port ${PORT}`);
});
