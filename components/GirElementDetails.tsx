
import React from 'react';
import { 
  SelectedItem, GirDoc, GirParameter, GirReturnValue, GirAttribute, GirAnyElement,
  GirClass, GirFunction, GirProperty, GirField, GirSignal, GirEnum, GirConstant, GirAlias, GirNamespace, GirRecord, GirInterface, GirConstructor, GirMethod, GirCallback, GirMember, GirBaseElement
} from '../types';

const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white shadow rounded-lg mb-4">
    <div className="px-4 py-3 border-b border-slate-200">
      <h3 className="text-lg leading-6 font-medium text-slate-900">{title}</h3>
    </div>
    <div className="px-4 py-3 text-sm text-slate-700 leading-relaxed">
      {children}
    </div>
  </div>
);

const DocDisplay: React.FC<{ doc?: GirDoc }> = ({ doc }) => {
  if (!doc || !doc.text.trim()) return <p className="italic text-slate-500">No documentation available.</p>;
  return (
    <div className="prose prose-sm max-w-none">
      <pre className="whitespace-pre-wrap font-sans bg-slate-50 p-2 rounded text-slate-800">{doc.text}</pre>
      {(doc.filename || doc.line) && (
        <p className="text-xs text-slate-400 mt-1">
          Source: {doc.filename}{doc.line && ` (line ${doc.line})`}
        </p>
      )}
    </div>
  );
};

const AttributesDisplay: React.FC<{ attributes: GirAttribute[] }> = ({ attributes }) => {
  if (!attributes || attributes.length === 0) return null;
  return (
    <div className="mt-3">
      <h4 className="font-semibold text-slate-800 mb-1">Attributes:</h4>
      <ul className="list-disc list-inside pl-2 space-y-0.5 text-xs">
        {attributes.map(attr => (
          <li key={attr.name}><span className="font-mono bg-slate-100 px-1 rounded">{attr.name}</span>: <span className="font-mono bg-slate-100 px-1 rounded">{attr.value}</span></li>
        ))}
      </ul>
    </div>
  );
};

const ParametersDisplay: React.FC<{ params: GirParameter[], title?: string }> = ({ params, title = "Parameters" }) => {
  if (!params || params.length === 0) return <p className="italic text-slate-500">No parameters.</p>;
  return (
    <>
      <h4 className="font-semibold text-slate-800 my-2">{title}:</h4>
      <ul className="space-y-2">
        {params.map((p, i) => (
          <li key={i} className="border-l-2 border-blue-500 pl-3 py-1 bg-slate-50 rounded-r">
            <p className="font-semibold font-mono text-blue-700">{p.name}</p>
            {p.type && <p>Type: <span className="font-mono bg-slate-200 px-1 rounded">{p.type}</span> {p.cType && `(C: ${p.cType})`}</p>}
            {p.direction && <p>Direction: <span className="font-mono bg-slate-200 px-1 rounded">{p.direction}</span></p>}
            {p.transferOwnership && <p>Transfer: <span className="font-mono bg-slate-200 px-1 rounded">{p.transferOwnership}</span></p>}
            {p.nullable && <p className="text-xs text-slate-600">Nullable</p>}
            {p.allowNone && <p className="text-xs text-slate-600">Allow None</p>}
            {p.doc && <div className="mt-1"><DocDisplay doc={p.doc} /></div>}
          </li>
        ))}
      </ul>
    </>
  );
};

const ReturnValueDisplay: React.FC<{ rv?: GirReturnValue }> = ({ rv }) => {
  if (!rv) return <p className="italic text-slate-500">No return value (void or constructor).</p>;
  return (
    <>
      <h4 className="font-semibold text-slate-800 my-2">Return Value:</h4>
      <div className="border-l-2 border-green-500 pl-3 py-1 bg-slate-50 rounded-r">
        {rv.type && <p>Type: <span className="font-mono bg-slate-200 px-1 rounded">{rv.type}</span> {rv.cType && `(C: ${rv.cType})`}</p>}
        {rv.transferOwnership && <p>Transfer: <span className="font-mono bg-slate-200 px-1 rounded">{rv.transferOwnership}</span></p>}
        {rv.nullable && <p className="text-xs text-slate-600">Nullable</p>}
        {rv.doc && <div className="mt-1"><DocDisplay doc={rv.doc} /></div>}
      </div>
    </>
  );
};

