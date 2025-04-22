<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">

<img src="readmeai/assets/logos/purple.svg" width="30%" style="position: relative; top: 0; right: 0;" alt="Project Logo"/>

# WISEWALLET

<em>Transforming Financial Clarity into Actionable Insights Daily</em>

<!-- BADGES -->
<!-- local repository, no metadata badges. -->

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=default&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=default&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=default&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/CSS-663399.svg?style=default&logo=CSS&logoColor=white" alt="CSS">

</div>
<br>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
    - [Project Index](#project-index)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Overview

**Financial Management Developer Tool**

This project provides a comprehensive suite of tools for managing financial transactions, generating reports, and visualizing data.

**Why Financial Management Developer Tool?**

This project helps developers create robust financial management applications by providing essential features such as transaction management, report generation, data preprocessing, authentication, and chart visualization. The core features include:

- **🔒 Authentication**: Authenticates users using Firebase services and observes authentication state changes to redirect unauthenticated users.
- **💡 Report Generation**: Generates detailed PDF financial reports with balance summaries, transaction analysis, category breakdowns, and trend visualizations.
- **📊 Data Preprocessing**: Handles transaction filtering, sorting, balance calculations, date range processing, search functionality, and data aggregation for reports.
- **📈 Chart Visualization**: Uses Chart.js library to generate various types of charts.
- **💻 Transaction Management**: Enables users to list, filter, sort, and perform CRUD operations on transactions.

---

## Features

|      | Component       | Details                              |
| :--- | :-------------- | :----------------------------------- |
| ⚙️  | **Architecture**  | <ul><li>Monolithic architecture</li></ul> |
| 🔩 | **Code Quality**  | <ul><li>Clean and organized code structure</li><li>No duplicated code found</li></ul> |
| 📄 | **Documentation** | <ul><li>README.md present, but minimal information</li><li>No documentation for specific components or functions</li></ul> |
| 🔌 | **Integrations**  | <ul><li>Firebase Firestore integration for data storage</li><li>NPM package manager used for dependencies</li></ul> |
| 🧩 | **Modularity**    | <ul><li>No clear separation of concerns or modules</li></ul> |
| 🧪 | **Testing**       | <ul><li>No unit tests or integration tests found</li></ul> |
| ⚡️  | **Performance**   | <ul><li>JS code uses async/await for better performance</li></ul> |
| 🛡️ | **Security**      | <ul><li>Firebase Firestore rules for data security</li><li>No sensitive data hardcoded or exposed</li></ul> |
| 📦 | **Dependencies**  | <ul><li>NPM package manager used for dependencies</li><li>JSPDF library for PDF generation</li></ul> |
| 🚀 | **Scalability**   | <ul><li>Firebase Firestore designed for scalability</li></ul> |

**Additional Notes**

* The project uses a monolithic architecture, which may make it harder to maintain and scale.
* There is no clear separation of concerns or modules, making it difficult to understand the codebase.
* The documentation is minimal, and there is no clear explanation of specific components or functions.
* The project uses Firebase Firestore for data storage, which provides a scalable solution.

**Recommendations**

* Consider refactoring the code to use a more modular architecture (e.g., microservices).
* Improve documentation by adding comments and explanations for specific components and functions.
* Add unit tests and integration tests to ensure the code is reliable and maintainable.

---

## Project Structure

```sh
└── WiseWallet/
    ├── firebase.json
    ├── firestore-debug.log
    ├── firestore.indexes.json
    ├── firestore.rules
    ├── LICENSE
    ├── package-lock.json
    ├── package.json
    ├── public
    │   ├── .DS_Store
    │   ├── assets
    │   ├── charts.html
    │   ├── css
    │   ├── goal.html
    │   ├── help.html
    │   ├── home-page.html
    │   ├── home.html
    │   ├── index.html
    │   ├── js
    │   └── transactions.html
    ├── README.md
    └── ui-debug.log
```

### Project Index

<details open>
    <summary><b><code>C:\JUNEKIM0712\CODE\WISEWALLET/</code></b></summary>
    <!-- __root__ Submodule -->
    <details>
        <summary><b>__root__</b></summary>
        <blockquote>
            <div class='directory-path' style='padding: 8px 0; color: #666;'>
                <code><b>⦿ __root__</b></code>
            <table style='width: 100%; border-collapse: collapse;'>
            <thead>
                <tr style='background-color: #f8f9fa;'>
                    <th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
                    <th style='text-align: left; padding: 8px;'>Summary</th>
                </tr>
            </thead>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/firebase.json'>firebase.json</a></b></td>
                    <td style='padding: 8px;'>- Configures Firebase project settings, including Firestore rules and indexes, emulator ports, hosting configuration, and rewrites.This file defines the architecture of the Firebase project, enabling emulators, setting up hosting, and specifying how URLs are rewritten<br>- It also configures Firestore security rules and indexing for data consistency.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/firestore.indexes.json'>firestore.indexes.json</a></b></td>
                    <td style='padding: 8px;'>Configures Firestore indexes for efficient data retrieval.Defines the structure of indexes and field overrides for a scalable database architecture, ensuring optimal query performance and data consistency across the application.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/firestore.rules'>firestore.rules</a></b></td>
                    <td style='padding: 8px;'>- Enforces Firestore database access control by allowing read and write permissions for all documents regardless of user authentication.This file defines the security rules for a Cloud Firestore database, ensuring that all documents are accessible to any user<br>- The rules provide unrestricted access to the database, which may not be suitable for production environments but is sufficient for development or testing purposes.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/LICENSE'>LICENSE</a></b></td>
                    <td style='padding: 8px;'>- Permits the use of software under MIT License terms, allowing unrestricted distribution, modification, and commercial use<br>- Grants permission to deal with the software without restriction, subject to inclusion of copyright notice and permission notice in all copies or substantial portions<br>- Provides no warranty and disclaims liability for any claim, damages, or other liability arising from the softwares use.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/package-lock.json'>package-lock.json</a></b></td>
                    <td style='padding: 8px;'>- The provided output appears to be a JSON object representing a package dependency tree<br>- It contains information about various packages and their versions, including dependencies such as <code>regenerator-runtime</code>, <code>rgbcolor</code>, and <code>svg-pathdata</code><br>- The presence of optional dependencies suggests that some packages may not be required for all use cases.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/package.json'>package.json</a></b></td>
                    <td style='padding: 8px;'>- Declares project dependencies, specifically JSPDF version 3.0.0, which enables PDF generation functionality within the application<br>- This dependency is a critical component of the overall architecture, facilitating the creation and manipulation of PDF documents<br>- Its inclusion ensures seamless integration with other project modules, enabling efficient document processing and management.</td>
                </tr>
            </table>
        </blockquote>
    </details>
    <!-- public Submodule -->
    <details>
        <summary><b>public</b></summary>
        <blockquote>
            <div class='directory-path' style='padding: 8px 0; color: #666;'>
                <code><b>⦿ public</b></code>
            <table style='width: 100%; border-collapse: collapse;'>
            <thead>
                <tr style='background-color: #f8f9fa;'>
                    <th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
                    <th style='text-align: left; padding: 8px;'>Summary</th>
                </tr>
            </thead>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\charts.html'>charts.html</a></b></td>
                    <td style='padding: 8px;'>- The <code>charts.html</code> file serves as the primary interface for displaying financial charts, providing users with a visual representation of their income and expenses over time<br>- It enables users to filter data by date range using input fields and apply filters to view specific trends<br>- The file integrates multiple chart types, including comparison, trend, and category distribution charts.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\goal.html'>goal.html</a></b></td>
                    <td style='padding: 8px;'>- The HTML code provided appears to be a template for displaying financial goals, including savings progress and remaining amounts<br>- The code uses CSS classes to style the elements, but it lacks JavaScript functionality to update the values dynamically<br>- To enhance this code, adding interactive features or data binding would improve its usability and effectiveness.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\help.html'>help.html</a></b></td>
                    <td style='padding: 8px;'>A clear heading hierarchy using H1-H6 tags for better structure and accessibility.<em> Semantic HTML elements such as <code><header></code>, <code><nav></code>, <code><main></code>, etc., to define different sections of the page.</em> A consistent font family and size throughout the page to maintain visual consistency.* Proper use of alt text for images (if any) to improve accessibility.Overall, the code is well-organized, and with a few tweaks, it can become even more user-friendly and accessible.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\home-page.html'>home-page.html</a></b></td>
                    <td style='padding: 8px;'>- Defines the Home Page Experience**This HTML file establishes the foundation of the Wise Wallet applications home page, providing a visually appealing and user-friendly interface that showcases key features and encourages user engagement<br>- It incorporates Firebase services, Tailwind CSS, and custom stylesheets to create a seamless experience for users<br>- The layout is divided into sections, featuring a hero area with a call-to-action, navigation buttons, and a background image.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\home.html'>home.html</a></b></td>
                    <td style='padding: 8px;'>Authentication and authorization using Firebase<em> Real-time data storage and retrieval through Firestore</em> PDF generation and table formatting via jsPDF and jspdf-autotable* Chart.js library for visualizationsThe file is designed to be the starting point for users, allowing them to access various functionalities of the application.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\index.html'>index.html</a></b></td>
                    <td style='padding: 8px;'>- The public/index.html file serves as the entry point for the Wise Wallet applications user interface<br>- It enables users to sign in using various methods, including social media platforms and email/password credentials<br>- The file is responsible for rendering the login form, handling user input, and integrating with Firebase authentication services to manage user sessions.</td>
                </tr>
                <tr style='border-bottom: 1px solid #eee;'>
                    <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\transactions.html'>transactions.html</a></b></td>
                    <td style='padding: 8px;'>- The provided HTML code appears to be a template for a financial management system, featuring two main sections for income and expense tracking<br>- The layout includes headers, tables, and pagination controls for each section<br>- To enhance the user experience, consider adding JavaScript functionality to populate table data, handle form submissions, and implement pagination logic.</td>
                </tr>
            </table>
            <!-- css Submodule -->
            <details>
                <summary><b>css</b></summary>
                <blockquote>
                    <div class='directory-path' style='padding: 8px 0; color: #666;'>
                        <code><b>⦿ public.css</b></code>
                    <table style='width: 100%; border-collapse: collapse;'>
                    <thead>
                        <tr style='background-color: #f8f9fa;'>
                            <th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
                            <th style='text-align: left; padding: 8px;'>Summary</th>
                        </tr>
                    </thead>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\css\goal.css'>goal.css</a></b></td>
                            <td style='padding: 8px;'>- Enables visually appealing animations across the application, enhancing user experience through fade-in, slide-up, rotate, and scale effects on various elements such as cards, progress circles, icons, and information sections<br>- Also includes hover effects and a transition animation for the progress bar, contributing to an engaging and interactive interface.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\css\help.css'>help.css</a></b></td>
                            <td style='padding: 8px;'>- Stylesheet configuration is defined in this file, which enables consistent visual presentation of help content across the application.It plays a crucial role in maintaining the projects overall aesthetic and user experience by specifying layout, typography, and color schemes<br>- Its modifications can significantly impact how users interact with the application's help features.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\css\home-page.css'>home-page.css</a></b></td>
                            <td style='padding: 8px;'>- The home-page.css file defines animations for a typewriter effect on the webpage<br>- It creates a dynamic typing animation and a blinking caret animation to mimic a manual typists movement<br>- The file also includes reduced motion settings, providing an alternative text sequence for users who prefer reduced motion<br>- This enables a seamless user experience across different preferences.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\css\home.css'>home.css</a></b></td>
                            <td style='padding: 8px;'>- The provided CSS file appears to be a comprehensive styling guide for a financial application, covering various components such as navigation arrows, touch scroll support, and animations<br>- The code is well-organized and utilizes modern CSS features like keyframe animations and custom properties<br>- Overall, the file demonstrates a high level of attention to detail and adherence to best practices.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\css\index.css'>index.css</a></b></td>
                            <td style='padding: 8px;'>- Stylesheet configuration is defined within this file, governing the visual presentation of the application across various devices and screen sizes.It establishes a consistent aesthetic by specifying color schemes, typography, and layout rules that are applied throughout the project<br>- This enables developers to maintain a cohesive user experience while allowing for flexibility in design customization.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\css\nav.css'>nav.css</a></b></td>
                            <td style='padding: 8px;'>- Styles navigation elements, including logo, links, and sign-out button, with responsive adjustments for different screen sizes<br>- Defines colors, font sizes, padding, and other visual properties to create a consistent look and feel across the application<br>- Enhances user experience through hover effects, animations, and active state styling.</td>
                        </tr>
                    </table>
                </blockquote>
            </details>
            <!-- js Submodule -->
            <details>
                <summary><b>js</b></summary>
                <blockquote>
                    <div class='directory-path' style='padding: 8px 0; color: #666;'>
                        <code><b>⦿ public.js</b></code>
                    <table style='width: 100%; border-collapse: collapse;'>
                    <thead>
                        <tr style='background-color: #f8f9fa;'>
                            <th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
                            <th style='text-align: left; padding: 8px;'>Summary</th>
                        </tr>
                    </thead>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\charts.js'>charts.js</a></b></td>
                            <td style='padding: 8px;'>- The charts.js file is responsible for rendering financial transaction data on the dashboard, providing real-time updates and visualizations of income vs expenses, category distribution, and monthly trends<br>- It fetches user transactions from the database, filters and processes the data, and updates the charts accordingly based on user input and authentication state changes.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\db.js'>db.js</a></b></td>
                            <td style='padding: 8px;'>- Database Access and Manipulation Module**This module provides a set of functions to interact with the Firebase Firestore database, enabling users to manage their financial data, including transactions, income, expenses, categories, and user authentication<br>- It offers CRUD operations for custom categories and retrieves all categories organized by type.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\goal.js'>goal.js</a></b></td>
                            <td style='padding: 8px;'>- Initializes user goals by retrieving transactions from the database, calculating current balance, and updating goal cards with progress, remaining amount, and current savings information<br>- Ensures seamless integration with Firebase authentication and database access<br>- Provides a dynamic display of users financial progress towards predefined goals.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\help.js'>help.js</a></b></td>
                            <td style='padding: 8px;'>- Enables user support features, documentation access, and sign out functionality on the help page, providing a seamless experience for users to manage their account and access resources<br>- Integrates with Firebase authentication to facilitate secure sign-out operations.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\home.js'>home.js</a></b></td>
                            <td style='padding: 8px;'>- Dashboard display and updates<em> Transaction management</em> Chart visualization<em> Filter controls</em> Modal interactions* PDF report generationThis module integrates with other parts of the codebase, including data preprocessing, database access, and chart plotting libraries, to deliver a comprehensive home page experience<br>- By leveraging Firebase authentication and Firestore database, it ensures secure and efficient data retrieval and manipulation.The code file is designed to be modular and reusable, allowing for easy maintenance and updates as the project evolves<br>- Its functionality is essential for providing users with a robust and interactive home page experience.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\login.js'>login.js</a></b></td>
                            <td style='padding: 8px;'>- Handles user authentication through Google sign-in integration, manages authentication state, and redirects users to the home page upon successful login<br>- It also handles user session management, ensuring seamless transitions between login and authenticated states within the application.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\plot.js'>plot.js</a></b></td>
                            <td style='padding: 8px;'>- The provided code is a collection of functions that generate various types of charts using the Chart.js library<br>- The functions are named <code>plotBarChart</code>, <code>plotLineChart</code>, and others, indicating their purpose<br>- Each function takes in chart data and options as parameters to customize the appearance and behavior of the chart.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\preprocess.js'>preprocess.js</a></b></td>
                            <td style='padding: 8px;'>- Data processing module handles transaction filtering, sorting, balance calculations, date range processing, search functionality, and data aggregation for reports<br>- It provides functions to generate summaries, calculate running balances, project future balances, filter transactions by date range, sort transactions, and validate transaction dates<br>- This module is a crucial component of the overall application architecture.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\report.js'>report.js</a></b></td>
                            <td style='padding: 8px;'>Balance summaries<em> Transaction analysis</em> Category breakdowns<em> Trend visualizationsThis module uses external libraries to create professional-looking PDF reports, ensuring that users receive comprehensive and easy-to-understand financial information.<strong>Key Functionality:</strong></em> Integrates with other modules (preprocess.js, db.js, plot.js) to collect and process data<em> Utilizes jsPDF for PDF generation and jspdf-autotable for table formatting (if installed)</em> Includes a check for Chart.js library to ensure proper functionalityBy leveraging this report generation module, users can access actionable financial insights, making it an essential component of the projects overall architecture.</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #eee;'>
                            <td style='padding: 8px;'><b><a href='C:\JuneKim0712\Code\WiseWallet/blob/master/public\js\transactions.js'>transactions.js</a></b></td>
                            <td style='padding: 8px;'>- Authenticates users using Firebase services<em> Observes authentication state changes to redirect unauthenticated users</em> Stores transaction data in memory (incomeData, expenseData)<em> Implements pagination with a configurable items-per-page setting</em> Provides a <code>filterTransactionsByType</code> function to categorize transactions by typeThe code is designed to work seamlessly with other project components, including preprocessing and database operations<br>- Its primary goal is to provide a user-friendly interface for managing financial transactions while ensuring data integrity and security.</td>
                        </tr>
                    </table>
                </blockquote>
            </details>
        </blockquote>
    </details>
</details>

---

## Getting Started

### Prerequisites

This project requires the following dependencies:

- **Programming Language:** JavaScript
- **Package Manager:** Npm

### Installation

Build WiseWallet from the source and intsall dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone ../WiseWallet
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd WiseWallet
    ```

3. **Install the dependencies:**

<!-- SHIELDS BADGE CURRENTLY DISABLED -->
    <!-- [![npm][npm-shield]][npm-link] -->
    <!-- REFERENCE LINKS -->
    <!-- [npm-shield]: https://img.shields.io/badge/npm-CB3837.svg?style={badge_style}&logo=npm&logoColor=white -->
    <!-- [npm-link]: https://www.npmjs.com/ -->

    **Using [npm](https://www.npmjs.com/):**

    ```sh
    ❯ npm install
    ```

### Usage

Run the project with:

**Using [npm](https://www.npmjs.com/):**
```sh
npm start
```

### Testing

Wisewallet uses the {__test_framework__} test framework. Run the test suite with:

**Using [npm](https://www.npmjs.com/):**
```sh
npm test
```

---

## Roadmap

- [X] **`Task 1`**: <strike>Implement feature one.</strike>
- [ ] **`Task 2`**: Implement feature two.
- [ ] **`Task 3`**: Implement feature three.

---

## Contributing

- **💬 [Join the Discussions](https://LOCAL/Code/WiseWallet/discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://LOCAL/Code/WiseWallet/issues)**: Submit bugs found or log feature requests for the `WiseWallet` project.
- **💡 [Submit Pull Requests](https://LOCAL/Code/WiseWallet/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your LOCAL account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone C:\JuneKim0712\Code\WiseWallet
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to LOCAL**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!
</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://LOCAL{/Code/WiseWallet/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=Code/WiseWallet">
   </a>
</p>
</details>

---

## License

Wisewallet is protected under the [LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

## Acknowledgments

- Credit `contributors`, `inspiration`, `references`, etc.

<div align="right">

[![][back-to-top]](#top)

</div>


[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-151515?style=flat-square


---
