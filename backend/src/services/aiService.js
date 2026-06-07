const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate response with retry and fallback
async function generateResponse(prompt) {
  const modelNames = [
    "gemini-2.5-flash",
    "gemini-2.5-pro"
  ];

  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (err) {
          if (err.status === 503 && attempt < 3) {
            console.log(
              `${modelName}: Retry ${attempt}/3 after 2 seconds...`
            );

            await new Promise((resolve) =>
              setTimeout(resolve, 2000)
            );

            continue;
          }

          throw err;
        }
      }
    } catch (err) {
      console.error(`${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models unavailable");
}

// Security Assistant - Answer security questions
async function askSecurityAssistant(question, context = {}) {
  const { organizationName, userRole } = context;

  const prompt = `You are DevSecure AI, an expert security assistant for an enterprise security platform.

Your role:
- Help users with security best practices
- Explain vulnerabilities and how to fix them
- Provide guidance on secret management, API keys, and credentials
- Be concise, practical, and actionable

Organization: ${organizationName || "Unknown"}
User Role: ${userRole || "User"}

Rules:
- Never ask for or accept real secrets/credentials
- Focus on security education
- Provide code examples when helpful
- Be professional but friendly

User Question: ${question}`;

  try {
    const answer = await generateResponse(prompt);

    return {
      success: true,
      answer,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);

    return {
      success: false,
      error: error.message,
      answer:
        error.status === 503
          ? "AI service is currently busy. Please try again in a few moments."
          : "I'm having trouble connecting to my AI service. Please try again later.",
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
    const analysis = await generateResponse(prompt);

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);

    return {
      success: false,
      analysis: "Unable to analyze secret at this time.",
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
    const advice = await generateResponse(prompt);

    return {
      success: true,
      advice,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);

    return {
      success: false,
      advice: "Unable to generate remediation advice at this time.",
    };
  }
}

module.exports = {
  askSecurityAssistant,
  analyzeSecret,
  getRemediationAdvice,
};