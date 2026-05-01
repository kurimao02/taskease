TASKEASE WEB: A USER-CENTERED TASK MANAGEMENT SYSTEM FOR STUDENTS

A Final Project Paper Presented to
[Name of Instructor]
HCI 102 / HCI 2
Section: ____________________

Submitted by:
Llanto, Ira Kane M.
Dela Cruz, Altair Lawrence
Cunanan, Kristian Mark
Asoy, James David

Date of Submission: ____________________

---

## I. Title
TaskEase Web: A User-Centered Task Management System for Students

## II. Introduction
Students today often struggle with managing multiple academic tasks, deadlines, and group responsibilities. Many existing task management systems are either too complex or not designed specifically for student needs, leading to poor usability and decreased productivity.

This project introduces TaskEase Web, a web-based task management system explicitly designed to improve student workflows using Human-Computer Interaction (HCI) principles. The system focuses on simplicity, accessibility, and efficiency, allowing students to easily organize their individual tasks, monitor group progress in real-time, and manage their schedules. 

With the integration of modern UI/UX practices and real-time database syncing, this system aims to enhance the user experience by reducing cognitive load and improving task visibility, thus directly addressing the unique demands of academic life.

## III. Background of the Study
Human-Computer Interaction (HCI) emphasizes the importance of designing systems that are intuitive, efficient, and user-friendly. According to established theories (e.g., Hick's Law and Cognitive Load Theory), users prefer systems that minimize the mental effort required to understand and navigate an interface.

Many existing productivity tools fail to address student-specific needs such as academic categorization, deadline tracking, and fluid group collaboration inside a single, uncluttered environment. Complex interfaces or systems that require manual synchronization often lead to user frustration, task abandonment, and reduced engagement.

This project applies key HCI principles such as *Recognition over recall*, *Consistency in design*, *Immediate feedback*, and *Minimalist interfaces* to create a system that aligns with user expectations. TaskEase Web provides a clean layout, prominent visual task representations, interactive components, zero-refresh live updates, and color-coded priorities to drastically improve usability.

## IV. Objectives
**General Objective:**
To design and develop a user-centered web application optimized for managing, tracking, and collaborating on academic tasks.

**Specific Objectives:**
* To improve usability through a clean, intuitive, and responsive interface equipped with seamless Dark/Light mode capabilities mapping to student preferences for extended viewing comfort.
* To help students track deadlines and prioritize tasks effectively using visual hierarchies, calendar layouts, and integrated status indicators.
* To support fluid academic collaboration through real-time shared group tasks, live instant-messaging/comments inside tasks, and streamlined member invitations.
* To empower users with adequate administrative control, including group creation and dynamic member moderation.
* To apply HCI principles—specifically focusing on immediate feedback, robust error prevention, minimalist design, and smooth navigation—in the system's architecture.

## V. Problem Statement
Students commonly face challenges such as difficulty tracking deadlines, lack of organization, use of complicated or bloated tracking applications, lack of efficient collaboration tools, and a tendency to forget important tasks. Furthermore, static applications that do not update in real-time hinder vital group communication during collaborative projects.

These problems result in decreased productivity, increased stress, missed deadlines, and poor group coordination. There is a strong need for an academic task system that is visually simple, empowering for user control, and stays synchronized in real-time without user friction.

## VI. Proposed Solution
The proposed solution is **TaskEase Web**, a dedicated user-centered web application powered by a globally synced, real-time Firestore backend and secured via Google Authentication.

It provides a centralized dashboard, dynamic calendar view, academic task categorization, real-time group collaboration, live task comments, and administrative moderation. 

The system benefits students by significantly improving academic productivity and personal organization. By using clear HCI principles, it minimizes missed deadlines through robust data state management and enhances friction-free group collaboration for the broader school community.

## VII. System Design Plan

**Design Approach:**
The system adopts a minimalist, mobile-first, and highly responsive design approach based heavily on Tailwind CSS. It supports multiple display modes (Dashboard columns, Calendar grids, Group lists) to accommodate variable student workflows. The system transitions seamlessly between Dark and Light modes to protect against eye strain.

**HCI Principles Applied:**
1. **Visibility of System Status:** Task statuses update instantly visually (strikethroughs, column transitions). Zero-Refresh Live Comments provide immediate feedback.
2. **Match Between System and Real World:** Utilizes universally understood metaphors (Calendar grid for dates, Checklist icons for tasks).
3. **User Control and Freedom:** Group creators can instantly remove members. The top logo serves as a universal "Home" button.
4. **Consistency and Standards:** Unified theming and semantic color coding (Red=High Priority, Yellow=Medium, Green=Low).
5. **Error Prevention:** Destructive actions (e.g., deleting a task) are guarded by confirmation prompts.
6. **Aesthetic and Minimalist Design:** Maximizes whitespace to declutter the digital environment and reduce cognitive load.

**User Flow:**
Users log in securely via Google Authentication, landing on the main Dashboard view. From there, they can navigate via the sidebar to the Calendar View for temporal deadlines or the Groups Page for collaborative tasks. Adding or editing tasks opens a focused `TaskModal` for concentrated data entry.

*(Note: Wireframes and High-Fidelity designs would complement this section in a final report deliverable.)*

## VIII. Analysis

*(Placeholder for Context Flow Diagram and Data Flow Diagram)*

The system architecture utilizes a bi-directional data flow. Clients (users) interact with a responsive React frontend. State changes (like creating a task or sending a comment) are instantly mutated in local state (`Zustand`) for immediate UI updates, while simultaneously synchronizing with the secure, real-time `Cloud Firestore` database. 

Firestore then pushes these changes to all other connected clients, resolving any synchronization issues effortlessly.

## IX. System Development Plan
**Platform:** Web Application (Single-Page Application / SPA)

**Tools & Frameworks:**
* **Frontend:** React.js (with TypeScript for robust type-safety)
* **Styling Framework:** Tailwind CSS for rapid, responsive UI development.
* **State Management:** Zustand to handle lightweight, localized data models.
* **Backend / Database:** Firebase Authentication (Google Auth) and Cloud Firestore (NoSQL real-time document database).
* **Iconography:** Lucide React for clean, consistent SVG icons.
* **Routing:** React Router DOM for seamless navigation without page reloads.

## X. References
* Interaction Design Foundation. (n.d.). *What is Human-Computer Interaction (HCI)?* https://www.interaction-design.org/literature/topics/human-computer-interaction
* Norman, D. (2013). *The Design of Everyday Things: Revised and Expanded Edition*. Basic Books.
* Tailwind Labs. (n.d.). *Tailwind CSS Documentation*. https://tailwindcss.com/docs
* Google. (n.d.). *Firebase Documentation - Cloud Firestore*. https://firebase.google.com/docs/firestore

## XI. HCI/UI/UX Principles Applied in System Design
Designing an application tailored for students required a rigorous application of HCI and UX concepts to ensure the tool helps, rather than hinders, academic workflows. 

1. **Visibility of System Status:** Task statuses update instantly visually (strikethroughs, column transitions). Zero-refresh live comments provide immediate feedback, ensuring students are never left wondering if a system action was processed. 
2. **Match Between System and Real World:** The system utilizes universally understood layouts: Kanban boards for progressing tasks, standard calendar grids for deadlines, and familiar checklist icons, mapping perfectly to the physical planners students already use.
3. **User Control and Freedom:** TaskEase Web supports both drag-and-drop actions and click-based edits. Administrative controls give group creators the freedom to manage members seamlessly. The persistent sidebar and logo act as an immediate "emergency exit" home from any screen.
4. **Consistency and Standards:** The entire application follows a unified Zinc and Indigo color palette. Semantic feedback is consistent (e.g., Red for High priority/Destructive actions, Yellow for Medium, Green for Low), reducing the learning curve and preventing confusion.
5. **Error Prevention and Recovery:** Destructive actions, such as deleting a task or leaving a group, are strictly guarded by clear confirmation prompts to avoid accidental data loss. Furthermore, modals provide easy cancellation paths.
6. **Aesthetic and Minimalist Design (Cognitive Load Reduction):** The interface relies heavily on generous whitespace, clean layout structure, and minimal borders. An embedded Dark/Light mode toggle is integrated specifically to combat eye strain during late-night study sessions, keeping the user comfortable and focused.

## XII. Conclusion and Summary
TaskEase Web represents a significant step forward in optimizing student workflows by marrying real-time database architecture with thoughtfully applied Human-Computer Interaction principles. We successfully designed and implemented an application that directly tackles the primary issues students face: difficulties tracking deadlines, convoluted productivity apps, and poor group synchronization. 

By prioritizing a minimalist interface, immediate system feedback, and real-time live collaboration features, the system effectively lowers the cognitive load required to manage academic life. Students can now engage with their workload effortlessly, from personal assignments to highly synchronized group projects. Ultimately, TaskEase Web demonstrates how a strong commitment to user-centered design and modern cloud technologies can be combined to foster better organization, reduce mental fatigue, and encourage cohesive academic teamwork.

