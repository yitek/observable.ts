declare var Promise: any;
declare var thenable: any;
interface IPromise {
    then(onFulfilled: (value: any) => any, onRejected?: (err: any) => any): IPromise;
}
declare var EVENT: any;
interface IRequireUri {
    paths: string[];
    orignal: string;
    resolved: string;
    url: string;
    filename: string;
    ext: string;
}
interface IRequireResourceOpts {
    url: string;
    type: string;
}
interface IRequireResource {
    url: string;
    type: string;
    element: HTMLElement;
    loaded: (valOrCallback?: any) => any;
    error: (valOrCallback?: any) => any;
}
interface IRequireModule {
    uri: IRequireUri;
    url: string;
    name: string;
    resource: IRequireResource;
    deps: {
        [name: string]: IRequireModule;
    };
    definin: (valOrCallback?: any) => any;
    defined: (valOrCallback?: any) => any;
    error: (valOrCallback?: any) => any;
}
interface IRequireDefine {
    (name: string | any[] | Function, deps?: any, statement?: any): void;
    amd: boolean;
    trace: boolean | string;
    resolve: IRequireResolve;
    require: (name: string) => IRequireModule;
    context: any;
    modules: {
        [alias: string]: IRequireModule;
    };
    disabled: boolean;
    Resource: any;
}
interface IRequireModuleOpts {
    name?: string;
    url?: string | IRequireUri;
    value?: any;
}
interface IRequireResolve {
    (url: string): string;
    item?: (name: string, reg: string | RegExp, replacement?: string) => IRequireResolve | {
        regex: RegExp;
        replacement: string;
    };
    rules?: {
        [name: string]: {
            regex: RegExp;
            replacement: string;
        };
    };
}
