import {Schema,Observable,Scope,IObservableEvent} from 'observable'
'use strict'
export interface IVirtualNode{
	tag?:string
	content?:string
	component?:any
	attrs?:{[name:string]:any}
	children?:IVirtualNode[]
}
export function virtualNode(tag:string,attrs?:{[name:string]:any}, ...children):IVirtualNode{
	let vnode:IVirtualNode = {}
	vnode.tag = tag,vnode.attrs = attrs
	let childNodes = Array.prototype.slice.call(arguments,2)
	if(childNodes.length) vnode.children = childNodes
	return vnode
}
(window as any).virtualNode = virtualNode

export type template = (states:any,store?:any,controller?:any)=>any
interface IControl{
	states:any
	store:any
	controller:any
	view:any
	mount(container)
	update()
	refresh()
}

export class Template{
	raw:Function
	statesSchema:Schema
	vnode:any
	vloops:{[name:string]:Schema}

	constructor(fn:template){
		this.raw = fn
		this.statesSchema = new Schema('$__mvc.states__')
		let modelBuilder = this.statesSchema.$createBuilder()
		currentVLoops = this.vloops = {}
		currentVLoopsCount = 0
		this.vnode = fn(modelBuilder)
		currentVLoops = undefined
		currentVLoopsCount = 0
		Object.defineProperty(fn,'$__Template.instance__',{enumerable:false,writable:false,configurable:false,value:this})
	}
	static resolve(fn:template):Template{
		let tmpl = fn['$__Template.instance__']
		if(!tmpl) tmpl = new Template(fn)
		return tmpl
	}
	render(states:any,store?:any,controller?:any){
		let scope = new Scope(undefined)
		let statesObservable = new Observable(this.statesSchema,states,'$__mvc.states__')
		scope['$__mvc.states__'] = statesObservable
		let context = {template:this,states,store,controller,scope}
		return renderVirtualNode(this.vnode,context)
	}
}
let currentVLoops;
let currentVLoopsCount=0
function vloop(name?:string){
	if(!name) name = '-loop-item-' + (currentVLoopsCount++)
	let schema = new Schema(name)
	currentVLoops[name] = schema.$createBuilder()
}
export interface IRenderContext{
	scope:Scope
	template:Template,
	states:any,
	store:any,
	controller:any
}
function renderVirtualNode(vnode:IVirtualNode|string,context:IRenderContext,returnElem?:boolean):any{
	let elem = renderDomText(vnode,context,returnElem)
	if(elem!==undefined) return elem

	elem = handleCondition(vnode as IVirtualNode,context,returnElem)
	if(elem!==undefined) return elem
	

	elem = renderDomElement(vnode as IVirtualNode,context,returnElem)
	return elem
}

function handleCondition(vnode:IVirtualNode,context:IRenderContext,returnElem?:boolean){
	if(!vnode || !vnode.attrs || !vnode.attrs.if) return
	let value = vnode.attrs.if;
	if(value instanceof Schema){
		value = value['$__builder.target__'] || value
		value = value.$resolveFromScope(context.scope)
	}
	if(value instanceof Observable){
		vnode.attrs.if = undefined
		let elem = renderVirtualNode(vnode,context,true)
		vnode.attrs.if = value
		let anchor = DomApi.createComment('if')
		value.$subscribe((e:IObservableEvent)=>{
			if(e.value){
				if(anchor.parentNode) {
					DomApi.insertBefore(elem,anchor)
					DomApi.remove(anchor)
				}
			}else{
				if(elem.parentNode){
					DomApi.insertBefore(anchor,elem)
					DomApi.remove(elem)
				}
			}
		})
		let condition = value.$get()
		if(!condition) {
			return returnElem?anchor:(container)=> DomApi.append(container,anchor)
		}else {return returnElem?elem:(container)=>DomApi.append(container,elem)}
	}
	if(value){
		vnode.attrs.if = undefined
		let elem = renderVirtualNode(vnode,context,true)
		vnode.attrs.if = value
		return returnElem?elem:(p)=>DomApi.append(p,elem)
	}else return null
}
function handleFor(vnode:IVirtualNode,context:IRenderContext){
	if(!vnode || !vnode.attrs || !vnode.attrs.for) return
	let pair = vnode.attrs.for;
	let value = pair.each
	if(!value) return
	let items = []
	let scope = context.scope
	let anchor = DomApi.createComment('for')
	Object.defineProperty(anchor,'$__mvc.for.anchor__',{enumerable:false,configurable:true,writable:true,value:items})
	function loop(each,asSchema:Schema,length){
		for(let i = 0;i<length;i++){
			let item = each[i]
			if(item instanceof Observable) {
				scope[asSchema.$name] = item
			}else {
				scope[asSchema.$name] = new Observable(asSchema,item)
			}
			vnode.attrs.for = undefined
			let itemElem = renderVirtualNode(vnode,context)
			vnode.attrs.for = pair
			items.push(itemElem)
		}
		


	}
	if(value instanceof Schema){
		value = value['$__builder.target__'] || value
		value = value.$resolveFromScope(context.scope)
	}

	if(value instanceof Observable){

	}
}

