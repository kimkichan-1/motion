import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-6">Real-Time Motion Capture</h1>
          <p className="text-2xl mb-12">
            Professional motion capture for your 3D models using just your camera
          </p>

          <div className="flex justify-center gap-6 mb-16">
            {user ? (
              <Link
                to="/capture"
                className="bg-white text-purple-600 px-8 py-4 rounded-full text-xl font-semibold hover:bg-gray-100 transition"
              >
                Start Capturing
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-purple-600 px-8 py-4 rounded-full text-xl font-semibold hover:bg-gray-100 transition"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent border-2 border-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-white hover:text-purple-600 transition"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Real-Time Tracking</h3>
              <p className="text-lg">
                See your movements applied to your 3D models instantly with MediaPipe technology
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Multi-Camera Support</h3>
              <p className="text-lg">
                Use your laptop and mobile simultaneously for more accurate captures
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Export & Save</h3>
              <p className="text-lg">
                Record your motions and export them in popular formats like FBX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
