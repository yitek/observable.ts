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
 * 从数组中移除某个元素,可以将数组中所有的item移除
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
export declare enum ObservableTypes {
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
    static BUILDER_TARGET: string;
    static fromBuilder(builder: any): any;
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
    /**
     * 获取observable的值
     *
     * @param {ObservableGetterTypes} [getterType]
     * @returns {*}
     * @memberof Observable
     */
    $get(getterType?: ObservableGetterTypes): any;
    /**
     * 设置obbservable的值
     *
     * @param {*} value 要设置的值
     * @param {boolean} [isPartial] 是否是部分设置,默认为false.如果不是部分设置，会将值整个的替换成value的值；如果是部分设置，且value为引用类型，原先的observable的值不会被替换，而是执行copyTo操作，将value参数的成员给observable的值的对应成员做赋值,下级observable赋值也是部分赋值
     * @param {boolean} [isBackwrite] 是否要回写value值,默认为false。该参数一般为框架内部使用。当该observable有上级对象，赋值时是否要将上级对象中的对应成员的值替换成当前的value参数的值
     * @returns {Observable}
     * @memberof Observable
     */
    $set(value: any, isPartial?: boolean, isBackwrite?: boolean): Observable;
    /**
     * 触发事件
     *
     * @param {IObservableEvent} [evt]
     * @param {*} [partialValue]
     *  * @param {*} [isBackwrite]
     * @returns {IObservableEvent}
     * @memberof Observable
     */
    $trigger(evt?: IObservableEvent, partialValue?: any, isBackwrite?: boolean): IObservableEvent;
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
