import dotenv from 'dotenv';
import { connectDb } from './config/db.js';
import app from './app.js';

dotenv.config();

connectDb();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Server is shutting down, due to unhandled promis rejection`);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Server is shutting down, due to uncaught Exception errors`);

  process.exit(1);
});
