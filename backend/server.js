const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const Message = require('./models/message');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    // Setup Socket.io with CORS
    const io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST']
      }
    });

    // Socket.io event handlers
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join event discussion room
      socket.on('join-event', (eventId) => {
        socket.join(`event-${eventId}`);
        console.log(`Socket ${socket.id} joined event-${eventId}`);
      });

      // Leave event discussion room
      socket.on('leave-event', (eventId) => {
        socket.leave(`event-${eventId}`);
        console.log(`Socket ${socket.id} left event-${eventId}`);
      });

      // Send message
      socket.on('send-message', async (data) => {
        try {
          const { eventId, senderId, senderType, senderName, message } = data;

          // Validate data
          if (!eventId || !senderId || !senderType || !senderName || !message) {
            socket.emit('error', { message: 'Missing required fields' });
            return;
          }

          // Create message in database
          const newMessage = await Message.create({
            eventId,
            senderId,
            senderType,
            senderName,
            message: message.trim()
          });

          const populatedMessage = await Message.findById(newMessage._id);

          // Broadcast to all clients in the room
          io.to(`event-${eventId}`).emit('new-message', populatedMessage);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Delete message (organizer only)
      socket.on('delete-message', async (data) => {
        try {
          const { messageId, deletedBy, eventId } = data;

          // Update message in database
          await Message.findByIdAndUpdate(messageId, {
            isDeleted: true,
            deletedBy,
            deletedAt: new Date()
          });

          // Broadcast deletion to all clients in the room
          io.to(`event-${eventId}`).emit('message-deleted', { messageId });
        } catch (error) {
          console.error('Error deleting message:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server ready`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
