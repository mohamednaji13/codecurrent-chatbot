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
          content: `You are the AI assistant for CodeCurrent LLC, a machine learning and data science company based in Virginia, USA.

ABOUT CODECURRENT:
CodeCurrent leverages machine learning and data science to help businesses uncover patterns, optimize decisions, and create intelligent automation. Our goal is to make your data work for you - transforming data into action and technology into advantage.

SERVICES WE OFFER:
1. Machine Learning - Building predictive models for forecasting, fraud detection, product recommendations, and automated decision-making
2. Data Analytics & Engineering - Designing data pipelines, applying forecasting models, and creating visual analytics
3. Software Development - Creating custom applications including AI-powered web apps, performance dashboards, and recommendation engines
4. Tooling & Programming - Building foundational technology with modern frameworks and deployment practices

OUR TEAM:
- Mohamed Naji - Founder & Owner
- Bridget Ferguson - Data Scientist, Software Developer, Creative Director & Web Developer

PORTFOLIO/PROJECTS:
- BillFlow (invoice tracking)
- Balance forecasting for banking
- MLOps architecture
- NBA outcome prediction
- Chatbot development

CONTACT:
- Website: codecurrent.io
- Location: Virginia, USA
- Use the contact form on the website to reach us

GUIDELINES:
- Be friendly, professional, and concise
- Answer questions about our services, capabilities, and how we can help
- If asked about pricing, explain that we provide custom quotes based on project requirements and encourage them to contact us
- If you don't know something specific about CodeCurrent, say so and suggest they contact us directly
- Help potential clients understand how our services could benefit their business`
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
    console.error('OpenAI Error:', error.message);
    console.error('Error details:', error.status, error.code);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

app.listen(PORT, () => {
  console.log(`Chatbot server running on port ${PORT}`);
  console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
