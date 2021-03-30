import { Schema, Scope } from 'observable';
export interface IVirtualNode {
    tag?: string;
    content?: string;
    component?: any;
    attrs?: {
        [name: string]: any;
    };
    children?: IVirtualNode[];
}
export declare function virtualNode(tag: string, attrs?: {
    [name: string]: any;
}, ...children: any[]): IVirtualNode;
export declare type template = (states: any, store?: any, controller?: any) => any;
export declare class Template {
    raw: Function;
    statesSchema: Schema;
    vnode: any;
    vloops: {
        [name: string]: Schema;
    };
    constructor(fn: template);
    static resolve(fn: template): Template;
    render(states: any, store?: any, controller?: any): any;
}
export declare function variable(name?: string): any;
export interface IRenderContext {
    scope: Scope;
    template: Template;
    states: any;
    store: any;
    controller: any;
}
