# Grabbe AI Backend

This repository contains the backend code for the **Grabbe AI** project. It serves as the API layer for interacting with the Grabbe AI frontend and integrates with OpenAI's models, MySQL database, and JWT-based authentication. This backend also uses IPinfo for geolocation data.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Development](#development)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [License](#license)

## Features

- **OpenAI Integration**: Interacts with OpenAI API for AI-powered features.
- **JWT Authentication**: Secure access to endpoints using JSON Web Tokens.
- **MySQL Database**: Stores persistent data used by the application.
- **IPinfo API**: Provides geolocation data and insights based on the user’s IP address.

## Technologies Used

- **Nitropack**: Framework for server-side rendering and fast API development.
- **OpenAI API**: AI capabilities for conversational agents, text generation, and more.
- **MySQL**: Relational database for storing structured data.
- **JWT (JSON Web Tokens)**: Used for securing API access.
- **IPinfo API**: Provides geolocation information based on IP addresses.
- **Node.js**: JavaScript runtime environment for server-side code.

## Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Grabbe-Gymnasium-Detmold/grabbe-ai-backend.git
cd grabbe-ai-backend
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) installed, then run:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file at the root of the project with the following values:

```plaintext
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET="your-jwt-secret"
MYSQL_USER="your-mysql-user"
MYSQL_PASSWORD="your-mysql-password"
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="3306"
MYSQL_DATABASE="grabbe-ai"
IPINFO_API_KEY="your-ipinfo-api-key"
```

Make sure to replace the placeholder values with your actual credentials. Keep this file secure and private.

### 4. Start the Server

To start the development server, run:

```bash
npm run dev
```

The backend will be accessible at `http://localhost:3000`.

## Available Scripts

- **`npm run dev`**: Start the development server.
- **`npm run build`**: Build the project for production.
- **`npm run preview`**: Preview the production build locally.
- **`npm run prepare`**: Prepare the project before building or running.

### Project Structure

- `server/`: Contains the source code for the backend API.
    - `routes/`: Defines the API routes and controllers.
    - `middleware/`: Middleware files for catching request before hitting the endpoints
- `lib/`: Database and JWT handling

## License

This project is the property of Grabbe-Gymnasium Detmold and is intended for internal use only. Unauthorized copying, sharing, or distribution is prohibited.

---

For questions or issues, please contact the project maintainers via the internal communication channels at Grabbe-Gymnasium Detmold (IServ) or via email:
- `finnbusse@outlook.de`
- `kontakt@maximilianvonbeck.de`
