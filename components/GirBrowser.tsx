import React, {useState} from 'react';
import {
  GirAlias,
  GirAnyElement,
  GirBaseElement,
  GirCallback,
  GirClass,
  GirConstant,
  GirConstructor,
  GirEnum,
  GirField,
  GirFunction,
  GirInterface,
  GirMethod,
  GirProperty,
  GirRecord,
  GirRepository,
  GirSignal,
  SearchResult,
  SelectedItem
} from '../types';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  CogIcon,
  CubeIcon,
  FileIcon,
  ListBulletIcon,
  SpeakerWaveIcon,
  TagIcon
} from './icons';

// Moved getIconForType outside the component to ensure it's initialized before use.
const getIconForType = (type: string) => {
  switch(type.toLowerCase()){
    case 'namespace': return <CodeBracketIcon className="text-gray-700"/>;
    case 'class': case 'interface': case 'record': return <CubeIcon className="text-sky-600"/>;
    case 'function': case 'method': case 'constructor': case 'callback': return <CogIcon className="text-green-600"/>;
    case 'enum': return <ListBulletIcon className="text-orange-600"/>;
    case 'property': case 'field': case 'constant': case 'alias': return <TagIcon className="text-indigo-600"/>;
    case 'signal': return <SpeakerWaveIcon className="text-red-600"/>;
    default: return <FileIcon className="text-slate-500"/>;
  }
};

interface GirBrowserProps {
  repositories: GirRepository[];
  activeRepositoryId: string | null;
  onSelectElement: (item: SelectedItem) => void;
  searchResults: SearchResult[];
  searchTerm: string;
}

const ItemDisplay: React.FC<{
  item: GirAnyElement; 
  typeLabel: string;
  icon: React.ReactNode;
  filePath: string;
  onSelect: (item: SelectedItem) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ item, typeLabel, icon, filePath, onSelect, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onSelect({ item, type: typeLabel, filePath });
  };
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(children) setIsOpen(!isOpen);
    else handleSelect(e); 
  };

  const hasChildren = React.Children.count(children) > 0;
  const isDeprecated = 'deprecated' in item && !!item.deprecated;
  const cIdentifier = 'cIdentifier' in item && typeof item.cIdentifier === 'string' ? item.cIdentifier : null;


  return (
    <li className="my-0.5">
      <div 
        className={`w-full flex justify-start items-center p-1.5 rounded-md hover:bg-slate-200 cursor-pointer text-sm ${isDeprecated ? 'opacity-60' : ''}`}
        onClick={handleToggle}
      >
        {hasChildren ? (
          isOpen ? <ChevronDownIcon className="mr-1 text-slate-500 flex-shrink-0"/> : <ChevronRightIcon className="mr-1 text-slate-500 flex-shrink-0"/>
        ) : (
          <span className="w-5 mr-1 flex-shrink-0"></span> 
        )}
        <span className="mr-2 text-slate-600 flex-shrink-0">{icon}</span>
        <span className="font-medium text-slate-800 min-w-0 truncate" onClick={handleSelect} title={item.name}>{item.name}</span>
        {cIdentifier && <span className="ml-2 text-xs text-slate-500 font-mono hidden md:inline min-w-0 truncate" title={cIdentifier}>({cIdentifier})</span>}
        {isDeprecated && <span className="ml-2 text-xs text-orange-500 font-semibold flex-shrink-0">(deprecated)</span>}
      </div>
      {isOpen && children && (
        <ul className="ml-6 pl-2 border-l border-slate-300">
          {children}
        </ul>
      )}
    </li>
  );
};

interface GirElementListProps<T extends GirBaseElement> {
  elements: T[];
  typeLabel: string;
  icon: React.ReactNode;
  parentFilePath: string;
  onSelectElement: (item: SelectedItem) => void;
  title: string;
  defaultOpen?: boolean;
  children?: (item: T) => React.ReactNode; 
}

const GirElementList = <T extends GirBaseElement,>({ 
  elements, 
  typeLabel, 
  icon, 
  parentFilePath, 
  onSelectElement, 
  title, 
  defaultOpen = false,
  children: renderItemChildren 
}: GirElementListProps<T>) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!elements || elements.length === 0) return null;

  return (
    <li className="my-1">
      <div 
        className="flex items-center p-1.5 rounded-md hover:bg-slate-200 cursor-pointer text-sm font-semibold text-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDownIcon className="mr-1 flex-shrink-0"/> : <ChevronRightIcon className="mr-1 flex-shrink-0"/>}
        {title} ({elements.length})
      </div>
      {isOpen && (
        <ul className="ml-4 pl-2 border-l border-slate-300">
          {elements.map(el => (
            <ItemDisplay
              key={el.id} 
              item={el}
              typeLabel={typeLabel} 
              icon={icon} 
              filePath={`${parentFilePath}.${el.name}`} 
              onSelect={onSelectElement}
            >
              {renderItemChildren ? renderItemChildren(el) : undefined}
            </ItemDisplay>
          ))}
        </ul>
      )}
    </li>
  );
}

