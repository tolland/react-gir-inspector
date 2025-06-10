import React, {useCallback, useEffect, useState} from 'react';
import GirFileUploader from './components/GirFileUploader';
import GirBrowser from './components/GirBrowser';
import GirElementDetails from './components/GirElementDetails';
import SearchBar from './components/SearchBar';
import {parseGirContent} from './services/girParser';
import {
  GirAnyElement,
  GirClass,
  GirEnum,
  GirInterface,
  GirNamespace,
  GirRecord,
  GirRepository,
  SearchResult,
  SelectedItem
} from './types';
import {FileIcon} from './components/icons';

// --- CONFIGURATION ---
const ENABLE_AUTO_TAB_SWITCH = false; // Set to true to re-enable automatic tab switching
// ---------------------

// Define GIR files to pre-load. Ensure these files are in your public/gir/ directory.
const PRELOAD_FILES: string[] = [
  'gir/Babl-0.1.gir',
  'gir/Gegl-0.4.gir',
  // Add other GIR files here, e.g., 'gir/Gtk-3.0.gir'
  // Consider file sizes for preloading, very large files might impact initial load time.
];

const App: React.FC = () => {
  const [repositories, setRepositories] = useState<GirRepository[]>([]);
  const [activeRepositoryId, setActiveRepositoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For user-initiated loading
  const [isPreloading, setIsPreloading] = useState<boolean>(false); // For initial pre-loading
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'inspector'>('files');
  const [isDraggingOverFilesTab, setIsDraggingOverFilesTab] = useState<boolean>(false);


  useEffect(() => {
    const preloadGirFiles = async () => {
      // Use sessionStorage to ensure preloading occurs once per session
      if (repositories.length > 0 || sessionStorage.getItem('girPreloadAttempted') === 'true') {
        return;
      }
      
      setIsPreloading(true);
      setError(null);
      let firstSuccessfullyLoadedRepoId: string | null = null;
      const newLoadedReposBatch: GirRepository[] = [];

      sessionStorage.setItem('girPreloadAttempted', 'true');

      for (const filePath of PRELOAD_FILES) {
        try {
          // console.log(`Attempting to preload: ${filePath}`);
          const response = await fetch(filePath);
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status} fetching ${filePath}`);
          }
          const content = await response.text();
          const fileName = filePath.split('/').pop() || filePath;
          
          const parsedRepo = parseGirContent(content, fileName);
          newLoadedReposBatch.push(parsedRepo);

          if (!firstSuccessfullyLoadedRepoId) {
            firstSuccessfullyLoadedRepoId = parsedRepo.id;
          }
          console.log(`Successfully pre-loaded and parsed ${fileName}`);

        } catch (e) {
          console.error(`Error pre-loading GIR file ${filePath}:`, e);
          const specificError = `Failed to pre-load ${filePath.split('/').pop()}: ${e instanceof Error ? e.message : String(e)}`;
          setError(prevError => (prevError ? `${prevError}\n${specificError}` : specificError));
        }
      }

      if (newLoadedReposBatch.length > 0) {
        setRepositories(prevRepos => {
          const existingRepoIds = new Set(prevRepos.map(r => r.id));
          const trulyNewRepos = newLoadedReposBatch.filter(
            newRepo => !existingRepoIds.has(newRepo.id)
          );

          if (trulyNewRepos.length === 0) {
            return prevRepos; // No actual new unique repos to add
          }
          return [...prevRepos, ...trulyNewRepos];
        });
        
        if (!activeRepositoryId && firstSuccessfullyLoadedRepoId) {
          setActiveRepositoryId(firstSuccessfullyLoadedRepoId);
          if (ENABLE_AUTO_TAB_SWITCH) {
            setActiveTab('inspector');
          }
        }
      }
      setIsPreloading(false);
    };

    preloadGirFiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty dependency array to run once on mount (or when state allows)


  const handleFileLoad = useCallback(async (fileName: string, content: string) => {
    if (repositories.some(repo => repo.fileName === fileName)) {
      alert(`File "${fileName}" is already loaded.`);
      // Optionally, make it active if it's already loaded but not active
      const existingRepo = repositories.find(repo => repo.fileName === fileName);
      if (existingRepo && activeRepositoryId !== existingRepo.id) {
          setActiveRepositoryId(existingRepo.id);
          setSelectedItem(null);
          setSearchTerm('');
          setSearchResults([]);
          if (ENABLE_AUTO_TAB_SWITCH) {
            setActiveTab('inspector');
          }
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 0)); 
      const parsedRepo = parseGirContent(content, fileName);
      setRepositories(prev => { // Ensure uniqueness when user uploads too
        if (prev.some(r => r.id === parsedRepo.id)) return prev;
        return [...prev, parsedRepo];
      });
      if (!activeRepositoryId || repositories.length === 0) {
        setActiveRepositoryId(parsedRepo.id);
        if (ENABLE_AUTO_TAB_SWITCH) {
            setActiveTab('inspector'); 
        }
      } else {
         // If a repo is already active, user might want to switch manually or we can switch
         setActiveRepositoryId(parsedRepo.id); // Switch to newly uploaded file
         if (ENABLE_AUTO_TAB_SWITCH) {
            setActiveTab('inspector');
         }
      }
    } catch (e) {
      console.error("Error parsing GIR file:", e);
      setError(`Failed to parse ${fileName}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, activeRepositoryId]); // Include repositories.length in deps if needed, but not for this specific logic

  const handleSelectElement = useCallback((item: SelectedItem) => {
    setSelectedItem(item);
  }, []);

  const performSearch = useCallback((term: string) => {
    if (!term.trim() || !activeRepositoryId) {
      setSearchResults([]);
      return;
    }
    const lowerTerm = term.toLowerCase();
    const results: SearchResult[] = [];
    const activeRepo = repositories.find(r => r.id === activeRepositoryId);
    if (!activeRepo) return;

    const searchInElement = (el: GirAnyElement, type: string, path: string) => {
      let match = false;
      if (el.name?.toLowerCase().includes(lowerTerm)) {
        match = true;
      }
      if (('cIdentifier' in el && el.cIdentifier) && el.cIdentifier.toLowerCase().includes(lowerTerm)) {
        match = true;
      }
      if (('glibName' in el && el.glibName) && el.glibName.toLowerCase().includes(lowerTerm)) {
        match = true;
      }
      if (('glibNick' in el && el.glibNick) && el.glibNick.toLowerCase().includes(lowerTerm)) {
        match = true;
      }

      if (match) {
        results.push({ item: el, type, filePath: path });
      }
    };
    
    const searchRecursively = (element: GirAnyElement, type: string, currentPath: string) => {
      searchInElement(element, type, currentPath);

      if ('constructors' in element && Array.isArray((element as GirClass).constructors)) {
        (element as GirClass).constructors.forEach(cons => searchRecursively(cons, 'Constructor', `${currentPath}.${cons.name}`));
      }
      if ('methods' in element && Array.isArray((element as GirClass | GirInterface | GirRecord).methods)) {
        (element as GirClass | GirInterface | GirRecord).methods.forEach(m => searchRecursively(m, 'Method', `${currentPath}.${m.name}`));
      }
      if ('functions' in element && Array.isArray((element as GirClass | GirInterface | GirRecord | GirNamespace).functions)) {
        (element as GirClass | GirInterface | GirRecord | GirNamespace).functions.forEach(f => searchRecursively(f, 'Function', `${currentPath}.${f.name}`));
      }
      if ('properties' in element && Array.isArray((element as GirClass | GirInterface | GirRecord).properties)) {
        (element as GirClass | GirInterface | GirRecord).properties.forEach(p => searchRecursively(p, 'Property', `${currentPath}.${p.name}`));
      }
      if ('fields' in element && Array.isArray((element as GirClass | GirRecord).fields)) {
        (element as GirClass | GirRecord).fields.forEach(f => searchRecursively(f, 'Field', `${currentPath}.${f.name}`));
      }
      if ('signals' in element && Array.isArray((element as GirClass | GirInterface | GirRecord).signals)) {
        (element as GirClass | GirInterface | GirRecord).signals.forEach(s => searchRecursively(s, 'Signal', `${currentPath}.${s.name}`));
      }
      if ('callbacks' in element && Array.isArray((element as GirNamespace | GirClass | GirInterface | GirRecord).callbacks)) {
        (element as GirNamespace | GirClass | GirInterface | GirRecord).callbacks.forEach(cb => searchRecursively(cb, 'Callback', `${currentPath}.${cb.name}`));
      }
      if ('constants' in element && Array.isArray((element as GirNamespace | GirClass | GirInterface | GirRecord).constants)) {
         (element as GirNamespace | GirClass | GirInterface | GirRecord).constants.forEach(c => searchRecursively(c, 'Constant', `${currentPath}.${c.name}`));
      }
       if ('members' in element && Array.isArray((element as GirEnum).members)) { 
        (element as GirEnum).members.forEach(m => searchInElement(m, 'Member', `${currentPath}.${m.name}`));
      }
    };

    activeRepo.namespaces.forEach(ns => {
        const nsPath = `${activeRepo.id}.${ns.name}`;
        searchRecursively(ns, 'Namespace', nsPath);
        ns.classes.forEach(c => searchRecursively(c, 'Class', `${nsPath}.${c.name}`));
        ns.interfaces.forEach(i => searchRecursively(i, 'Interface', `${nsPath}.${i.name}`));
        ns.records.forEach(r => searchRecursively(r, 'Record', `${nsPath}.${r.name}`));
        ns.enums.forEach(e => searchRecursively(e, 'Enum', `${nsPath}.${e.name}`));
         ns.functions.forEach(f => searchRecursively(f, 'Function', `${nsPath}.${f.name}`));
         ns.constants.forEach(c => searchRecursively(c, 'Constant', `${nsPath}.${c.name}`));
         ns.aliases.forEach(a => searchRecursively(a, 'Alias', `${nsPath}.${a.name}`));
         ns.callbacks.forEach(cb => searchRecursively(cb, 'Callback', `${nsPath}.${cb.name}`));
      });
    setSearchResults(results);
  }, [repositories, activeRepositoryId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, performSearch]);

  const handleFilesTabDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (activeTab === 'files') {
      setIsDraggingOverFilesTab(true);
    }
  }, [activeTab]);

  const handleFilesTabDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOverFilesTab(false);
  }, []);

  const handleFilesTabDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOverFilesTab(false);

    if (activeTab !== 'files' || (isLoading || isPreloading)) {
      if (isLoading || isPreloading) {
         alert("Please wait for the current operation to complete before dropping more files.");
      }
      return;
    }
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.name.endsWith('.gir')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
              handleFileLoad(file.name, e.target.result); 
            }
          };
          reader.readAsText(file);
        } else {
          alert(`File "${file.name}" is not a .gir file and will be ignored.`);
        }
      });
    }
  }, [activeTab, handleFileLoad, isLoading, isPreloading]);


  const headerHeight = '64px'; 
  const tabBarHeight = '45px'; 

  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-20" style={{ height: headerHeight }}>
        <h1 className="text-2xl font-semibold">GIR Inspector</h1>
      </header>
      
      <div className="flex border-b border-slate-300 bg-slate-100 sticky z-10" style={{ top: headerHeight, height: tabBarHeight }}>
        <button
          className={`px-6 py-3 text-sm font-medium focus:outline-none transition-colors ${activeTab === 'files' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
          onClick={() => setActiveTab('files')}
        >
          File Management
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium focus:outline-none transition-colors ${activeTab === 'inspector' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'} ${!activeRepositoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => activeRepositoryId && setActiveTab('inspector')}
          disabled={!activeRepositoryId}
        >
          Inspector
        </button>
      </div>
      
      <div className="bg-slate-100 px-4 pt-2">
        {error && (
          <div className="p-3 mb-2 bg-red-100 border-l-4 border-red-500 text-red-700 rounded" role="alert">
            <p className="font-bold">Error</p>
            <pre className="text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        {(isLoading || isPreloading) && (
          <div className="p-3 mb-2 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded" role="status">
            <p className="text-sm">{isPreloading ? 'Pre-loading files...' : 'Loading file...'}</p>
          </div>
        )}
      </div>

      <main 
        className="flex-1 overflow-hidden bg-slate-100" 
        style={{ height: `calc(100vh - ${headerHeight} - ${tabBarHeight} - ${error ? '80px' : '0px'} - ${(isLoading || isPreloading) ? '50px' : '0px'})`}}
        onDragOver={activeTab === 'files' ? handleFilesTabDragOver : undefined} // Only attach if files tab is active
        onDragLeave={activeTab === 'files' ? handleFilesTabDragLeave : undefined}
        onDrop={activeTab === 'files' ? handleFilesTabDrop : undefined}
      >
        {activeTab === 'files' && (
          <div 
            className={`p-4 h-full overflow-y-auto transition-colors duration-200 ease-in-out ${isDraggingOverFilesTab ? 'bg-blue-100 border-2 border-dashed border-blue-500 ring-2 ring-blue-500 ring-offset-1' : 'border-2 border-transparent'}`}
          >
            <div className="w-full bg-white rounded-lg shadow-md mb-4">
              <GirFileUploader onFileLoad={handleFileLoad} disabled={isLoading || isPreloading} />
               {isDraggingOverFilesTab && (
                <div className="py-10 text-center text-blue-600 font-semibold">
                  Drop .gir files here to upload
                </div>
              )}
            </div>
            <div className="w-full bg-white rounded-lg shadow-md p-4">
              <h2 className="text-base font-semibold text-slate-700 mb-3 border-b pb-2">Loaded GIR Files</h2>
              {repositories.length === 0 && !(isLoading || isPreloading) && <p className="text-sm text-slate-500 italic">No GIR files loaded. Upload one or wait for pre-loading to complete.</p>}
              {repositories.length > 0 && (
                <ul className="space-y-1 max-h-[calc(100vh-450px)] overflow-y-auto"> {/* Adjust max-h as needed */}
                  {repositories.map(repo => (
                    <li key={repo.id}
                      className={`p-2.5 rounded-md cursor-pointer text-sm flex items-center transition-all duration-150 ease-in-out
                                  ${activeRepositoryId === repo.id ? 'bg-blue-600 text-white font-semibold shadow-sm ring-2 ring-blue-300' : 'bg-slate-50 hover:bg-blue-100 text-slate-700 hover:text-blue-700'}`}
                      onClick={() => { 
                        setActiveRepositoryId(repo.id); 
                        setSelectedItem(null); 
                        setSearchTerm(''); 
                        setSearchResults([]); 
                        if (ENABLE_AUTO_TAB_SWITCH) {
                          setActiveTab('inspector');
                        } 
                      }}
                      title={`Activate ${repo.fileName}${ENABLE_AUTO_TAB_SWITCH ? ' and switch to Inspector tab' : ''}`}
                    >
                      <FileIcon className={`mr-2.5 flex-shrink-0 w-5 h-5 ${activeRepositoryId === repo.id ? 'text-white': 'text-slate-400'}`} />
                      <span className="truncate">{repo.fileName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inspector' && (
          <>
            {!activeRepositoryId ? (
              <div className="p-8 text-center text-slate-500 h-full flex flex-col justify-center items-center">
                <FileIcon className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-lg">No GIR file selected.</p>
                <p className="text-sm">Please upload or select a file from the "File Management" tab.</p>
                 <button 
                    onClick={() => setActiveTab('files')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Go to File Management
                  </button>
              </div>
            ) : (
              <div className="flex flex-row h-full">
                {/* Left Column: Search + Browser */}
                <div className="w-2/5 md:w-1/3 flex flex-col border-r border-slate-200 bg-white shadow-sm overflow-hidden">
                  <SearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} disabled={isLoading || isPreloading || !activeRepositoryId} />
                  <div className="flex-1 overflow-y-auto"> {/* Browser scroll */}
                    <GirBrowser 
                      repositories={repositories} 
                      activeRepositoryId={activeRepositoryId}
                      onSelectElement={handleSelectElement}
                      searchResults={searchResults}
                      searchTerm={searchTerm}
                    />
                  </div>
                </div>
                {/* Right Column: Details */}
                <div className="w-3/5 md:w-2/3 flex-1 bg-slate-50 overflow-y-auto"> {/* Details scroll */}
                  <GirElementDetails selectedItem={selectedItem} />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
