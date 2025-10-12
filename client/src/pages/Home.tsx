import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Real-time Motion Capture Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create stunning 3D animations with real-time motion capture using your webcam
        </p>

        <div className="space-x-4">
          {isAuthenticated ? (
            <Link
              to="/capture"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
            >
              Start Capturing
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
              >
                Get Started
            </Link>
              <Link
                to="/login"
                className="inline-block bg-gray-200 text-gray-800 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-300"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📹</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Capture</h3>
            <p className="text-gray-600">
              Use your webcam to capture body movements in real-time with MediaPipe
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold mb-2">3D Animation</h3>
            <p className="text-gray-600">
              Upload FBX/GLB models and apply your motion capture data instantly
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">💾</div>
            <h3 className="text-xl font-semibold mb-2">Export & Save</h3>
            <p className="text-gray-600">
              Record, save, and export your animations with motion data included
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