const ComplexTypeItems: React.FC<{
  item: GirClass | GirInterface | GirRecord; 
  parentFilePath: string;
  onSelectElement: (item: SelectedItem) => void;
}> = ({ item, parentFilePath, onSelectElement }) => (
  <>
    {('constructors' in item && item.constructors) && (
        <GirElementList<GirConstructor> 
            elements={item.constructors} typeLabel="Constructor" icon={<CogIcon className="text-blue-600"/>} 
            parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Constructors" 
        />
    )}
    <GirElementList<GirMethod> elements={item.methods} typeLabel="Method" icon={<CogIcon className="text-purple-600"/>} parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Methods" />
    <GirElementList<GirFunction> elements={item.functions} typeLabel="Function" icon={<CogIcon className="text-green-600"/>} parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Static Functions" />
    <GirElementList<GirProperty> elements={item.properties} typeLabel="Property" icon={<TagIcon className="text-indigo-600"/>} parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Properties" />
    {('fields' in item && item.fields) && (
        <GirElementList<GirField> 
            elements={item.fields} typeLabel="Field" icon={<TagIcon className="text-teal-600"/>} 
            parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Fields" 
        />
    )}
    <GirElementList<GirSignal> elements={item.signals} typeLabel="Signal" icon={<SpeakerWaveIcon className="text-red-600"/>} parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Signals" />
    <GirElementList<GirCallback> elements={item.callbacks} typeLabel="Callback" icon={<CogIcon className="text-pink-600"/>} parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Callbacks" />
    <GirElementList<GirConstant> elements={item.constants} typeLabel="Constant" icon={<TagIcon className="text-yellow-600"/>} parentFilePath={parentFilePath} onSelectElement={onSelectElement} title="Constants" />
  </>
);


const GirBrowser: React.FC<GirBrowserProps> = ({ repositories, activeRepositoryId, onSelectElement, searchResults, searchTerm }) => {
  
  if (searchTerm && searchResults.length > 0) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Search Results ({searchResults.length}) for "{searchTerm}"</h2>
        <ul>
          {searchResults.map((result) => (
             <ItemDisplay
              key={result.filePath} 
              item={result.item}
              typeLabel={result.type}
              icon={getIconForType(result.type)}
              filePath={result.filePath}
              onSelect={onSelectElement}
            />
          ))}
        </ul>
      </div>
    );
  }

  if (searchTerm && searchResults.length === 0) {
    return <div className="p-8 text-center text-slate-500">No results found for "{searchTerm}".</div>;
  }
  
  const activeRepo = repositories.find(r => r.id === activeRepositoryId);

  if (!activeRepo) {
    return <div className="p-8 text-center text-slate-500">Select a GIR file from the list on the left to browse its contents.</div>;
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold text-slate-800 mb-3 border-b pb-2">
        <FileIcon className="inline mr-2 align-text-bottom" />
        {activeRepo.fileName}
      </h2>
      <ul>
        {activeRepo.namespaces.map(ns => (
          <ItemDisplay
            key={ns.id}
            item={ns}
            typeLabel="Namespace"
            icon={<CodeBracketIcon className="text-gray-700"/>}
            filePath={ns.id}
            onSelect={onSelectElement}
            defaultOpen={activeRepo.namespaces.length === 1}
          >
            <GirElementList<GirClass> elements={ns.classes} typeLabel="Class" icon={<CubeIcon className="text-sky-700"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Classes" defaultOpen>
              {(item) => <ComplexTypeItems item={item} parentFilePath={`${ns.id}.${item.name}`} onSelectElement={onSelectElement} />}
            </GirElementList>
             <GirElementList<GirInterface> elements={ns.interfaces} typeLabel="Interface" icon={<CubeIcon className="text-blue-700"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Interfaces">
              {(item) => <ComplexTypeItems item={item} parentFilePath={`${ns.id}.${item.name}`} onSelectElement={onSelectElement} />}
            </GirElementList>
             <GirElementList<GirRecord> elements={ns.records} typeLabel="Record" icon={<CubeIcon className="text-cyan-700"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Records">
              {(item) => <ComplexTypeItems item={item} parentFilePath={`${ns.id}.${item.name}`} onSelectElement={onSelectElement} />}
            </GirElementList>
            <GirElementList<GirEnum> elements={ns.enums} typeLabel="Enum" icon={<ListBulletIcon className="text-orange-600"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Enums/Bitfields" />
            <GirElementList<GirFunction> elements={ns.functions} typeLabel="Function" icon={<CogIcon className="text-green-600"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Functions" />
            <GirElementList<GirAlias> elements={ns.aliases} typeLabel="Alias" icon={<TagIcon className="text-purple-600"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Aliases" />
            <GirElementList<GirConstant> elements={ns.constants} typeLabel="Constant" icon={<TagIcon className="text-yellow-600"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Constants" />
            <GirElementList<GirCallback> elements={ns.callbacks} typeLabel="Callback" icon={<CogIcon className="text-pink-600"/>} parentFilePath={ns.id} onSelectElement={onSelectElement} title="Callbacks" />
          </ItemDisplay>
        ))}
      </ul>
    </div>
  );
};

export default GirBrowser;
