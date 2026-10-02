# Masar — HR Management System

Masar is a comprehensive Human Resources Management System (HRMS) developed collaboratively by a team of six developers to modernize and automate core enterprise workflows[cite: 2, 5, 7]. The platform integrates employee leave administration, video conference coordination, corporate policy distribution, workflow task boards, employee reviews, and centralized HR dashboards into a unified system[cite: 1, 2, 7].

The user experience centers around an interactive, scroll-driven SVG road journey that guides users across organizational services, backed by client-side data persistence and session-aware route protection[cite: 1, 2, 3].

---

## Project Planning & Design

* **Trello Board (Agile Task Tracking):** [HR Management System Sprint Board](https://trello.com/b/Wc7vvIcG/hr-management-system-project)
* **Figma Workspace (UI/UX Mockups & Wireframes):** [Figma Prototype & Layouts](https://www.figma.com/design/badExfKz9NmjphSiPVSmr0/JS_project?node-id=2-2&p=f&t=J5I33jktOO0eJ629-0)

---

## Team Ownership & Visual Studio Directory Structure

The project architecture is organized into dedicated modules, with each team member owning specific functionality aligned with the project planning board and workspace folders[cite: 2, 5, 7]:

### 1. Nada Alawneh — Home & HR Policy & HR Dashboard & Wireframe & Mockup
* **Folder Location:** Root directory (`./`)[cite: 1, 2, 3, 5].
* **Core Files:** `home.html`, `home.css`, `home.js`, `team.html`, `MASAR.png`[cite: 1, 2, 3, 5].
* **Responsibilities & Deliverables:**
  * Created the UI/UX design foundation, interactive wireframes, and high-fidelity mockups in Figma[cite: 7].
  * Engineered the interactive homepage, SVG road path, traveler indicator, and GSAP ScrollTrigger timeline[cite: 1, 2, 3, 7].
  * Built the software assembly simulator illustrating platform deployment stages[cite: 1, 2, 3].
  * Implemented HR policy integration interfaces and HR dashboard architectural layouts[cite: 1, 2, 7].
  * Developed the global theme token engine (Light/Dark mode) and the team showcase portal (`team.html`)[cite: 1, 2, 5].

### 2. Gaith Amourah — Login & Profile Developer
* **Folder Location:** `GAITH/`[cite: 2, 5].
* **Core Files:** `GAITH/login.html`, `GAITH/profile/profile.html`[cite: 2, 5].
* **Responsibilities & Deliverables:**
  * Developed the unified employee authentication and login system (`login.html`)[cite: 2, 5, 7].
  * Built the employee personal profile management dashboard (`profile.html`)[cite: 2, 5, 7].
  * Handled client-side session states, credential verification, and secure logout routines using browser local storage[cite: 2, 3, 7].

### 3. Amneh Hazaimeh — Leave (HR + Employee)
* **Folder Location:** `Amneh/`[cite: 2, 5].
* **Core Files:** `Amneh/EMP/leaves-emp.html`[cite: 2].
* **Responsibilities & Deliverables:**
  * Built the end-to-end leave management module supporting both employee requests and HR administration workflows[cite: 1, 2, 7].
  * Configured multi-category leave selections (Annual, Sick, Casual), date range validation, and reason submissions[cite: 1, 2, 7].
  * Connected submission records directly to browser local storage for persistent data handling[cite: 1, 2, 7].

### 4. Omar Smadi — Meetings & Integration + Manage Employees Developer
* **Folder Location:** `OMAR/`[cite: 2, 5].
* **Core Files:** `OMAR/EmployeeMeetings/EmployeeMeetings.html`[cite: 2].
* **Responsibilities & Deliverables:**
  * Developed the Zoom meeting scheduling and request portal (`EmployeeMeetings.html`)[cite: 2, 7].
  * Implemented employee management features and department-wide meeting coordination tools[cite: 1, 2, 7].
  * Integrated cross-module communication channels to streamline virtual collaborations across organizational units[cite: 1, 2, 7].

### 5. Tareq Bataineh — Tasks (HR + Employee)
* **Folder Location:** `TAREQ/`[cite: 2, 5].
* **Core Files:** `TAREQ/EMP TASK/EMP_TASK.html`[cite: 2].
* **Responsibilities & Deliverables:**
  * Developed the task pipeline handling both HR task delegation and employee task execution[cite: 1, 2, 7].
  * Implemented stage tracking across To Do, Doing, and Done statuses[cite: 1, 2, 7].
  * Synchronized task assignments, descriptions, and completion metrics with local storage[cite: 1, 2, 7].

### 6. Yaqeen Malkawi — Policies & Feedback
* **Folder Location:** `YAQEEN/`[cite: 2, 5].
* **Core Files:** `YAQEEN/companyPolicies/companyPolicies.html`, `YAQEEN/feedBackEmployee/feedBackEmployee.html`[cite: 2].
* **Responsibilities & Deliverables:**
  * Engineered the corporate governance directory loaded dynamically from external JSON data (`companyPolicies.html`)[cite: 1, 2, 7].
  * Built the employee direct feedback and evaluation portal (`feedBackEmployee.html`)[cite: 2, 7].
  * Handled review capture, star-rating interactions, and local persistence for employee submissions[cite: 1, 2, 7].

---

## Core Systems & Platform Features

* **Scroll-Bound Vector Road Engine:** A continuous SVG path with a dynamic traveler node tracking user scroll progress in real time[cite: 1, 2, 3].
* **Session Route Protection:** Service triggers verify login status, automatically redirecting unauthenticated visitors to the login page[cite: 3].
* **Contextual Authentication Header:** Navigation bar adapts dynamically to display guest actions or authenticated employee profile details and logout controls[cite: 2, 3].
* **Independent Client-Side Persistence:** Workflows operate using browser `localStorage` and dynamic JSON feeds without external server dependencies[cite: 1, 2, 3].
* **Responsive Layouts:** Built-in mobile menu drawer and tailored media queries supporting mobile phones, tablets, laptops, and large displays[cite: 1, 2].

---

## Directory Tree
HR-MANAGEMENT-SYSTEM/
├── home.html
├── home.css
├── home.js
├── team.html
├── MASAR.png
├── README.md
├── GAITH/
│   ├── login.html
│   └── profile/
│       └── profile.html
├── Amneh/
│   └── EMP/
│       └── leaves-emp.html
├── OMAR/
│   └── EmployeeMeetings/
│       └── EmployeeMeetings.html
├── TAREQ/
│   └── EMP TASK/
│       └── EMP_TASK.html
└── YAQEEN/
├── companyPolicies/
│   └── companyPolicies.html
└── feedBackEmployee/
└── feedBackEmployee.html

---

## Technologies Used

* **Frontend:** HTML5, CSS3, CSS Grid, Flexbox, Custom Theme Properties[cite: 1, 2, 5].
* **Logic & Data:** Vanilla JavaScript (ES6+), DOM API, Web Storage API (`localStorage`), JSON[cite: 1, 2, 3].
* **Motion Graphics:** GSAP 3.12.5, ScrollTrigger, Dynamic SVG Pathing[cite: 1, 2, 3].
* **Planning & Collaboration:** Trello (Agile Board), Figma (Design System & Wireframing)[cite: 7].