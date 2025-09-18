import React from 'react';
import { useAuth } from '../auth/AuthContext';

function HomePage() {
  const { user } = useAuth();

  console.log('HomePage rendering, user:', user);

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Dashboard Tracciabilità Molino
      </h1>
      
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <h2 className="font-bold">✅ HomePage is working!</h2>
        <p>Welcome, {user?.email}</p>
        <p>User ID: {user?.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Silos</h3>
          <p className="text-gray-600">Manage your silos</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Merce IN</h3>
          <p className="text-gray-600">Track incoming materials</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Merce OUT</h3>
          <p className="text-gray-600">Track outgoing materials</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-navy-800 text-white rounded hover:bg-navy-700">
            Add Silos
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Add Merce IN
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add Merce OUT
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
