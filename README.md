# Masar — HR Management System

Masar is a comprehensive Human Resources Management System (HRMS) developed collaboratively by a team of six developers to modernize and automate core enterprise workflows. The platform integrates employee leave administration, video conference coordination, corporate policy distribution, workflow task boards, employee reviews, and centralized HR navigation into a unified system.

The user experience centers around an interactive, scroll-driven SVG road journey that guides users across organizational services, backed by client-side data persistence and session-aware route protection.

---

## Project Planning & Design

* **Trello Board (Agile Task Tracking):** [HR Management System Sprint Board](https://trello.com/b/Wc7vvIcG/hr-management-system-project)
* **Figma Workspace (UI/UX Mockups & Wireframes):** [Figma Prototype & Layouts](https://www.figma.com/design/badExfKz9NmjphSiPVSmr0/JS_project?node-id=2-2&p=f&t=OcBFO3RxLjSRwJT8-0)

---

## Team Ownership & Visual Studio Directory Structure

The project architecture is organized into dedicated modules, with each team member owning specific functionality aligned with the project planning board and workspace folders:

### 1. Nada Alawneh — UI/UX Design, Homepage & Core Architecture
* **Folder Location:** Root directory (`./`)
* **Core Files:** `home.html`, `home.css`, `home.js`, `team.html`, `MASAR.png`
* **Responsibilities & Deliverables:**
  * Created the UI/UX design foundation, interactive wireframes, and high-fidelity mockups in Figma.
  * Engineered the interactive homepage, SVG road path, traveler indicator, and GSAP ScrollTrigger timeline.
  * Built the software assembly simulator illustrating platform deployment stages.
  * Implemented cross-module navigation linking all platform services from the homepage.
  * Developed the global theme token engine (Light/Dark mode) and the team showcase portal (`team.html`).

### 2. Gaith Amourah — Login & Profile Developer
* **Folder Location:** `GAITH/`
* **Core Files:** `GAITH/login.html`, `GAITH/profile/profile.html`
* **Responsibilities & Deliverables:**
  * Developed the unified employee authentication and login system (`login.html`).
  * Built the employee personal profile management dashboard (`profile.html`).
  * Handled client-side session states, credential verification, and secure logout routines using browser local storage.

### 3. Amneh Hazaimeh — Employee Leave Management
* **Folder Location:** `Amneh/`
* **Core Files:** `Amneh/EMP/leaves-emp.html`
* **Responsibilities & Deliverables:**
  * Built the employee leave request portal supporting multi-category selections (Annual, Sick, Casual).
  * Implemented date range validation and reason submission forms.
  * Connected submission records directly to browser local storage for persistent data handling.

### 4. Omar Smadi — Meeting Coordination & Virtual Collaboration
* **Folder Location:** `OMAR/`
* **Core Files:** `OMAR/EmployeeMeetings/EmployeeMeetings.html`
* **Responsibilities & Deliverables:**
  * Developed the Zoom meeting scheduling and request portal (`EmployeeMeetings.html`).
  * Implemented meeting request workflows and schedule overviews.
  * Integrated local storage to track and persist upcoming virtual sessions across departments.

### 5. Tareq Bataineh — Employee Task Board
* **Folder Location:** `TAREQ/`
* **Core Files:** `TAREQ/EMP TASK/EMP_TASK.html`
* **Responsibilities & Deliverables:**
  * Developed the interactive Kanban-style task tracking board for employees (`EMP_TASK.html`).
  * Implemented workflow stage management across To Do, Doing, and Done statuses.
  * Synchronized task status updates, descriptions, and progress metrics with local storage.

### 6. Yaqeen Malkawi — Policies & Feedback
* **Folder Location:** `YAQEEN/`
* **Core Files:** `YAQEEN/companyPolicies/companyPolicies.html`, `YAQEEN/feedBackEmployee/feedBackEmployee.html`
* **Responsibilities & Deliverables:**
  * Engineered the corporate governance directory loaded dynamically from external JSON data (`companyPolicies.html`).
  * Built the employee direct feedback and evaluation portal (`feedBackEmployee.html`).
  * Handled review capture, star-rating interactions, and local persistence for employee submissions.

---

## Core Systems & Platform Features

* **Scroll-Bound Vector Road Engine:** A continuous SVG path with a dynamic traveler node tracking user scroll progress in real time.
* **Session Route Protection:** Service triggers verify login status, automatically redirecting unauthenticated visitors to the login page.
* **Contextual Authentication Header:** Navigation bar adapts dynamically to display guest actions or authenticated employee profile details and logout controls.
* **Independent Client-Side Persistence:** Workflows operate using browser `localStorage` and dynamic JSON feeds without external server dependencies.
* **Responsive Layouts:** Built-in mobile menu drawer and tailored media queries supporting mobile phones, tablets, laptops, and large displays.

---

## Directory Tree

```text
HR-MANAGEMENT-SYSTEM/
├── home.html
├── home.css
├── home.js
├── team.html
├── MASAR.png
├── README.md
├── GAITH/
│   ├── login.html
│   └── profile/
│       └── profile.html
├── Amneh/
│   └── EMP/
│       └── leaves-emp.html
├── OMAR/
│   └── EmployeeMeetings/
│       └── EmployeeMeetings.html
├── TAREQ/
│   └── EMP TASK/
│       └── EMP_TASK.html
└── YAQEEN/
    ├── companyPolicies/
    │   └── companyPolicies.html
    └── feedBackEmployee/
        └── feedBackEmployee.html
Technologies Used
Frontend: HTML5, CSS3, CSS Grid, Flexbox, Custom Theme Properties.
Logic & Data: Vanilla JavaScript (ES6+), DOM API, Web Storage API (localStorage), JSON.
Motion Graphics: GSAP 3.12.5, ScrollTrigger, Dynamic SVG Pathing.
Planning & Collaboration: Trello (Agile Board), Figma (Design System & Wireframing).
