interface IUnittest {
    group(name: string, testFn: (test: IUnittest) => any): IUnittest;
    message(content: string): IUnittest;
    eq(exepected: any, actual: any, message?: string): IUnittest;
}
export declare class Unittest implements IUnittest {
    static replace(content: string, data: any): string;
    group(name: string, testFn: (test: IUnittest) => any): IUnittest;
    message(content: string, data?: any): IUnittest;
    eq(exepected: any, actual: any, message?: string): IUnittest;
    true(value: any, message?: string): IUnittest;
    false(value: any, message?: string): IUnittest;
    static instance: IUnittest;
    static group(name: string, fn: (ut: any) => any): IUnittest;
}
export {};
