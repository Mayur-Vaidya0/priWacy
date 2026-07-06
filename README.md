# priWacy - Secure Document Printing System

**priWacy** is a high-security, end-to-end encrypted web application designed to safely transfer documents between customers and print shops. 

In traditional print shops, customers often leave their sensitive documents (IDs, legal papers, personal records) exposed on public computers or flash drives. priWacy solves this by providing an ephemeral, encrypted bridge. Customers can securely upload their documents to a specific print shop using a unique Shop ID. The shop can securely view and print the document, but they **cannot download, save, or screenshot** it. Once printed (or after a time limit), the document is permanently scrubbed from the system.

## ✨ Key Features

- **End-to-End File Encryption**: Documents are encrypted in memory before ever touching the database.
- **Ephemeral Storage**: Files self-destruct after a set time limit via automated cron jobs. No data is stored permanently.
- **Secure Document Viewer**: Custom document viewer built for print shops that blocks right-clicks, disables keyboard shortcuts (like Save), and obscures the screen if the window loses focus.
- **Role-Based Access Control (RBAC)**: Distinct dashboards and workflows for **Customers** and **Printers**.
- **Modern Glassmorphism UI**: A beautiful, highly responsive, and premium user interface built with Framer Motion and custom CSS.
- **Zero-Footprint Print Flow**: Printers access documents via temporary data URIs that bypass download managers.

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), React Router, Framer Motion, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Security**: JWT Authentication, AES-256-CBC Encryption, Helmet, CORS, Multer (Memory Storage)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/priWacy.git
cd priWacy/Print
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory (you can use `.env.example` as a reference):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/printshield
JWT_SECRET=your_super_secret_jwt_key
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

Start the backend server:
```bash
npm start
# or npm run dev (if nodemon is installed)
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd Print/client
npm install
```

Start the React development server:
```bash
npm run dev
```

The frontend will start at `http://localhost:5173` and automatically connect to the backend API at `http://localhost:5000/api`.

## 🔒 Security Architecture

1. **Upload Phase**: When a customer uploads a file, `multer` stores it entirely in RAM. It never touches the disk in plaintext.
2. **Encryption Phase**: The buffer is encrypted using AES-256-CBC before being saved to MongoDB as a Base64 string.
3. **Retrieval Phase**: When a printer views the file, it is decrypted in RAM and sent down as a JSON payload (not a direct file stream) to bypass intercepting download managers (like IDM).
4. **Display Phase**: The frontend renders the file in an anti-screenshot sandbox.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is open source and available under the [MIT License](LICENSE).
