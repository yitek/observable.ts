

'use strict;'

/**
 * 是否是数组
 *
 * @export
 * @param {*} o 要判定的值
 * @returns 数组返回true,否则返回false
 */
export function is_array(o) { return Object.prototype.toString.call(o)==='[object Array]' }

/**
 * 数组是否包含某元素
 *
 * @export
 * @param {*} arr array like object/数组
 * @param {*} item 要判定的项值
 * @returns item在数组种返回true, 否则返回false
 */
export function array_contains(arr,item) {
	if(arr)for(let i = 0,j=arr.length;i<j;i++) { if(arr[i]===item) return true }
	return false
}

/**
 * 从数组中移除某个元素,可以将数组中所有的item移除
 *
 * @export
 * @param {*} arr 要移除元素的数组
 * @param {*} item 要移除的元素
 * @returns 被移除的元素个数，0表示没有元素被移除
 */
export function array_remove(arr,item) {
	let c = 0;
	if(arr)for(let i = 0,j=arr.length;i<j;i++) { 
		let existed = arr.shift();if(item!==existed) {arr.push(existed)} else c++; }
	return c;
}

const intRegx = /^\s*[0-9]+\s*$/g
export function is_int(o) {
	if(o===undefined || o ===null) return false
	if(o instanceof Number) return true
	return intRegx.test(o.toString())
}
const trimRegx = /^s+|s+$/gi
export function trim(o) {
	if(o===null || o===undefined) return ''
	return o.toString().replace(trimRegx,'')
}

export function implicit(target?:any,names?:any){
	
	if(target){
		if(names) {
			if(is_array(names)){
				for(let name of names)
				Object.defineProperty(target,name,{enumerable:false,configurable:true,writable:true,value:target[name]})
			}else {
				for(let name in names) Object.defineProperty(target,name,{enumerable:false,configurable:true,writable:true,value:names[name]})
			}
		} else for(let name in target)Object.defineProperty(target,name,{enumerable:false,configurable:true,writable:true,value:target[name]})
		return target
	}
	return function(target,name?){
		if(name) {
			Object.defineProperty(target,name,{enumerable:false,configurable:true,writable:true,value:target[name]})
			return target
		} 
		let raw = target
		if(typeof target ==='function') target = target.prototype
		for(let name in target) Object.defineProperty(target,name,{enumerable:false,configurable:true,writable:true,value:target[name]})
		return raw
	}
}

export enum ObservableTypes{
	value,
	object,
	array
}
declare var Proxy;
export interface ISchema{
	$type: ObservableTypes
	$name: string
	$owner :Schema
	$item : Schema
	$define(value:any):ISchema;
	$prop(name:string):ISchema;
	$asArray():ISchema;
	[name:string]:any;
}
@implicit()
export class Schema implements ISchema{
	$type: ObservableTypes
	$name: string
	$owner :Schema
	$item : Schema

	constructor(name?:string,owner?:Schema){
		implicit(this,{
			$type:ObservableTypes.value,$name:name,$owner :owner,$item:undefined
		})
		
	}
	$define(value:any):Schema{
		let t = typeof value
		if(t==='object'){
			if(is_array(value)){
				let item = this.$asArray()
				item.$define(value[0])
			}else {
				for(let name in value){
					this.$prop(name).$define(value[name])
				}
			}
		}else {
			this.$type = ObservableTypes.value
		}
		return this
	}
	$prop(name:string,raw?:any){
		if(this.$type ===ObservableTypes.value ) this.$type = ObservableTypes.object
		if(this.$type === ObservableTypes.array) throw new Error('不可以给数组增添属性')
		let prop = new Schema(name,this)
		//为了使用Proxy,不能writable&configurable 都为false
		Object.defineProperty(this,name,{enumerable:true,configurable:true,writable:false,value:prop})
		return prop
	}
	$asArray(item?:Schema){
		if(this.$type ===ObservableTypes.value ) this.$type = ObservableTypes.array
		if(this.$type === ObservableTypes.object) throw new Error('不可以将对象转成数组')
		if(!this.$item) this.$item = item || new Schema('',this)
		return this.$item
	}
	$createBuilder(){
		return new Proxy(this,schemaBuilderHandlers)
	}
	$resolveFromScope(scope:Scope){
		let names:string[] = this['$__pathnames']
		if(!names) {
			names = []
			let p:Schema = this
			while(p){
				let name = p.$name
				if(name===undefined || name===null) name = ''
				names.unshift(name)
				p = p.$owner
			}
			Object.defineProperty(this,'$__pathnames',{enumerable:false,configurable:false,writable:false, value:names
			})
		}
		let rootName = names[0]
		let ob = scope.$resolve(rootName)
		for(let i =1;i<names.length;i++) {
			ob = ob[names[i]]
		}
		return ob
	}

