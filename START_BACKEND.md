# How to Start the Backend Server

## Quick Start

1. Open a terminal/command prompt
2. Navigate to the backend folder:
   ```
   cd backend
   ```
3. Start the server:
   ```
   npm start
   ```
   OR for development (auto-restart on changes):
   ```
   npm run dev
   ```

4. You should see:
   ```
   🚀 Server running on port 5001
   🌐 Health check: http://localhost:5001/api/health
   ```

5. Keep this terminal open while using the app!

## Troubleshooting

- If you get "port already in use" error, either:
  - Stop the other process using port 5001
  - Or change the port in `backend/server.js` (line 149)

- If you get module errors, run:
  ```
  npm install
  ```

- Test if server is running:
  Open http://localhost:5001/api/health in your browser
  You should see: `{"status":"OK","message":"Server is running"}`

