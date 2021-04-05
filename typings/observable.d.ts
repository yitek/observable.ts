export declare function is_array(o: any): boolean;
export declare function is_int(o: any): boolean;
export declare function implicit(target?: any, names?: any): any;
declare enum ObservableTypes {
    value = 0,
    object = 1,
    array = 2
}
export interface ISchema {
    $type: ObservableTypes;
    $name: string;
    $owner: Schema;
    $item: Schema;
    $define(value: any): ISchema;
    $prop(name: string): ISchema;
    $asArray(): ISchema;
    [name: string]: any;
}
export declare class Schema implements ISchema {
    $type: ObservableTypes;
    $name: string;
    $owner: Schema;
    $item: Schema;
    constructor(name?: string, owner?: Schema);
    $define(value: any): Schema;
    $prop(name: string, raw?: any): Schema;
    $asArray(item?: Schema): Schema;
    $createBuilder(): any;
    $resolveFromScope(scope: Scope): any;
}
export declare function delay(task: any): void;
declare enum ObservableGetterTypes {
    newest = 0,
    old = 1,
    raw = 2
}
export interface IObservableEvent {
    value?: any;
    old?: any;
    cancel?: boolean;
    sender?: Observable;
    action?: string;
    appends?: Observable[];
    removes?: Observable[];
    modifies?: Observable[];
}
export declare class Observable {
    $schema: Schema;
    $index: string;
    $owner: Observable;
    $value: any;
    $oldValue: any;
    private $__observers__;
    private $__length__;
    constructor(schema: any, parentOrValue?: any, index?: string);
    $get(getterType?: ObservableGetterTypes): any;
    $set(value: any, partial?: boolean, backwrite?: boolean): Observable;
    $update(partialValue?: any, evt?: IObservableEvent | boolean): IObservableEvent;
    $subscribe(handler: (evt: any) => any, disposable?: any): any;
    $unsubscribe(handler: (evt: any) => any): any;
}
export declare class Scope {
    private '$__scope.super__';
    private '$__scope.name__';
    constructor(name?: string, sp?: Scope);
    $declare(name: string, schema?: Schema, value?: any): Observable;
    $createScope(name?: string): Scope;
    $resolve(name: string): any;
}
export {};
