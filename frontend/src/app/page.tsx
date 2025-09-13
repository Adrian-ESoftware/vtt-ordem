import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">VTT Tables</h1>
        <p className="text-gray-300 mb-8 max-w-md">
          A collaborative virtual tabletop for managing game sessions with real-time updates.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/table/1"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Join Test Table
          </Link>
          
          <div className="text-sm text-gray-400">
            This will connect to table ID: &quot;test-table&quot;
          </div>
        </div>
        
        <div className="mt-12 text-xs text-gray-500">
          <p>Features:</p>
          <ul className="mt-2 space-y-1">
            <li>✅ Real-time token synchronization</li>
            <li>✅ Collaborative dice rolling</li>
            <li>✅ Drag & drop interface</li>
            <li>✅ Persistent state via REST API</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
