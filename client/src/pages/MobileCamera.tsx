import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import VideoFeed from '../components/viewer/VideoFeed';

export default function MobileCamera() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError('Invalid room ID');
      return;
    }

    // Connect to server
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    const socket = io(serverUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);

      // Join room as mobile device
      socket.emit('join-room', {
        roomId,
        role: 'mobile'
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const handlePoseData = (poseData: any) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('pose-data', {
        roomId,
        poseData
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Mobile Camera</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-2 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                Connecting...
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">Room: {roomId}</p>
      </div>

      {/* Camera Feed */}
      <div className="flex-1 p-4">
        <VideoFeed onPoseData={handlePoseData} />
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 text-white p-4">
        <p className="text-sm text-center text-gray-400">
          Position your phone to capture your back view. Your movements will be synced with the main session.
        </p>
      </div>
    </div>
  );
}
