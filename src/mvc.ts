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

	constructor(fn:template){
		this.raw = fn
		this.statesSchema = new Schema('$__mvc.states__')
		let modelBuilder = this.statesSchema.$createBuilder()
		this.vnode = fn(modelBuilder)
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
export interface IRenderContext{
	scope:Scope
	template:Template,
	states:any,
	store:any,
	controller:any
}
function renderVirtualNode(vnode:IVirtualNode,context:IRenderContext):any{
	let elem = renderDomElement(vnode,context)
	return elem
}

function renderDomElement(vnode:IVirtualNode,context:IRenderContext){
	let elem = DomApi.createElement(vnode.tag)
	for(let attrName in vnode.attrs){
		let attrValue = vnode.attrs[attrName]
		
		if(DomApi.isEventAttr(elem,attrName) && typeof attrValue==='function'){
			bindDomElementEvent(elem,attrName,attrValue,context)
			continue
		}
		bindDomElementAttr(elem,attrName,vnode.attrs[attrName],context)
	}
	return elem
}
function bindDomElementEvent(elem:any,evtName:string,handler:Function,context:IRenderContext){
	DomApi.attachEvent(elem,evtName,(e)=>{
		handler.call(context.controller,context.states,elem)
		context.scope['$__mvc.states__'].$set(context.states).$update()
	})
}
function bindDomElementAttr(elem:any,attrName:string,attrValue:any,context:IRenderContext){
	//从proxy里面放出来
	if(attrValue) attrValue = attrValue['$__builder.target__'] || attrValue
	if(attrValue instanceof Schema){
		attrValue = attrValue.$resolveFromScope(context.scope)
	}
	if(attrValue instanceof Observable){
		DomApi.setAttribute(elem,attrName,attrValue.$get())
		let attrBinder = DomAttrBinders[attrName]
		if(attrBinder) attrBinder(elem,attrValue)
		else {
			attrValue.$subscribe((evt:IObservableEvent)=>elem[attrName]=evt.value)
		}

	}else {
		DomApi.setAttribute(elem,attrName,attrValue)
	}
}

const evtNameRegx = /^on/g
let DomApi = {
	createElement:(tag)=>document.createElement(tag)
	,isEventAttr:(elem:any,name:string)=>evtNameRegx.test(name) && elem[name]===null
	,attachEvent:(elem:any,evt:string,handler:Function)=>elem.addEventListener(evt.replace(evtNameRegx,''),handler,false)
	,setAttribute:(elem:any,name:string,value:any)=>elem[name] = value
}
let DomAttrBinders = {
	'value':DomValueBinder
}
function DomValueBinder(elem:any,value:Observable){
	if(elem.tagName==='INPUT'){
		elem.value = value.$get()
		value.$subscribe((e:IObservableEvent)=>{
			elem.value = e.value
		})
	}
}




