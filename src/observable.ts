

'use strict'
export function is_array(o) { return Object.prototype.toString.call(o)==='[object Array]' }

const intRegx = /^\s*[0-9]+\s*$/g
export function is_int(o) {
	if(o===undefined || o ===null) return false
	if(o instanceof Number) return true
	return intRegx.test(o.toString())
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

enum ObservableTypes{
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
}

let schemaBuilderHandlers = {
	get: function(target,name) {
		if(name==='$__builder.target__') return target
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



enum ObservableGetterTypes{
	newest,
	old,
	raw
}
function getValue(getterType?:ObservableGetterTypes){
	if(getterType===undefined || getterType===ObservableGetterTypes.newest) return this.$value
	if(getterType === ObservableGetterTypes.old) return this.$oldValue
	if(this.$owner){
		let target = this.$owner.$get(ObservableGetterTypes.raw)
		return target[this.$schema.$name]
	}
}
function setValue(value:any){
	this.$value = value
	return this
}
function notify(evt){
	if(this.$__valuechanges__){
		for(let i = 0,j=this.$__valuechanges__.length;i<j;i++){
			if(this.$__valuechanges__[i].call(this,evt)===false) return evt 
		}
	}
	return evt
}
function subscribe(handler:(evt)=>any){
	(this.$__valuechanges__ || (this.$__valuechanges__=[])).push(handler)
	return this
}
function unsibscribe(handler:(evt)=>any){
	if(this.$__valuechanges__) for(let i = 0,j=this.$__valuechanges__.length;i<j;i++){
		let existed = this.$__valuechanges__.shift()
		if(existed!==handler) this.$__valuechanges__.push(handler)
	}
	return this
}

export interface IObservableEvent{
	value?:any
	old?:any
	cancel?:boolean
	sender?:Observable
	appends?:Observable[]
	removes?:Observable[]
}

function updateObservable(evt?:IObservableEvent){
	if(this.$value== this.$oldValue && !evt) return
	if(!evt) evt = {}
	evt.old = this.$oldValue
	evt.value = this.$value
	evt.sender = this

	this.$oldValue = this.$value
	if(this.$owner) this.$owner.$get()[this.$schema.$name] = this.$value
	notify.call(this,evt)
	return evt
}
export class Observable{
	$schema:Schema
	$index: string
	$owner:Observable
	$value:any
	$oldValue:any
	private $__valuechanges__
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
			'$__valuechanges__' : undefined
		})

		if(schema.$type===ObservableTypes.object){
			initObjectObservable.call(this)
		}else if(schema.$type===ObservableTypes.array){
			initArrayObservable.call(this)
		}

	}

	$get(getterType?:ObservableGetterTypes):any{
		return getValue.call(this,getterType)
	}
	$set(value:any):Observable{
		return setValue.call(this,value)
	}
	$update(evt?:IObservableEvent){
		return updateObservable.call(this,evt)
	}
	$subscribe(handler:(evt)=>any,disposable?){
		return subscribe.call(this,handler)
	}
	$unsubscribe(handler:(evt)=>any){
		return unsibscribe.call(this,handler)
	}
}
implicit(Observable.prototype,{
	'$get':getValue,'$set':setValue,'$update':updateObservable,'$subscribe':subscribe,'$unsubscribe':unsibscribe
})

function initObjectObservable(){
	(this as any).$set = setObjectValue;
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

function setObjectValue(value){
	value = this.$value = value || {}
	for(let name in this) this[name].$set(value[name])
	return this
}
function updateObjectObservable(evt?:IObservableEvent){
	evt = updateObservable.call(this,evt)
	if(evt && evt.cancel) return evt
	for(let name in this) this[name] .$update()
	return evt
}

function initArrayObservable(){
	(this as any).$set = setArrayValue;
	(this as any).$update = updateArrayObservable
	if(!this.$value) {
		this.$value = []
		if(this.$owner) this.$owner.$get()[this.$schema.$name] = this.$value
	}
	let lengthSchema = new Schema('length', this.$schema)
	let length = new Observable(lengthSchema,this);
	(length as any).$set = function(value){
		value = parseInt(value) || 0
		this.$value = this.$owner.$value.length = value
		return this
	}
	Object.defineProperty(this,'length',{enumerable:false,writable:false,configurable:true,value:length})
	for(let i =0,j= this.$value.length;i<j;i++){
		let item = new Observable(this.$schema.$item,this,i as any as string)
		Object.defineProperty(this,item.$index,{enumerable:true,writable:false,configurable:true,value:item})
	}
}

function setArrayValue(value){
	value = this.$value = value || []
	let len = this.length.$get()
	this.length.$set(value.length)
	for(let i =0,j= len;i<j;i++){
		this[i.toString()].$set(value[i])
	}
	for(let i = len,j=value.length;i<j;i++){
		let item = new Observable(this.$schema.$item,this,i as any as string)
		Object.defineProperty(this,item.$index,{enumerable:true,writable:false,configurable:true,value:item})
	}
	return this
}
function updateArrayObservable(evt?:IObservableEvent){
	if(this.length.$oldValue> this.length.$value){
		let removes = []
		for(let i = this.length.$value,j = this.length.$oldValue;i<j;i++) removes.push(this[i]);
		(evt||(evt={})).removes = removes
	}else if(this.length.$oldValue< this.length.$value){
		let appends = []
		for(let i = this.length.$oldValue,j = this.length.$value;i<j;i++) appends.push(this[i]);
		(evt||(evt={})).appends = appends
	}
	evt = updateObservable.call(this,evt)
	if(evt && evt.cancel){this.length.$oldValue = this.length.$value; return evt}
	let lenEvt:IObservableEvent = this.length.$update()
	let len = this.length.$get()
	for(let i = 0;i<len;i++) this[i].$update()
	if(lenEvt){
		if(lenEvt.old>lenEvt.value){
			for(let i = len;i<lenEvt.old;i++) {
				let item = this[i]
				item.$update({action:'removed'})
			}
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