	static BUILDER_TARGET :string = '$__builder.target__'
	static fromBuilder(builder){
		if(!builder) return null
		let target = builder[Schema.BUILDER_TARGET]
		if(target) return target
		if(builder instanceof Schema) return builder
		return null;
	}
}

let schemaBuilderHandlers = {
	get: function(target,name) {
		if(name===Schema.BUILDER_TARGET) return target
		let prop
		if(is_int(name)) {
			console.log(target)
			prop = target.$asArray()
		}else{
			prop = target[name]
			if(!prop) {
				if(target.$type === ObservableTypes.array)
					prop =  target.$asArray()
				else prop = target.$prop(name)
			}
		}
        
		if(prop instanceof Schema) {
			return prop.$createBuilder()
		}
		return prop
    },
	set:function(target,name,value){
		throw new Error('schema的构造阶段不允许设置值')
	}
}

const delayTasks = []
let delayTimer
export function delay(task){
	if(!delayTimer) delayTimer = setTimeout(()=>{
		while(delayTasks.length){
			let task = delayTasks.shift()
			task()
		}
		delayTimer = 0
	},0)
}

enum ObservableGetterTypes{
	newest,
	old,
	raw
}

function notify(evt){
	if(this.$__observers__){
		for(let i = 0,j=this.$__observers__.length;i<j;i++){
			if(this.$__observers__[i].call(this,evt)===false) return this 
		}
	}
	return this
}
function subscribe(handler:(evt)=>any){
	(this.$__observers__ || (this.$__observers__=[])).push(handler)
	return this
}
function unsibscribe(handler:(evt)=>any){
	if(this.$__observers__) for(let i = 0,j=this.$__observers__.length;i<j;i++){
		let existed = this.$__observers__.shift()
		if(existed!==handler) this.$__observers__.push(handler)
	}
	return this
}

export interface IObservableEvent{
	value?:any
	old?:any
	cancel?:boolean
	sender?:Observable
	action?:string
	appends?:Observable[]
	removes?:Observable[]
	modifies?:Observable[]
}

export class Observable{
	$schema:Schema
	$index: string
	$owner:Observable
	$value:any
	$oldValue:any
	private $__observers__
	private $__length__
	constructor(schema:any,parentOrValue?:any,index?:string){
		let owner ,value,old
		if(schema instanceof Schema){
			if(parentOrValue instanceof Observable){
				owner = parentOrValue
				index = (index===undefined||index===null)?schema.$name:index
				old = value = owner.$value[index]
			}else{
				old = value = parentOrValue
				owner = undefined
			}
		}else {
			old = value = schema
			schema = new Schema(undefined,undefined)
			schema.$define(value)
		}	
		if(index===undefined || index===null) index = schema.$name	
		implicit(this,{
			'$owner':owner,
			'$schema': schema,
			'$value' : value,
			'$oldValue' : old,
			'$index': index,
			'$get': this.$get,
			'$set': this.$set,
			'$update': this.$update,
			'$__observers__' : undefined
		})

		if(schema.$type===ObservableTypes.object){
			initObjectObservable.call(this)
		}else if(schema.$type===ObservableTypes.array){
			initArrayObservable.call(this)
		}

	}

