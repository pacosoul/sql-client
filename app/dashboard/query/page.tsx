'use client';

import { useState, useEffect } from 'react';
import ConnectionManager, { DatabaseConnection } from '@/components/dashboard/ConnectionManager';

type QueryHistoryItem = {
  id: string;
  query: string;
  timestamp: number;
};

type FavoriteItem = {
  id: string;
  name: string;
  query: string;
};

type TableColumn = {
  Field: string;
  Type: string;
};

type SchemaCache = {
  [tableName: string]: TableColumn[];
};

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local Storage State
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites' | 'tables'>('tables');

  // Schema State
  const [tables, setTables] = useState<string[]>([]);
  const [schemaCache, setSchemaCache] = useState<SchemaCache>({});
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Connection State
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('prophet_query_history');
    const savedFavorites = localStorage.getItem('prophet_query_favorites');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));

    // Load tables initially
    fetchTables(activeConnection);
  }, []); // Run once on mount

  // Reload tables when connection changes
  useEffect(() => {
    fetchTables(activeConnection);
    setSchemaCache({}); // Clear cache on connection switch
    setExpandedTables(new Set());
    setResults(null);
  }, [activeConnection]);

  const getHeaders = (conn: DatabaseConnection | null) => {
    const headers: HeadersInit = {};
    if (conn) {
      headers['x-connection-string'] = conn.connectionString;
      headers['x-db-type'] = conn.type;
    }
    return headers;
  };

  const fetchTables = async (conn: DatabaseConnection | null) => {
    setLoadingSchema(true);
    try {
      const res = await fetch('/api/schema', {
        headers: getHeaders(conn)
      });
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      } else {
        setTables([]);
      }
    } catch (e) {
      console.error("Failed to load tables", e);
      setTables([]);
    } finally {
      setLoadingSchema(false);
    }
  };

  const toggleTable = async (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
      if (!schemaCache[tableName]) {
        // Fetch columns if not cached
        try {
          const res = await fetch(`/api/schema?table=${tableName}`, {
            headers: getHeaders(activeConnection)
          });
          if (res.ok) {
            const columns = await res.json();
            setSchemaCache(prev => ({ ...prev, [tableName]: columns }));
          }
        } catch (e) {
          console.error(`Failed to load columns for ${tableName}`, e);
        }
      }
    }
    setExpandedTables(newExpanded);
  };

  const insertText = (text: string) => {
    // Simple append for now, ideally insertion at cursor
    setQuery(prev => prev + (prev ? ' ' : '') + text);
  };

  const saveHistory = (queryText: string) => {
    const newItem: QueryHistoryItem = {
      id: crypto.randomUUID(),
      query: queryText,
      timestamp: Date.now(),
    };
    const newHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    localStorage.setItem('prophet_query_history', JSON.stringify(newHistory));
  };

  const saveFavorite = () => {
    const name = prompt('Enter a name for this favorite query:');
    if (!name) return;

    const newItem: FavoriteItem = {
      id: crypto.randomUUID(),
      name,
      query,
    };
    const newFavorites = [newItem, ...favorites];
    setFavorites(newFavorites);
    localStorage.setItem('prophet_query_favorites', JSON.stringify(newFavorites));
  };

  const deleteFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this favorite?')) return;
    const newFavorites = favorites.filter(item => item.id !== id);
    setFavorites(newFavorites);
    localStorage.setItem('prophet_query_favorites', JSON.stringify(newFavorites));
  };

  const handleExecute = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    // Save to history immediately on attempt (or move to success block if preferred)
    saveHistory(query);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(activeConnection)
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute query');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Database Query</h1>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column: Editor & Results */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM users..."
                className="w-full h-40 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 text-gray-800"
              />
              <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-mono">
                Ctrl + Enter to execute
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={saveFavorite}
                disabled={!query.trim()}
                className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save as Favorite"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Save
              </button>

              <button
                onClick={handleExecute}
                disabled={loading || !query.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running...
                  </span>
                ) : (
                  'Execute Query'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {results && (
            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                      {results.columns.map((col) => (
                        <th key={col} className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {results.columns.map((col) => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center shrink-0">
                <span>{results.rows.length} rows returned</span>
                <span>Execution time: ~0.12s</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History & Favorites */}
        <div className="w-80 bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden shrink-0">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <ConnectionManager
              activeConnectionId={activeConnection?.id || null}
              onConnectionChange={setActiveConnection}
            />
          </div>
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'history'
                ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'favorites'
                ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'tables'
                ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              Tables
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
            {activeTab === 'tables' && (
              <div className="space-y-1">
                {tables.length === 0 && !loadingSchema && (
                  <p className="text-center text-gray-400 text-sm mt-8">No tables found</p>
                )}
                {tables.map(table => (
                  <div key={table} className="bg-white rounded border border-gray-200 overflow-hidden">
                    <div
                      className="p-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleTable(table)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <svg
                          className={`w-3 h-3 text-gray-400 transform transition-transform ${expandedTables.has(table) ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span
                          className="font-mono text-xs font-semibold text-gray-700 truncate"
                          title="Click to expand, Double-click to insert"
                          onDoubleClick={(e) => { e.stopPropagation(); insertText(table); }}
                        >
                          {table}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); insertText(table); }}
                        className="text-gray-300 hover:text-blue-600 p-1"
                        title="Insert table name"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {expandedTables.has(table) && (
                      <div className="bg-gray-50 border-t border-gray-100 pl-6 pr-2 py-1 space-y-0.5">
                        {schemaCache[table] ? (
                          schemaCache[table].map(col => (
                            <div
                              key={col.Field}
                              className="group flex items-center justify-between hover:bg-blue-50 cursor-pointer rounded px-1 py-0.5"
                              onClick={() => insertText(col.Field)}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-mono text-[10px] text-gray-600 truncate">{col.Field}</span>
                                <span className="text-[9px] text-gray-400">{col.Type}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-2 text-center text-xs text-gray-400">Loading columns...</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'history' ? (
              history.length === 0 ? (
                <p className="text-center text-gray-400 text-sm mt-8">No history yet</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setQuery(item.query)}
                    className="group p-3 bg-white rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="text-xs text-gray-500 mb-1">{formatDate(item.timestamp)}</div>
                    <code className="text-xs text-gray-800 block line-clamp-3 font-mono bg-gray-50 p-1 rounded">
                      {item.query}
                    </code>
                  </div>
                ))
              )
            ) : favorites.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-8">No favorites saved</p>
            ) : (
              favorites.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setQuery(item.query)}
                  className="group relative p-3 bg-white rounded border border-gray-200 hover:border-yellow-300 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-800">{item.name}</span>
                    <button
                      onClick={(e) => deleteFavorite(item.id, e)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <code className="text-xs text-gray-600 block line-clamp-2 font-mono bg-gray-50 p-1 rounded">
                    {item.query}
                  </code>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
