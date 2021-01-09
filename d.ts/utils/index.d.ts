declare type dataType = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
export declare const typeOf: (v: any, type: dataType) => boolean;
export declare const isStr: (v: any) => boolean;
export declare const isInt: (v: any) => boolean;
export declare const isNaN: (v: any) => boolean;
export declare const isBool: (v: any) => boolean;
export declare const isNull: (v: any) => boolean;
export declare const isUndefined: (v: any) => boolean;
export declare const isArray: (v: any) => boolean;
export declare const isObj: (v: any) => boolean;
export declare const isDate: (v: any) => boolean;
export declare const isFn: (v: any) => boolean;
export declare const isRegExp: (v: any) => boolean;
export declare const isSymbol: (v: any) => boolean;
export declare const isPrimitive: (v: any) => boolean;
export declare const has: (obj: any, v: any) => boolean;
export declare const toKeys: (obj: any) => Array<string>;
export declare const toValues: (obj: any) => Array<any>;
export declare const toUpperCase: (str: string) => string;
export declare const toLowerCase: (str: string) => string;
export declare const noop: () => void;
export declare const each: (collection: any, iteratee: Function) => void;
export {};
