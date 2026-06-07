const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Security Assistant - Answer security questions
async function askSecurityAssistant(question, context = {}) {
  const { organizationName, userRole } = context;
  
  const systemPrompt = `You are DevSecure AI, an expert security assistant for an enterprise security platform.
  
Your role:
- Help users with security best practices
- Explain vulnerabilities and how to fix them
- Provide guidance on secret management, API keys, and credentials
- Be concise, practical, and actionable

Organization: ${organizationName || 'Unknown'}
User Role: ${userRole || 'User'}

Rules:
- Never ask for or accept real secrets/credentials
- Focus on security education
- Provide code examples when helpful
- Be professional but friendly`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      success: true,
      answer: completion.choices[0].message.content,
      usage: completion.usage
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      success: false,
      error: error.message,
      answer: "I'm having trouble connecting to my AI service. Please try again later."
    };
  }
}

// Analyze a secret for security risks
async function analyzeSecret(secretName, secretValue) {
  const prompt = `Analyze this secret for security risks:
Secret Name: ${secretName}
Secret Value Preview: ${secretValue.substring(0, 20)}...

Provide:
1. Risk assessment (Low/Medium/High/Critical)
2. Best practices for this type of secret
3. Recommendations for secure usage`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a security expert. Analyze secrets for risks and provide actionable advice.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    return {
      success: true,
      analysis: completion.choices[0].message.content
    };
  } catch (error) {
    return {
      success: false,
      analysis: "Unable to analyze secret at this time."
    };
  }
}

// Generate remediation advice for a security alert
async function getRemediationAdvice(alertType, description) {
  const prompt = `A security alert was triggered:
Alert Type: ${alertType}
Description: ${description}

Provide step-by-step remediation advice to fix this security issue.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a security incident responder. Provide clear, actionable remediation steps.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    return {
      success: true,
      advice: completion.choices[0].message.content
    };
  } catch (error) {
    return {
      success: false,
      advice: "Unable to generate remediation advice at this time."
    };
  }
}

module.exports = { askSecurityAssistant, analyzeSecret, getRemediationAdvice };