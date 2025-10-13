import { Server, Socket } from 'socket.io';

interface PoseData {
  landmarks: any[];
  worldLandmarks: any[];
  timestamp: number;
}

interface RoomUser {
  id: string;
  role: 'desktop' | 'mobile';
}

const rooms = new Map<string, Set<string>>();
const userRoles = new Map<string, 'desktop' | 'mobile'>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Join room for multi-camera sync
    socket.on('join-room', (data: { roomId: string; role: 'desktop' | 'mobile' }) => {
      const { roomId, role } = data;

      socket.join(roomId);
      userRoles.set(socket.id, role);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)?.add(socket.id);

      console.log(`User ${socket.id} joined room ${roomId} as ${role}`);

      // Notify other users in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        role
      });

      // Send current room users to the new user
      const roomUsers = Array.from(rooms.get(roomId) || []).map(id => ({
        id,
        role: userRoles.get(id)
      }));

      socket.emit('room-users', roomUsers);
    });

    // Handle pose data from cameras
    socket.on('pose-data', (data: { roomId: string; poseData: PoseData }) => {
      const { roomId, poseData } = data;
      const role = userRoles.get(socket.id);

      // Broadcast pose data to all users in the room except sender
      socket.to(roomId).emit('pose-update', {
        userId: socket.id,
        role,
        poseData
      });
    });

    // WebRTC signaling for video streaming
    socket.on('offer', (data: { roomId: string; offer: RTCSessionDescriptionInit }) => {
      socket.to(data.roomId).emit('offer', {
        userId: socket.id,
        offer: data.offer
      });
    });

    socket.on('answer', (data: { roomId: string; answer: RTCSessionDescriptionInit }) => {
      socket.to(data.roomId).emit('answer', {
        userId: socket.id,
        answer: data.answer
      });
    });

    socket.on('ice-candidate', (data: { roomId: string; candidate: RTCIceCandidate }) => {
      socket.to(data.roomId).emit('ice-candidate', {
        userId: socket.id,
        candidate: data.candidate
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Remove user from all rooms
      rooms.forEach((users, roomId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);

          // Notify other users
          socket.to(roomId).emit('user-left', {
            userId: socket.id
          });

          // Clean up empty rooms
          if (users.size === 0) {
            rooms.delete(roomId);
          }
        }
      });

      userRoles.delete(socket.id);
    });
  });
}
