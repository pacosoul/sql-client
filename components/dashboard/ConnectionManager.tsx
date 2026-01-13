'use client';

import { useState, useEffect } from 'react';

export type DbType = 'mysql' | 'postgres';

export type DatabaseConnection = {
  id: string;
  name: string;
  type: DbType;
  connectionString: string;
};

interface ConnectionManagerProps {
  activeConnectionId: string | null;
  onConnectionChange: (connection: DatabaseConnection | null) => void;
}

export default function ConnectionManager({ activeConnectionId, onConnectionChange }: ConnectionManagerProps) {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<DbType>('mysql');
  const [newConnString, setNewConnString] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('prophet_connections');
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  }, []);

  const saveConnection = () => {
    if (!newName || !newConnString) return;

    const newConnection: DatabaseConnection = {
      id: crypto.randomUUID(),
      name: newName,
      type: newType,
      connectionString: newConnString,
    };

    const updated = [...connections, newConnection];
    setConnections(updated);
    localStorage.setItem('prophet_connections', JSON.stringify(updated));

    // Reset and Close
    setNewName('');
    setNewConnString('');
    setShowForm(false);

    // Auto Select if it's the first one
    if (connections.length === 0) {
      onConnectionChange(newConnection);
    }
  };

  const deleteConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this connection?')) return;

    const updated = connections.filter(c => c.id !== id);
    setConnections(updated);
    localStorage.setItem('prophet_connections', JSON.stringify(updated));

    if (activeConnectionId === id) {
      onConnectionChange(null);
    }
  };

  const activeConnection = connections.find(c => c.id === activeConnectionId);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Connection</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Production DB"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as DbType)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mysql">MySQL</option>
                <option value="postgres">PostgreSQL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Connection String</label>
              <input
                type="password"
                value={newConnString}
                onChange={e => setNewConnString(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="mysql://user:pass@host:3306/db"
              />
            </div>
            <button
              onClick={saveConnection}
              disabled={!newName || !newConnString}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Save Connection
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Default Env Var Connection Option */}
        <div
          onClick={() => onConnectionChange(null)}
          className={`w-full text-left p-3 rounded border cursor-pointer transition-all flex items-center gap-3 ${activeConnectionId === null
              ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
              : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className={`w-2 h-2 rounded-full ${activeConnectionId === null ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <div>
            <div className="text-sm font-medium text-gray-900">Default (Env Var)</div>
            <div className="text-xs text-gray-500">From .env.local</div>
          </div>
        </div>

        {connections.map(conn => (
          <div
            key={conn.id}
            onClick={() => onConnectionChange(conn)}
            className={`group w-full text-left p-3 rounded border cursor-pointer transition-all flex items-center justify-between ${activeConnectionId === conn.id
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${activeConnectionId === conn.id ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <div>
                <div className="text-sm font-medium text-gray-900">{conn.name}</div>
                <div className="text-xs text-gray-500 capitalize">{conn.type}</div>
              </div>
            </div>
            <button
              onClick={(e) => deleteConnection(conn.id, e)}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