	$get(getterType?:ObservableGetterTypes):any{
		return getValueObservable.call(this,getterType)
	}
	$set(value:any,partial?:boolean,backwrite?:boolean):Observable{
		return setValueObservable.call(this,value,partial,backwrite)
	}
	$update(partialValue?:any,evt?:IObservableEvent|boolean):IObservableEvent{
		return updateObservable.call(this,partialValue,evt)
	}
	$subscribe(handler:(evt)=>any,disposable?){
		return subscribe.call(this,handler)
	}
	$unsubscribe(handler:(evt)=>any){
		return unsibscribe.call(this,handler)
	}
}
function getValueObservable(getterType?:ObservableGetterTypes){
	if(getterType===undefined || getterType===ObservableGetterTypes.newest) return this.$value
	if(getterType === ObservableGetterTypes.old) return this.$oldValue
	if(this.$owner){
		let target = this.$owner.$get(ObservableGetterTypes.raw)
		return target[this.$schema.$name]
	}
}
function setValueObservable(value:any,partial?:boolean,backwrite?:boolean){
	this.$value = value
	if(backwrite!==false && this.$super) this.$super.$value[this.$index] = value 
	
	return this
}
function updateObservable(partialValue?:any,evt?:IObservableEvent|boolean){
	let old = this.$oldValue
	if(partialValue!==undefined){
		this.$value = partialValue
		if(this.$owner) this.$owner.$value[this.$index] = partialValue
	} 
	this.$oldValue = this.$value
	if(this.$value=== old || evt===false) return
	if(!evt) evt = {} as IObservableEvent;
	(evt as IObservableEvent).old = old;
	(evt as IObservableEvent).value = this.$value;
	(evt as IObservableEvent).sender = this;
	notify.call(this,evt)
	
	return evt
}
implicit(Observable.prototype,{
	'$get':getValueObservable,'$set':setValueObservable,'$update':updateObservable,'$subscribe':subscribe,'$unsubscribe':unsibscribe
})

function initObjectObservable(){
	(this as any).$set = setObjectObservable;
	(this as any).$update = updateObjectObservable;
	if(!this.$value) {
		this.$value = {}
		if(this.$owner) this.$owner.$get()[this.$schema.$name] = this.$value
	}
	for(let name in this.$schema){
		let prop = new Observable(this.$schema[name],this)
		Object.defineProperty(this,name,{enumerable:true,writable:false,configurable:false,value:prop})
	}
}

function setObjectObservable(value:any,partial?:boolean,backwrite?:boolean){
	value = this.$value = value || {}
	if(backwrite!==false && this.$super) this.$super.$value[this.$index] = value
	if(partial){
		for(let name in value){
			let ob = this[name]
			if(ob) ob.$set(value[name],true,false)
		}
	}else {
		for(let name in this) this[name].$set(value[name],undefined,false)
	}
	
	return this
}

function updateObjectObservable(partialValue?:any,evt0?:IObservableEvent|boolean){
	let evt:IObservableEvent = evt0 as IObservableEvent
	if(partialValue){
		if(evt){
			for(let name in partialValue) {
				let ob:Observable = this[name]
				if(ob) ob.$set(partialValue[name],true,true)
			}
			evt = updateObservable.call(this,undefined,evt)
			if(evt&&!evt.cancel){
				for(let name in partialValue) {
					let ob:Observable = this[name]
					if(ob) ob.$update(undefined,undefined)
				}
			}
			
			return evt
		} else {
			for(let name in partialValue) {
				let ob:Observable = this[name]
				if(ob) ob.$update(partialValue[name],evt?.cancel?false:undefined)
			}
		}
	}else{
		evt = updateObservable.call(this,undefined,evt)
		for(let name in this) this[name].$update(undefined,(evt&&evt.cancel)?false:undefined)
		return evt
	}
	
	
}

