import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Chore from './models/Chore.js'; // Adjust the path according to your project structure

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const mongoUrl = 'mongodb://localhost:27017/choresDB'; // Update this URL as per your MongoDB setup

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

io.on('connection', async (socket) => {
    console.log('a user connected');

    // Fetch initial chores from the database
    const chores = await Chore.find();
    socket.emit('initial chores', chores);

    // When a new chore is added
    socket.on('new chore', async ({ text, user, frequency }) => {
        const newChore = new Chore({
            text,
            done: false,
            user,
            frequency
        });
        await newChore.save();
        io.emit('new chore', newChore);
    });

    // When a chore is checked/unchecked
    socket.on('toggle chore', async ({ id, user }) => {
        const chore = await Chore.findById(id);
        if (chore) {
            chore.done = !chore.done;
            chore.user = chore.done ? user : null;
            await chore.save();
            io.emit('toggle chore', { id, user: chore.done ? user : null, done: chore.done });
        }
    });

    // When a chore is deleted
    socket.on('delete chore', async (id) => {
        await Chore.findByIdAndDelete(id);
        io.emit('delete chore', id);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
