const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function summarizeTasks(tasks) {
  if (!tasks || tasks.length === 0) return "No tasks to summarize.";

  const prompt = `Analyze these tasks and provide:
1. A brief summary
2. Priority ranking (High/Medium/Low for each)
3. Suggested completion order
4. Any dependencies or groupings

Tasks:
${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Provide a clear, actionable summary:`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful productivity assistant that analyzes tasks and provides clear, actionable summaries." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    } else if (data.error) {
      return `Error: ${data.error.message}`;
    }
    
    return "Could not generate summary.";
  } catch (err) {
    return `Error: ${err.message}`;
  }
}