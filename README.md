# AI Task Summarizer

The **AI Task Summarizer** is a lightweight, intelligent task-analysis tool that transforms long or cluttered task descriptions into clean, actionable summaries.  
It is designed for productivity workflows, project boards, and anyone who wants faster clarity when processing tasks.

🔗 **Live Deployment:** https://ai-task-summarizer.vercel.app/

---

## 🚀 Features

### ✨ AI-Powered Summaries
Automatically condense long task descriptions into concise, meaningful summaries.

### ⚡ Fast Frontend (React + Vite)
Blazing-fast development and production builds using Vite.

### 📦 Firebase Integration
Firebase powers task storage, syncing, and retrieval with real-time updates.

### 🎨 TailwindCSS UI
A clean, responsive interface styled using TailwindCSS.

### 🧩 Modular Architecture
Organized into clear modules:
- AI agent logic  
- Firebase configuration  
- UI components  
- Sample task dataset  

---

## 📁 Project Structure

```text
AI-task-summarizer-main/
├── README.md
└── ai-task-summarizer-firebase/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tasks.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── aiAgent.js
        ├── firebase.js
        ├── index.css
        └── main.jsx
```

---

## 🛠️ Local Development

1. Navigate to the Firebase app directory:
   ```bash
   cd ai-task-summarizer-firebase
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

Your app will run locally with hot reload enabled.

---

## 🌐 Deployment

The project is deployed via **Vercel**.  
To deploy your own fork:

1. Push the project to a GitHub repository.  
2. Connect the repo to Vercel.  
3. Set the project root to the `ai-task-summarizer-firebase` directory.  
4. Deploy with a single click.

---

## 🤖 AI Logic (`aiAgent.js`)

The summarization module:
- Takes raw task text as input  
- Applies summarization logic or model calls  
- Outputs a clean, concise summary  

The file is modular and ready for upgrades to more advanced AI models.

---

## 🔥 Firebase Setup

Firebase configuration lives in:

```text
src/firebase.js
```

Replace the provided configuration object with your own Firebase project settings to enable database connectivity.

---

## 🧪 Sample Tasks

`tasks.json` contains example task data for demo or testing usage.  
You may replace or expand it with your own dataset.

---

## 📜 License

This project is free for personal and educational use.  
For commercial use or integration into paid tools, please include attribution.

---

Enjoy building with **AI Task Summarizer**!