function renderDomText(value:any, context:IRenderContext,returnElem?:boolean){
	let t = typeof value
	if(t==='string' )return returnElem?DomApi.createText(value.toString()):(p)=>DomApi.append(p,DomApi.createText(value.toString()))
	if(value instanceof Schema){
		value = value['$__builder.target__'] || value
		value = value.$resolveFromScope(context.scope)
	}
	if(value instanceof Observable){
		let elem = DomApi.createText(value.$get())
		value.$subscribe((e:IObservableEvent)=>{
			elem.nodeValue = e.value
		})
		return returnElem?elem:(p)=>DomApi.append(p,elem)
	}
	
}

function renderDomElement(vnode:IVirtualNode,context:IRenderContext,returnElem?:boolean){
	let elem = DomApi.createElement(vnode.tag)
	for(let attrName in vnode.attrs){
		let attrValue = vnode.attrs[attrName]
		if(attrValue===undefined) continue
		if(DomApi.isEventAttr(elem,attrName) && typeof attrValue==='function'){
			bindDomElementEvent(elem,attrName,attrValue,context)
			continue
		}
		bindDomElementAttr(elem,attrName,vnode.attrs[attrName],context)
	}
	if(vnode.children) {
		for(let child of vnode.children){
			if(!child) continue
			let childMount = renderVirtualNode(child,context)
			if(childMount) childMount(elem)
		}
	}
	return returnElem?elem:(p)=>DomApi.append(p,elem)
}
function bindDomElementEvent(elem:any,evtName:string,handler:Function,context:IRenderContext){
	DomApi.attachEvent(elem,evtName,(e)=>{
		handler.call(context.controller,context.states,elem)
		context.scope['$__mvc.states__'].$set(context.states).$update()
	})
}
function bindDomElementAttr(elem:any,name:string,value:any,context:IRenderContext){
	//从proxy里面放出来
	if(value instanceof Schema){
		value = value['$__builder.target__'] || value
		value = value.$resolveFromScope(context.scope)
	}
	if(value instanceof Observable){
		DomApi.setAttribute(elem,name,value.$get())
		let attrBinder = DomAttrBinders[name]
		if(attrBinder) attrBinder(elem,value)
		else {
			value.$subscribe((evt:IObservableEvent)=>elem[name]=evt.value)
		}

	}else {
		DomApi.setAttribute(elem,name,value)
	}
}

const evtNameRegx = /^on/g
let DomApi = {
	createElement:(tag)=>document.createElement(tag)
	,createText:(content:string)=>document.createTextNode(content)
	,createComment:(content?:string)=>document.createComment(content||'')
	,isEventAttr:(elem:any,name:string)=>evtNameRegx.test(name) && elem[name]===null
	,attachEvent:(elem:any,evt:string,handler:Function)=>elem.addEventListener(evt.replace(evtNameRegx,''),handler,false)
	,setAttribute:(elem:any,name:string,value:any)=>elem[name] = value
	,append:(p:any,child:any)=>p.appendChild(child)
	,insertBefore:(inserted:any,ref:any)=>ref.parentNode.insertBefore(inserted,ref)
	,remove:(node:any)=>(node.parentNode)?node.parentNode.removeChild(node):undefined
}
let DomAttrBinders = {
	'value':DomValueBinder
	,'bind':(elem:any,value:Observable)=>DomValueBinder(elem,value,true)
}
function DomValueBinder(elem:any,value:Observable,bibind?:boolean){
	let valueElem
	if(elem.tagName==='INPUT'){
		if(elem.type==='checkbox'){
			let p = elem.parentNode
			for(let i =0,j=p.childNodes;i<j;i++){
				let child = p.childNodes[i]
				if(child.tagName==='INPUT' && child.type==='checkbox' && child.name===elem.name){
					throw "not implement"
				}
			}
		}
		valueElem = elem
	} else if(elem.tagName==='TEXTAREA'){
		valueElem = elem
	} else if(elem.tagName==='SELECT'){
		valueElem = elem
	}else {
		elem.innerHTML = value.$get()
		value.$subscribe((e:IObservableEvent)=>{
			elem.innerHTML = e.value
		})
	}
	if(valueElem){
		elem.value = value.$get()
		value.$subscribe((e:IObservableEvent)=>{
			elem.value = e.value
		})
		
	}
	if(bibind){
		DomApi.attachEvent(elem,'blur',()=>{
			value.$set(elem.value)
			value.$update()
		})
		DomApi.attachEvent(elem,'change',()=>{
			value.$set(elem.value)
			value.$update()
		})
	}
}
function DomBindBinder(elem:any, value:Observable){
	
}




