# Project Proposal

**Title:** TaskEase Web: A User-Centered Task Management System for Students

**Project Members:**
* Llanto, Ira Kane M.
* Dela Cruz, Altair Lawrence
* Cunanan, Kristian Mark
* Asoy, James David

---

## I. Title
TaskEase Web: A User-Centered Task Management System for Students

## II. Introduction
Students today often struggle with managing multiple academic tasks, deadlines, and group responsibilities. Many existing task management systems are either too complex or not designed specifically for student needs, leading to poor usability and decreased productivity.

This project introduces TaskEase Web, a web-based task management system designed using Human-Computer Interaction (HCI) principles. The system focuses on simplicity, accessibility, and efficiency, allowing students to easily organize their individual tasks and monitor group progress in real-time. 

With the integration of modern UI/UX practices and real-time database syncing (including live task comments and seamless state management), this system aims to enhance the user experience by reducing cognitive load and improving task visibility. The project aligns with current technological trends by providing an interactive, responsive, and secure web application.

## III. Background of the Study
Human-Computer Interaction (HCI) emphasizes the importance of designing systems that are intuitive, efficient, and user-friendly. Studies show that users prefer systems that require less effort to understand and navigate.

Many existing productivity tools fail to address student-specific needs such as academic categorization, deadline tracking, and fluid group collaboration. Complex interfaces or systems that require constant page refreshes to see updates often lead to confusion and reduced engagement.

This project applies key HCI principles such as *Recognition over recall*, *Consistency in design*, *Immediate feedback*, and *Minimalist interfaces*. The TaskEase Web application reflects these principles by offering a clean layout, prominent visual task representation, interactive components, zero-refresh live updates, and color-coded priorities that drastically improve usability.

## IV. Objectives
* To design a user-friendly web application strictly for managing and tracking academic tasks.
* To improve usability through a clean, intuitive, and responsive interface equipped with seamless Dark/Light mode capabilities mapping to student preferences.
* To help students track deadlines and prioritize tasks effectively using visual hierarchies and integrated status indicators.
* To support fluid academic collaboration through real-time shared group tasks, live instant-messaging/comments inside tasks, and streamlined member invitations.
* To give users adequate administrative control, including group creation and the ability for group creators to moderate/remove members dynamically.
* To implement strong HCI principles in system design, focusing on immediate feedback, robust error prevention, and smooth navigation.

## V. Problem Statement
Students commonly face challenges such as difficulty tracking deadlines, lack of organization, use of complicated applications, lack of efficient collaboration tools, and forgetting important tasks. Furthermore, static applications that don't update in real-time hinder group communication.

These problems result in decreased productivity, increased stress, and poor group coordination. There is a strong need for an academic system that is simple, visually clear, empowers user control, and stays updated in real-time without friction.

## VI. Proposed Solution
The proposed solution is a web application called **TaskEase Web**, powered by a globally synced, real-time Firestore database and secured via Google Authentication.

It provides a centralized dashboard, dynamic calendar view, academic task categorization, real-time group collaboration, live task comments, and administrative moderation.

Benefits include improved academic productivity, better personal organization, minimized missed deadlines, robust data state management without page stutters or 404 errors, and enhanced, friction-free group collaboration.

## VII. Scope and Limitations
**Scope:** Covers individual task creation, organization, secure Google authentication, a calendar visualizer, group generation, real-time comment synchronization, and creator-level member moderation. Ensures seamless Single-Page Application (SPA) routing.

**Limitations:** Requires an active internet connection to sync real-time data, only supports Google login for authentication, and does not include offline mode or background mobile push notifications.

## VIII. System Design
The system's modular architecture includes:
* **Dashboard:** The central hub with a unified Home navigation logo.
* **Calendar View:** A temporal visualization of deadlines.
* **Groups Page:** The collaboration interface with built-in moderation.
* **Task Modal:** The detailed interaction layer for task edits and live comments.
* **Visual Design Elements:** Uses semantic color-coded priorities, scalable typography, and highly responsive layouts adjusting from desktop to mobile screens.

## IX. Analysis
Users interact with the system via a fully responsive React frontend. Data flows bi-directionally between the client application and a real-time backend (Firebase/Firestore) using state management tools (Zustand). Real-time listeners bind directly to task comments and group members, immediately painting UI changes to the DOM across all connected clients without requiring manual refreshes.

## X. System Development & HCI/UI/UX Principles Used
Developed utilizing modern web technologies: HTML5, Tailwind CSS, TypeScript, React.js, Zustand (State Management), Firebase Authentication, Cloud Firestore, React Router DOM, and Lucide React (Universal Iconography).

### HCI, UI, and UX Principles Implemented:

**1. Visibility of System Status (Immediate Feedback):**
* **Instant Visual Cues:** Task statuses update instantly visually (strikethroughs, column transitions).
* **Zero-Refresh Live Comments:** When users collaborate inside a group task, comments appear seamlessly in real-time, eliminating the uncertainty of "Did my message send?".

**2. Match Between System and Real World:**
* **Familiar Terminology & Iconography:** Utilizing universally understood metaphors (Calendar grid for dates, Checklist icons for tasks, Gear for settings, Chat bubbles for comments).

**3. User Control and Freedom:**
* **Group Moderation Authority:** Recognizing that groups change, group creators are granted the explicit freedom to moderate their environments by seamlessly removing members.
* **Universal "Escape" & Navigation:** The top logo acts as a global "Home" button, allowing users to instantly escape any deep view and return to their safe dashboard. 

**4. Consistency and Standards:**
* **Unified Theming:** Consistent background handling and colors across Light and Dark modes prevent jarring visual shifts.
* **Semantic Color Coding:** Red always indicates High Priority/Urgency, Yellow for Medium, and Green for Low.

**5. Error Prevention & Fallbacks:**
* **Destructive Action Guards:** Prompts are strategically placed before deleting tasks or removing a group member (`window.confirm`), saving the user from costly accidental misclicks.
* **Client-Side Routing Fixes:** Implemented catch-all SPA routing (`vercel.json` rewrites) to prevent users from ever encountering broken "404 Not Found" pages when refreshing specific views.

**6. Recognition Rather Than Recall:**
* **Auto-Filtered Views:** The system does the heavy lifting of sorting tasks by "Today" or "Upcoming", so the user doesn't have to manually calculate their deadlines.
* **Visual Member Indicators:** In group views, members are displayed clearly with avatars and emails to easily recognize who is collaborating.

**7. Flexibility and Efficiency of Use (Hick's Law):**
* **Multiple Display Modes:** Accommodates variable student workflows mapping to Calendar timelines, categorized lists, and dedicated Group collaboration spaces.

**8. Aesthetic and Minimalist Design:**
* **Clean Interface:** Uses Tailwind CSS to maximize whitespace and organize structural hierarchy. By decluttering the digital environment, students experience reduced cognitive load.
* **Ergonomic Contrast:** The refined background states and seamless dark mode transitions protect users against eye-strain during extended academic sessions.
