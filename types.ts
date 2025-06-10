
export interface GirDoc {
  text: string;
  filename?: string;
  line?: string;
}

export interface GirAttribute {
  name: string;
  value: string;
}

export interface GirSourcePosition {
  filename?: string;
  line?: string;
}

export interface GirParameter {
  name: string;
  type?: string;
  cType?: string;
  doc?: GirDoc;
  transferOwnership?: string;
  nullable?: boolean;
  allowNone?: boolean;
  direction?: string;
  callerAllocates?: boolean;
}

export interface GirReturnValue {
  type?: string;
  cType?: string;
  doc?: GirDoc;
  transferOwnership?: string;
  nullable?: boolean;
}

export interface GirBaseElement {
  id: string; // Unique ID for React keys, e.g., `${namespaceName}.${className}.${methodName}`
  name: string;
  cIdentifier?: string;
  glibName?: string; // For things like signals or type names
  doc?: GirDoc;
  sourcePosition?: GirSourcePosition;
  deprecated?: string | boolean;
  version?: string;
  attributes: GirAttribute[]; 
}

export interface GirCallable extends GirBaseElement {
  parameters: GirParameter[];
  returnValue?: GirReturnValue; // Constructors might not list it if it's the class type itself
  throws?: boolean;
}

export type GirFunction = GirCallable;
export type GirConstructor = GirCallable;
export type GirMethod = GirCallable;
export type GirCallback = GirCallable;


export interface GirProperty extends GirBaseElement {
  type?: string;
  cType?: string;
  transferOwnership?: string;
  writable?: boolean;
  readable?: boolean;
  construct?: boolean;
  constructOnly?: boolean;
}

export interface GirField extends GirBaseElement {
  type?: string;
  cType?: string;
  readable?: boolean;
  writable?: boolean;
  private?: boolean;
  bits?: string;
}

export interface GirSignal extends GirBaseElement {
  when?: string; // e.g. "first", "last", "cleanup"
  detailed?: boolean;
  action?: boolean;
  noHooks?: boolean;
  noRecurse?: boolean;
  parameters: GirParameter[];
  returnValue?: GirReturnValue;
}

export interface GirMember { // This type was defined in types.ts
  name: string;
  value: string;
  cIdentifier?: string;
  glibNick?: string;
  doc?: GirDoc;
  // It's not a GirBaseElement, so it won't have 'id', 'attributes' etc. unless added.
  // For search results, we might need a common structure or handle it.
  // For now, keeping as is. If used in GirAnyElement, ensure properties are checked.
}


export interface GirEnum extends GirBaseElement {
  cType?: string;
  glibTypeName?: string;
  glibGetType?: string;
  members: GirMember[];
  errorDomain?: string; // for error enums
}

export interface GirAlias extends GirBaseElement {
  type?: string;
  cType?: string;
}

export interface GirConstant extends GirBaseElement {
  type?: string;
  cType?: string;
  value: string;
}

export interface GirInterface extends GirBaseElement {
  cSymbolPrefix?: string;
  cType?: string;
  glibTypeName?: string;
  glibGetType?: string;
  parent?: string; // Though interfaces often list prerequisites
  prerequisites?: string[];
  functions: GirFunction[];
  methods: GirMethod[];
  properties: GirProperty[];
  signals: GirSignal[];
  callbacks: GirCallback[];
  constants: GirConstant[];
}

export interface GirClass extends GirInterface { // Extends GirInterface as they share many children
  parent?: string;
  abstract?: boolean;
  fundamental?: boolean; // For GObject fundamental types
  typeStruct?: string; // Name of the class struct
  constructors: GirConstructor[];
  fields: GirField[];
  // Includes functions, methods, properties, signals, callbacks, constants from GirInterface
}

export interface GirRecord extends GirClass { // Records are similar to classes but can be simpler
  disguised?: boolean;
  foreign?: boolean;
  gtypeStructFor?: string;
}


export interface GirNamespace {
  name: string;
  version?: string;
  sharedLibrary?: string | string[];
  cIdentifierPrefixes?: string[];
  cSymbolPrefixes?: string[];
  classes: GirClass[];
  interfaces: GirInterface[];
  records: GirRecord[];
  enums: GirEnum[];
  aliases: GirAlias[];
  constants: GirConstant[];
  functions: GirFunction[];
  callbacks: GirCallback[];
  // Other elements like unions, bitfields can be added
  id: string; // e.g., namespaceName
}

export interface GirRepository {
  fileName: string; // Original name of the GIR file
  includes: Array<{ name: string; version: string }>;
  packages: string[];
  namespaces: GirNamespace[];
  id: string; // e.g., fileName
}

// Ensure GirMember is correctly part of GirAnyElement for type safety in search/display
export type GirAnyElement = 
  | GirNamespace
  | GirClass
  | GirInterface
  | GirRecord
  | GirEnum
  | GirAlias
  | GirConstant
  | GirFunction
  | GirConstructor
  | GirMethod
  | GirProperty
  | GirField
  | GirSignal
  | GirCallback
  | GirMember; // GirMember might need 'id' and 'name' for consistent handling in lists if not directly part of an Enum.
              // For search and display, we often rely on 'name'. 'id' usually composed.
              // Let's assume for now that if GirMember appears in a list (like search results),
              // its 'name' is sufficient, and a synthetic 'id' or path is constructed for keys.


export interface SelectedItem {
  type: string; // e.g., "Class", "Function", "Property"
  item: GirAnyElement;
  filePath: string; // Path to the item, e.g. "fileName.namespaceName.className.methodName"
}

export interface SearchResult extends SelectedItem {}
