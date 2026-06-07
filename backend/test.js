require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("Key exists:", !!process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

async function test() {
  try {
    const result = await model.generateContent("Say hello");
    console.log(result.response.text());
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}

test();