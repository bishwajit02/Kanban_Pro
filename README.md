# KanbanPro 🚀

A modern, high-performance, and visually stunning Kanban management system inspired by the simplicity of Notion and the power of Trello. Built for creators and developers who value speed, aesthetics, and organization.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)
![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28.svg)

---

## ✨ Core Features

### 📋 Professional Kanban Board

- **Fluid Drag & Drop:** Seamlessly move tasks between "To Do", "In Progress", and "Done" columns powered by `@hello-pangea/dnd`.
- **Rich Task Metadata:** Assign priorities (Low, Medium, High), set due dates, add image attachments, and link GitHub repositories.
- **Smart Mentions:** Assign team members using an intuitive `@mention` system.
- **Visual Priorities:** Instant visual cues with color-coded ribbons and badges.

### 💡 Idea Dump (Creative Workspace)

- **Multi-format Capture:** Quickly save sticky notes, text snippets, images, and external links.
- **Folder Organization:** Categorize your creative sparks into custom folders.
- **YouTube Integration:** Paste a link and watch videos directly within your workspace.
- **Persistent Memory:** Local storage and cloud sync keep your ideas safe.

### 📊 Multi-View Dashboard

- **Kanban View:** The classic board layout for project flow.
- **Table View:** A high-density, spreadsheet-style view for batch editing and deep analysis.
- **Live Statistics:** Real-time tracking of task counts, overdue items, and priority distribution.

### 👤 Profile & Workspace

- **Custom Branding:** Personalize your display name and profile avatar.
- **Theme Engine:** Fully optimized Dark and Light modes that respect system preferences.
- **Security:** Robust authentication powered by Firebase (Google & Email/Password).

---

## 🛠 Tech Stack

- **Frontend:** [React 19](https://react.dev/) (Functional Components, Hooks)
- **Styling:** [Tailwind CSS 4.0](https://tailwindcss.com/) (Custom Design Tokens, Utility-first)
- **Animations:** [Framer Motion 12](https://www.framer.com/motion/) (Layout animations, Micro-interactions)
- **Backend/DB:** [Firebase 11](https://firebase.google.com/) (Firestore, Auth)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/) (Font Awesome, Lucide)
- **Drag & Drop:** [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)

---

## 🚀 Future Roadmap

### 1. Real-time Collaboration (Multi-player)

Implement WebSockets or Firestore Listeners to allow multiple users to edit the same board simultaneously with "presence indicators" (seeing who is currently viewing/editing).

### 2. Advanced Analytics & Insights

A dedicated "Insights" tab with burn-down charts, velocity tracking, and time-tracking data to help teams understand their productivity bottlenecks.

### 3. Third-party Integrations (Slack/GitHub Actions)

Auto-create cards from GitHub Issues and send notifications to Slack channels when a task moves to "Done".

---

## 🛠 Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/kanban-pro.git
   cd kanban-pro
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Firebase:**
   Create a `firebase.js` in the root (or update existing) with your credentials:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     // ...
   };
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## 🎨 UI System

KanbanPro uses a custom-built atomic design system located in `src/components/ui/`.

- **Button:** Variants (Primary, Secondary, Ghost, Error, Success)
- **Input:** Icon support, error states, and high-contrast focus rings.
- **Badge:** Status indicators with dot markers.
- **Card:** Motion-ready surfaces with elevation levels.
- **Modal:** Spring-animated overlays with scroll-lock.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Developed with ❤️ for the modern web.