function initArrayObservable(){
	(this as any).$set = setArrayObservable;
	(this as any).$update = updateArrayObservable
	if(!this.$value) {
		this.$value = []
		if(this.$owner) this.$owner.$get()[this.$schema.$name] = this.$value
	}
	let lengthSchema = new Schema('length', this.$schema)
	let length = new Observable(lengthSchema,this);
	(length as any).$set = function(value){
		value = parseInt(value) || 0
		let old = this.$oldValue
		if(value>old){
			let arr = this.$super
			for(let i=old;i<value;i++){
				let item = new Observable(arr.$schema.$item,arr,i as any as string)
				Object.defineProperty(arr,i,{enumerable:true,configurable:true,writable:false,value:item})
			}
			this.$value = this.$owner.$value.length = value
			if(arr.$__length__<value) arr.$__length__ = value
		}else if(value<old){
			let arr = this.$super
			for(let i=value;i<old;i++){
				let item = arr[i]
				Object.defineProperty(arr,i,{enumerable:false,configurable:true,writable:false,value:item})
			}
			this.$value = this.$owner.$value.length = value
		}
		
		return this
	}
	Object.defineProperty(this,'length',{enumerable:false,writable:false,configurable:true,value:length})
	for(let i =0,j= this.$value.length;i<j;i++){
		let item = new Observable(this.$schema.$item,this,i as any as string)
		Object.defineProperty(this,item.$index,{enumerable:true,writable:false,configurable:true,value:item})
	}
	Object.defineProperty(this,'$__length__',{enumerable:false,writable:true,configurable:false,value:this.length.$value})
}

function setArrayObservable(value:any[],partial?:boolean){
	value = this.$value = value || []
	
	if(partial){
		for(let i =0;i<value.length;i++){
			let itemValue = value[i]
			let item = this[i]
			if(itemValue!==undefined){
				if(item)item.$set(itemValue,true)
				else this.$value[i] = itemValue
			}
			
		}
		if(value.length>this.length.$value)this.length.$set(value.length)
	}else{
		this.length.$set(value.length)
		this.$value = value
		for(let i =0;i<value.length;i++){
			this[i].$set(value[i])			
		}
		
	}
	
	
	
	return this
}
function updateArrayObservable(evt0?:IObservableEvent,partialValue?:any[]){
	
	if(partialValue) {
		this.$set(partialValue,true)
	}
	let modifies = [],removes
	let oldLen = this.length.$oldValue
	let newLen = this.length.$value
	let evt = evt0 || {}
	if(oldLen> newLen){
		
		removes=[]
		for(let i = newLen;i<oldLen;i++){
			removes.push(this[i]);
		} 
		evt.removes = removes
	}else if(oldLen<newLen){
		let appends = []
		for(let i = oldLen;i<newLen;i++){
			let newItem = this[i]
			if(!newItem){
				newItem = new Observable(this.$schema,this,i as any as string)
				this[i] = new newItem
			}
			appends.push(newItem);
		} 
		evt.appends = appends
	}
	for(let i =newLen;i<this.$__length__;i++){
		delete this[i]
	}
	this.$__length__ = 0
	let len = Math.min(oldLen,newLen)
	for(let i = 0;i<len;i++) modifies.push(this[i])
	evt.modifies = modifies
	evt = updateObservable.call(this,evt0===null?null:evt)
	
	let lenEvt:IObservableEvent = this.length.$update( evt0===null?null:undefined)
	if((evt&&evt.cancel) || (lenEvt && lenEvt.cancel)) evt =null
	for(let i = 0;i<len;i++) modifies[i].$update(evt===null?null:undefined)
	
	if(removes){
		for(let i = 0;i<removes.length;i++) {
			removes[i].$update({action:'removed'})
		}
	}
	return evt
}

@implicit()
export class Scope{
	private '$__scope.super__':Scope
	private '$__scope.name__':string
	constructor(name?:string,sp?:Scope){
		implicit(this,{
			'$__scope.name__':name,
			'$__scope.super__':sp
		})
	}
	$declare(name:string,schema?:Schema,value?:any){
		return this[name] = new Observable(schema,value,name)
	}
	$createScope(name?:string){
		return new Scope(name, this)
	}
	$resolve(name:string){
		let ob = this[name]
		if(!ob){
			let p = this["$__scope.super__"]
			if(p) ob= p.$resolve(name)
		}
		return ob
	}
	//$resolve()
}

// <table><col slot-scope={x}>{x + model.y}</col></table>
// <ul><li for={each:data.items, as: item}>{item.name + data.name}</li></ul>