const GirElementDetails: React.FC<{ selectedItem: SelectedItem | null }> = ({ selectedItem }) => {
  if (!selectedItem) {
    return <div className="p-8 text-center text-slate-500">Select an element from the browser or search results to see its details.</div>;
  }

  const { item, type, filePath } = selectedItem;

  const renderCommonDetails = (el: GirAnyElement) => (
    <>
      <p className="text-xs text-slate-400 mb-2 break-all">Path: {filePath}</p>
      {('cIdentifier' in el && el.cIdentifier) && <p>C Identifier: <span className="font-mono bg-slate-200 px-1 rounded">{el.cIdentifier}</span></p>}
      
      {('glibName' in el && el.glibName) && <p>GLib Name: <span className="font-mono bg-slate-200 px-1 rounded">{el.glibName}</span></p>}
      {/* Handle glibNick for GirMember if glibName is not present */}
      {(!('glibName' in el) && ('glibNick' in el && el.glibNick)) && <p>GLib Nick: <span className="font-mono bg-slate-200 px-1 rounded">{el.glibNick}</span></p>}

      {('version' in el && el.version) && <p>Version: <span className="font-mono bg-slate-200 px-1 rounded">{el.version}</span></p>}
      
      {('deprecated' in el && el.deprecated) && <p className="text-orange-600 font-semibold">Deprecated {typeof el.deprecated === 'string' ? `: ${el.deprecated}` : ''}</p>}
      
      {('sourcePosition' in el && el.sourcePosition) && (
         <p className="text-xs text-slate-500">Source: {el.sourcePosition.filename}{el.sourcePosition.line && ` (line ${el.sourcePosition.line})`}</p>
      )}

      {'doc' in el && el.doc && <DocDisplay doc={el.doc} />}
      
      {('attributes' in el && el.attributes && Array.isArray(el.attributes)) && <AttributesDisplay attributes={el.attributes} />}
    </>
  );

  const renderCallableDetails = (el: GirFunction | GirConstructor | GirMethod | GirCallback) => (
    <>
      {renderCommonDetails(el)}
      <ParametersDisplay params={el.parameters} />
      {type !== 'Constructor' && <ReturnValueDisplay rv={el.returnValue} />}
      {el.throws && <p className="text-red-600 font-semibold mt-2">Throws Exception</p>}
    </>
  );
  
  const renderPropertyDetails = (el: GirProperty) => (
     <>
      {renderCommonDetails(el)}
      {el.type && <p>Type: <span className="font-mono bg-slate-200 px-1 rounded">{el.type}</span> {el.cType && `(C: ${el.cType})`}</p>}
      {el.transferOwnership && <p>Transfer: <span className="font-mono bg-slate-200 px-1 rounded">{el.transferOwnership}</span></p>}
      <p>Readable: {el.readable ? 'Yes' : 'No'}</p>
      <p>Writable: {el.writable ? 'Yes' : 'No'}</p>
      {el.construct && <p>Construct Property</p>}
      {el.constructOnly && <p>Construct-Only Property</p>}
    </>
  );

  const renderFieldDetails = (el: GirField) => (
    <>
      {renderCommonDetails(el)}
      {el.type && <p>Type: <span className="font-mono bg-slate-200 px-1 rounded">{el.type}</span> {el.cType && `(C: ${el.cType})`}</p>}
      <p>Readable: {el.readable ? 'Yes' : 'No'}</p>
      <p>Writable: {el.writable ? 'Yes' : 'No'}</p>
      {el.private && <p>Private</p>}
      {el.bits && <p>Bits: {el.bits}</p>}
    </>
  );

  const renderSignalDetails = (el: GirSignal) => (
    <>
      {renderCommonDetails(el)}
      {el.when && <p>When: <span className="font-mono bg-slate-200 px-1 rounded">{el.when}</span></p>}
      {el.detailed && <p>Detailed Signal</p>}
      {el.action && <p>Action Signal</p>}
      {el.noHooks && <p>No Hooks</p>}
      {el.noRecurse && <p>No Recurse</p>}
      <ParametersDisplay params={el.parameters} title="Signal Parameters"/>
      <ReturnValueDisplay rv={el.returnValue} />
    </>
  );

  const renderEnumDetails = (el: GirEnum) => (
    <>
      {renderCommonDetails(el)}
      {el.cType && <p>C Type: <span className="font-mono bg-slate-200 px-1 rounded">{el.cType}</span></p>}
      {el.glibTypeName && <p>GLib Type Name: <span className="font-mono bg-slate-200 px-1 rounded">{el.glibTypeName}</span></p>}
      {el.glibGetType && <p>GLib Get Type: <span className="font-mono bg-slate-200 px-1 rounded">{el.glibGetType}</span></p>}
      {el.errorDomain && <p>Error Domain: <span className="font-mono bg-slate-200 px-1 rounded">{el.errorDomain}</span></p>}
      <h4 className="font-semibold text-slate-800 my-2">Members:</h4>
      <ul className="space-y-1">
        {el.members.map((m: GirMember, i) => (
          <li key={i} className="border-l-2 border-purple-500 pl-3 py-1 bg-slate-50 rounded-r">
            <p className="font-semibold font-mono text-purple-700">{m.name}</p>
            <p>Value: <span className="font-mono bg-slate-200 px-1 rounded">{m.value}</span></p>
            {m.cIdentifier && <p>C Identifier: <span className="font-mono bg-slate-200 px-1 rounded">{m.cIdentifier}</span></p>}
            {m.glibNick && <p>GLib Nick: <span className="font-mono bg-slate-200 px-1 rounded">{m.glibNick}</span></p>}
            {m.doc && <div className="mt-1"><DocDisplay doc={m.doc} /></div>}
          </li>
        ))}
      </ul>
    </>
  );
  
  const renderComplexTypeDetails = (el: GirClass | GirInterface | GirRecord) => (
     <>
      {renderCommonDetails(el)}
      {el.cSymbolPrefix && <p>C Symbol Prefix: <span className="font-mono bg-slate-200 px-1 rounded">{el.cSymbolPrefix}</span></p>}
      {el.cType && <p>C Type: <span className="font-mono bg-slate-200 px-1 rounded">{el.cType}</span></p>}
      {el.glibTypeName && <p>GLib Type Name: <span className="font-mono bg-slate-200 px-1 rounded">{el.glibTypeName}</span></p>}
      {el.glibGetType && <p>GLib Get Type: <span className="font-mono bg-slate-200 px-1 rounded">{el.glibGetType}</span></p>}
      {el.parent && <p>Parent: <span className="font-mono bg-slate-200 px-1 rounded">{el.parent}</span></p>}
      {el.prerequisites && el.prerequisites.length > 0 && <p>Prerequisites: {el.prerequisites.map(p => <span key={p} className="font-mono bg-slate-200 px-1 rounded mr-1">{p}</span>)}</p>}
       {(el as GirClass).abstract && <p>Abstract</p>}
       {(el as GirClass).fundamental && <p>Fundamental</p>}
       {(el as GirClass).typeStruct && <p>Type Struct: <span className="font-mono bg-slate-200 px-1 rounded">{(el as GirClass).typeStruct}</span></p>}
       {(el as GirRecord).disguised && <p>Disguised</p>}
       {(el as GirRecord).foreign && <p>Foreign</p>}
       {(el as GirRecord).gtypeStructFor && <p>GLib Struct For: <span className="font-mono bg-slate-200 px-1 rounded">{(el as GirRecord).gtypeStructFor}</span></p>}
      {/* Could list counts of children here, or link to them in browser */}
    </>
  );

  let content: React.ReactNode;
  switch(type) {
    case 'Namespace': content = renderCommonDetails(item as GirNamespace); break;
    case 'Class': content = renderComplexTypeDetails(item as GirClass); break;
    case 'Interface': content = renderComplexTypeDetails(item as GirInterface); break;
    case 'Record': content = renderComplexTypeDetails(item as GirRecord); break;
    case 'Function': case 'Constructor': case 'Method': case 'Callback':
      content = renderCallableDetails(item as GirFunction | GirConstructor | GirMethod | GirCallback); break;
    case 'Property': content = renderPropertyDetails(item as GirProperty); break;
    case 'Field': content = renderFieldDetails(item as GirField); break;
    case 'Signal': content = renderSignalDetails(item as GirSignal); break;
    case 'Enum': content = renderEnumDetails(item as GirEnum); break;
    case 'Constant': {
        const cnst = item as GirConstant;
        content = <>
            {renderCommonDetails(cnst)}
            <p>Type: <span className="font-mono bg-slate-200 px-1 rounded">{cnst.type}</span> {cnst.cType && `(C: ${cnst.cType})`}</p>
            <p>Value: <span className="font-mono bg-slate-200 px-1 rounded">{cnst.value}</span></p>
        </>;
        break;
    }
    case 'Alias': {
        const alias = item as GirAlias;
        content = <>
            {renderCommonDetails(alias)}
            <p>Type: <span className="font-mono bg-slate-200 px-1 rounded">{alias.type}</span> {alias.cType && `(C: ${alias.cType})`}</p>
        </>;
        break;
    }
    default: content = <p>Details for type "{type}" not implemented yet.</p>;
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <DetailCard title={`${type}: ${item.name}`}>
        {content}
      </DetailCard>
    </div>
  );
};

export default GirElementDetails;
