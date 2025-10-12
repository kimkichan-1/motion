import { Server, Socket } from 'socket.io';

interface MotionData {
  timestamp: number;
  landmarks: any;
}

interface Room {
  id: string;
  participants: Set<string>;
}

const rooms = new Map<string, Room>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join room for multi-camera sync
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          participants: new Set()
        });
      }

      const room = rooms.get(roomId)!;
      room.participants.add(socket.id);

      console.log(`Socket ${socket.id} joined room ${roomId}`);

      // Notify other participants
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        participantCount: room.participants.size
      });

      // Send current participant count to the new joiner
      socket.emit('room-info', {
        roomId,
        participantCount: room.participants.size
      });
    });

    // Handle motion data streaming
    socket.on('motion-data', (data: MotionData & { roomId: string }) => {
      const { roomId, ...motionData } = data;

      // Broadcast to all other participants in the room
      socket.to(roomId).emit('motion-data', {
        socketId: socket.id,
        ...motionData
      });
    });

    // WebRTC signaling
    socket.on('webrtc-offer', (data: { roomId: string; offer: any; to: string }) => {
      socket.to(data.to).emit('webrtc-offer', {
        from: socket.id,
        offer: data.offer
      });
    });

    socket.on('webrtc-answer', (data: { roomId: string; answer: any; to: string }) => {
      socket.to(data.to).emit('webrtc-answer', {
        from: socket.id,
        answer: data.answer
      });
    });

    socket.on('webrtc-ice-candidate', (data: { candidate: any; to: string }) => {
      socket.to(data.to).emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate: data.candidate
      });
    });

    // Leave room
    socket.on('leave-room', (roomId: string) => {
      handleLeaveRoom(socket, roomId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Remove from all rooms
      rooms.forEach((room, roomId) => {
        if (room.participants.has(socket.id)) {
          handleLeaveRoom(socket, roomId);
        }
      });
    });
  });
}

function handleLeaveRoom(socket: Socket, roomId: string) {
  const room = rooms.get(roomId);
  if (room) {
    room.participants.delete(socket.id);
    socket.leave(roomId);

    // Notify other participants
    socket.to(roomId).emit('user-left', {
      socketId: socket.id,
      participantCount: room.participants.size
    });

    // Clean up empty rooms
    if (room.participants.size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} removed (empty)`);
    }
  }
}
