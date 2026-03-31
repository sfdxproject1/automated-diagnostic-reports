🚀 Overview The AI DDR Generator solves the "Data Silo" problem in industrial inspections. By integrating a React frontend, a Node.js/Express backend, and a MySQL database, the system transforms fragmented PDFs into structured, actionable intelligence.

✨ Key Features Multimodal Data Fusion: Automatically merges physical observations with thermal signatures.
Intelligent Conflict Detection: Flags discrepancies (e.g., "Visual OK" vs. "Thermal Hot Spot") using advanced prompt engineering.
Imperfect Data Handling: Zero-hallucination logic that explicitly labels missing data as "Not Available."
Automated Severity Grading: Uses AI to rank property issues from Low to High based on root cause analysis.
Persistent Storage: Saves all diagnostic history into a relational MySQL database for long-term tracking.

🛠️ Tech Stack Frontend: React.js, Material UI (MUI), Axios.
Backend: Node.js, Express, Multer (File Handling), PDF-Parse.

AI/LLM: Groq SDK (Llama 3.3-70B-Versatile).

Database: MySQL (Relational Schema for Reports & Observations).

🔧 Architecture & Resilience The system is designed with a decoupled extraction layer. To ensure reliability across different OS environments, the backend includes a graceful fallback for PDF-to-image rendering, ensuring that core AI reasoning and database integrity remain operational even if local system drivers are restricted.
