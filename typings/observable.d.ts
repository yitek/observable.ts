/**
 * 是否是数组
 *
 * @export
 * @param {*} o 要判定的值
 * @returns 数组返回true,否则返回false
 */
export declare function is_array(o: any): boolean;
/**
 * 数组是否包含某元素
 *
 * @export
 * @param {*} arr array like object/数组
 * @param {*} item 要判定的项值
 * @returns item在数组种返回true, 否则返回false
 */
export declare function array_contains(arr: any, item: any): boolean;
/**
 * 从数组中移除某个元素
 *
 * @export
 * @param {*} arr 要移除元素的数组
 * @param {*} item 要移除的元素
 * @returns 被移除的元素个数，0表示没有元素被移除
 */
export declare function array_remove(arr: any, item: any): number;
export declare function is_int(o: any): boolean;
export declare function trim(o: any): any;
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
