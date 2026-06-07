require("dotenv").config();

async function check() {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  console.log("Status:", res.status);
  console.log(JSON.stringify(data, null, 2));
}

check().catch(console.error);