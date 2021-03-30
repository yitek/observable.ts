declare var Promise
declare var thenable


interface IPromise{
    then(onFulfilled:(value:any)=>any,onRejected?:(err:any)=>any):IPromise;
}

(function(window:any){
// a = a0.then((v)=>promise(v)).then((v)=>{})

enum FulfillStates{
    padding,
    fulfilled,
    rejected
}
interface IThenCallback{
    onFulfilled?,
    onRejected?,
    resolve?,
    reject?

}
let microRun
try{
    microRun = globalThis.setImmediate
}catch{}
if(!microRun) microRun = (fn)=>setTimeout(fn, 0);
function thenable(deferFn?:(resolve:(value?:any)=>any,reject?:(err:any)=>any)=>any,target?){
    if(!target){
        target = this
        if(!target || target===window || target===globalThis) target = {}
    }
    let ffValue
    let ffStatus:FulfillStates = FulfillStates.padding
    let callbacks:IThenCallback[]

    let handleCallback = (cb:IThenCallback)=>{
        if(ffStatus === FulfillStates.fulfilled){
            if (!cb.onFulfilled) {// onFullfilled如果是空，就把结果直接传给下一个then
                cb.resolve(ffValue)
                return
            }
            var ret = cb.onFulfilled(ffValue);
            cb.resolve(ret);// 链式调用的关键，把返回结果传递给下一个resolve
            return
        }
        if(ffStatus === FulfillStates.rejected){
            if (!cb.onRejected) {// onFullfilled如果是空，就把结果直接传给下一个then
                cb.reject(ffValue)
                return
            }
            cb.onRejected(ffValue)
            //cb.reject(ffValue)
        }
    }
    
    let then = (onFulfilled,onRejected?) => {
        return thenable((resolve,reject) => {
            let cb = {
                onFulfilled:onFulfilled,
                onRejected :onRejected,
                resolve:resolve,
                reject:reject
            }
            if(ffStatus === FulfillStates.padding) { // 异步的话就先存着，后面再执行
                (callbacks || (callbacks = [])).push(cb)
                return;
            }
            handleCallback(cb)
        });
    }
    let resolve = function(value:any){
        if(ffStatus!==FulfillStates.padding) throw TypeError('already fullfiled')
         // resolve传过来的，除了数值，还有可能是上一个then返回的promise，下面这个if主要处理这种情况
         if (value && (typeof value === 'object' || typeof value === 'function')) {
            var then = value.then;
            if (typeof then === 'function') {
                then.call(value, resolve,reject); // 如果是一个promise，则调用它的then
                return;
            }
        }
        ffStatus = FulfillStates.fulfilled;
        ffValue = value;
        if(!callbacks) return
        for(let i = 0,j= callbacks.length;i<j;i++){
            let cb = callbacks[i]
            if(!cb.onFulfilled) {
                cb.resolve(ffValue)
                continue
            }
            var ret = cb.onFulfilled(ffValue);
            cb.resolve(ret);// 链式调用的关键，把返回结果传递给下一个resolve
        }
        callbacks = undefined
    }
    let reject = (err:any)=>{
        if(ffStatus!==FulfillStates.padding) throw TypeError('already fullfiled')
        ffValue = err
        ffStatus = FulfillStates.rejected
        if(!callbacks) return
        for(let i = 0,j= callbacks.length;i<j;i++){
            let cb = callbacks[i]
            if(cb.onRejected) cb.onRejected(ffValue)
            //if(cb.reject) cb.reject(ffValue)
        }
        callbacks = undefined
    }
    
    
    Object.defineProperty(target,"then",{enumerable:false,configurable:true,writable:true,value:then})
    if(deferFn){
        microRun(()=>{
            try{
                deferFn(resolve,reject)
            }catch(ex){
                reject(ex)
            }
            
        })
    }
    return target
}
function PromiseA(fn?){ return thenable.call(this,fn)}

window.thenable = thenable
window.PromiseA = PromiseA
try{
    if(typeof Promise ==='undefined' ){
        window.Promise = PromiseA
    }
}catch{
    if(!window.Promise)window.Promise = PromiseA
}

})(typeof window!=='undefined'?window:globalThis);

////////////////////////////////////////////////////
// Eventable
//
declare var EVENT
(function(window){
    let none ={}
    function event(name?,target?:any){
        let callbacks :{(evt:any):any}[]
        let fulfill = none
        let facade:any = function(handler:(evt:any)=>any){
            if(typeof handler==='function'){
                if(name===true && fulfill!==none){
                    handler(fulfill)
                }else {
                    (callbacks ||(callbacks=[])).push(handler)
                }
                return this;
            }
            if(name===true) fulfill = handler
            if(!callbacks) return this
            
            for(let i = 0,j=callbacks.length;i<j;i++){
                callbacks[i].call(this,handler)
            }
            return this
        }
        facade.remove = function(handler):boolean{
            if(callbacks){
                let rs = false
                for(let i = 0,j=callbacks.length;i<j;i++){
                    let callback = callbacks.shift()
                    if(callback!==handler) callbacks.push(callback)
                    else rs = true
                }
                return rs
            }
            return false
        }
        if(target && name && name!==true) target[name] = facade
        return facade
    }
    window.EVENT = event
})(typeof window!=='undefined'?window:globalThis);

///////////////////////////////////////////////////////////////////////
// require
//


interface IRequireUri{
    paths:string[];
    orignal:string;
    resolved:string;
    url:string;
    filename:string;
    ext:string;
}

interface IRequireResourceOpts{
    url:string;
    type:string;
}

interface IRequireResource{
    url:string;
    type:string;
    element:HTMLElement;
    loaded:(valOrCallback?:any)=>any;
    error:(valOrCallback?:any)=>any;
}

interface IRequireModule {
    uri:IRequireUri;
    url:string;
    name:string;
    resource:IRequireResource;
    deps:{[name:string]:IRequireModule};
    definin:(valOrCallback?:any)=>any;
    defined:(valOrCallback?:any)=>any;
    error:(valOrCallback?:any)=>any;
}

interface IRequireDefine{
    (name:string|any[]|Function,deps?:any,statement?:any):void;
    amd:boolean;
    trace:boolean|string;
    resolve:IRequireResolve;
    
    require:(name:string)=>IRequireModule;
    context:any;
    modules:{[alias:string]:IRequireModule};
    disabled:boolean;
    Resource:any
}

interface IRequireModuleOpts{
    name?:string;
    url?:string|IRequireUri;
    value?:any;
}
interface IRequireResolve{
    (url:string):string;
    item?:(name:string,reg:string|RegExp,replacement?:string)=>IRequireResolve|{regex:RegExp,replacement:string};
    rules?:{[name:string]:{regex:RegExp,replacement:string}};
}

(function(window){  
(window as any).module=undefined;
(window as any).exports={};
/**
 * 获取document的head的函数
 *
 * @param {{[name:string]:any}} initModules
 */


const head:()=>HTMLElement=function():HTMLElement{
    let headElem:HTMLElement = Resource.headElement
    if(headElem) return headElem
    //if(headElem && headElem.parentElement==document.documentElement) return headElem
    let elems = document.getElementsByTagName("head");
    
    if(!elems || elems.length==0) {
        //如果找不到head元素，就创建一个
        headElem = document.createElement("head");
        try{
            //试图再documentElement中添加head元素
            if(document.documentElement.firstChild) document.documentElement.insertBefore(headElem,document.documentElement.firstChild);
            else document.documentElement.appendChild(headElem);
        }catch(ex){
            //无法在documentElement中添加head元素，在body中添加一个
            
            headElem = document.createElement("div");
            headElem.style.display="none";
            headElem.id = "ya-require-head";
            let refScript = document.scripts[0];
            if(refScript) {
                refScript.parentNode.insertBefore(headElem,refScript);
            }else {
                if(!document.body) throw new Error("无法在documentElement/body中创建script");
                if(document.body.firstChild) document.body.insertBefore(headElem,document.body.firstChild);
                else document.body.appendChild(headElem);
            }
        }
    }else{
        headElem = elems[0] as HTMLHeadElement;
    }
    return Resource.headElement = headElem;
}

/**
 * 给对象附加状态函数
 * 所谓状态函数是这样一个东西
 *  subject.ready(onready);该状态处于终值时，onready会被调用
 * subject.ready({}); 给该状态设置终值
 * subject.ready();获取该状态的终值，
 *
 * @param {*} obj
 * @param {string[]} names
 * @param {number} step
 */
function makeState(obj,names:string[],error_name?:string,step?:number){
    if(step===undefined){
        for(let i in names) makeState(obj,names,error_name,i as any as number);
        //for(let i in names) EVENT()
        return;
    }
    
    let name = names[step];
    let privateName = '__' + name;
    if(error_name) error_name = "__" + error_name;
    //obj[name]其实是状态函数
    obj[name] = function(valOrCallback:any){
        if(valOrCallback===undefined){
            let val = this[privateName];
            if(val &&val.fulfilled) return val.value;
            return undefined;
        }
        if(typeof valOrCallback ==="function"){
            let callbacks = this[privateName] ||(this[privateName]=[]);
            callbacks.push(valOrCallback);
            return this;
        }else{
            if(error_name && privateName!==error_name) {
                let err = this[error_name];
                if(err && err.fulfilled){
                    console.warn("该对象已经处于" + error_name+"状态,忽略其他状态的终值");
                    return this;
                }
               
            } 
            let cstep = this.__step;
            if(cstep>=step) throw Error(`对象已经处于[${this.__stepname}=${cstep}]终值状态，无法再给该状态指定[${name}=${step}]指定终值`);
            this.__step = step;
            this.__stepname = name;
            let callbacks = this[privateName];
            this[privateName] = {fulfilled:true,value:valOrCallback};
            this[name]=function(valOrCallback){
                if(valOrCallback===undefined) return this[privateName].value;
                if(typeof valOrCallback!=="function") throw new Error(`对象的[${name}]已经得到终值，不能再设置终值`);
                valOrCallback.call(this,this[privateName].value);
                return this;
            };
            if(callbacks) for(let callback of callbacks)
                callback.call(this,valOrCallback);
            return this;
        }
    }
}

/**
 * 表示url的各个部分
 * 可以通过basePaths参数来获取url的绝对值
 *
 * @class Uri
 */
class Uri implements IRequireUri{
    paths:string[];
    orignal:string;
    resolved:string;
    url:string;
    ext:string;
    filename:string;
    constructor(url:string,basPaths?:string[],resolveUrl?:(url:string)=>string){
        this.orignal = url;
        url = this.resolved = resolveUrl?resolveUrl(url):url;
        
        let paths=this.paths=[];
        if(basPaths)for(let i =0,j=basPaths.length;i<j;i++) paths.push(basPaths[i]);
        let names = url.split('/');       
        for(let i = 0,j=names.length-1;i<j;i++){
            let n = names[i].replace(/(^\s+)|(\s+)$/g,"");
            if(n==="." && paths.length) continue;
            else if(n==="..") {
                if(paths.length){
                    let n1 = paths.pop();
                    if(n1[0]=='.') paths.push(n1);
                    else continue;
                }
            }
            else if(!n) continue;
            paths.push(n);
        }
        
        let name = names[names.length-1];
        if(name.lastIndexOf(".js")!==name.length-3) name += ".js";
        this.filename = name;
        if(paths.length) this.url = paths.join("/") + "/" + name;
        else this.url = name;
        let lastIndex = this.filename.lastIndexOf(".");
        if(lastIndex>0) this.ext = this.filename.substr(lastIndex+1);
    }
}



//////////////////////////////////////////////////////////////////////////////////////////
// Resource


/**
 * 代表要加载的资源
 *
 * @class Resource
 * @extends {Ready}
 * @implements {IRequireResource}
 */
class Resource implements IRequireResource {
    element:HTMLElement;
    type:string;
    url:string;
    error:(valOrCallback:any)=>Resource;
    loaded:(valOrCallback:any)=>Resource;
    constructor(public uri:Uri){
        //获取url字符串，可能会追加一个随机数防止缓存
        let url = this.url = this._makeUrl(uri.url);
        //创建dom元素
        let elem:any = this.element = this._createElement(url);
        
        //设置完成的回调函数
        if(elem.onload!==undefined)elem.onload=()=>{
            if(elem.src.indexOf('mock-fra.js')>=0){
                console.log("elem.onload",elem)
            }
            if(define.trace===true||define.trace==="loaded")console.info(`[资源][loaded ]:${url}`);
            // if(url.indexOf("framework")>=0) debugger
            this.loaded(this); 
            
        }
        else elem.onreadystatechange = ()=>{
            if(elem.src.indexOf('mock-fra.js')>=0){
                console.log(elem.readyState)
            }
            if(elem.readyState===4|| elem.readyState==="complete") {
                
                if(define.trace===true||define.trace==="loaded")console.info(`[资源][loaded ]:${url}`);
                this.loaded(this);
                
            }
        };
        //设置出错的回调函数
        elem.onerror =(err,ex)=>{
            console.error("[资源][error  ]:"+this.url,err,ex,this); 
            this.error(err);
        }
        //将元素添加到head中
        
        if(define.trace===true||define.trace==="loading")console.info(`[资源][loading]:${url}`);
        this._load();
        
    }
    protected _makeUrl(url:string):string{
        if(url.indexOf("?")>0) url+= "&";
        else url += "?";
        url += Math.random();
        return url;
    }
    protected _createElement(url:string):HTMLElement{
        throw new Error("abstract method");
    }
    protected _load(){
        head().appendChild(this.element);
    }
    
    static load(opts:IRequireResourceOpts|string|Uri):IRequireResource{
        let uri ,type;
        if(opts instanceof Uri){
            uri = opts;
        }else if(typeof opts ==="object"){
            uri = new Uri(opts.url);
            type = opts.type;
        }else {
            uri =new Uri(opts as any);
        }
        if(!type){
            if(uri.ext==="css") return new StylesheetResource(uri);
            else return new ScriptResource(uri);
        }else {
            if(type=="css")  return new StylesheetResource(uri);
            else return new ScriptResource(uri);
        }
    }
    static headElement
}
makeState(Resource.prototype,["loaded","error"],"error");

class ScriptResource extends Resource{
    constructor(uri:Uri){
        super(uri);
        this.type = "js";
    }
    _createElement(url):HTMLElement{
        let elem = document.createElement("script") as HTMLScriptElement;
        elem.type="text/javascript";
        elem.src = url;
        return elem;
    }
}

class StylesheetResource extends Resource{
    constructor(uri:Uri){
        super(uri);
        this.type = "css";
    }
    _createElement(url):HTMLElement{
        let elem = document.createElement("link") as HTMLLinkElement;
        elem.type="text/css";
        elem.href = url;
        elem.rel = "stylesheet";
        return elem;
    }
}

class DependenceNotDefinedException extends Error{
    constructor(msg:string,public majorModule:IRequireModule,public depModule:IRequireModule){
        super(msg);
        this.isDependenceNotDefinedException=true;
    }
    public isDependenceNotDefinedException:boolean;
}

////////////////////////////////////////////////////////////////
// Module
const modules :{[name:string]:IRequireModule}={};

class Module implements IRequireModule{
    
    uri:Uri;
    url:string;
    name:string;

    /**
     * 模块的别名
     * 装载着模块的所有名称
     * @type {string[]}
     * @memberof Module
     */
    aliases:string[];

    resource:IRequireResource;
    deps:{[name:string]:IRequireModule};

    definin:(valOrCallback?:any)=>any;
    defined:(valOrCallback?:any)=>any;
    error:(valOrCallback?:any)=>any;

    constructor(public opts:IRequireModuleOpts){
        //获取uri与url    
        if(!opts.url) throw new Error('必须要有url');
        if(opts.url instanceof Uri) this.uri = opts.url;
        else this.uri = new Uri(opts.url as string);

        if(this.uri.ext!=="js"){
            this.uri.ext= "js";
            this.uri.url += ".js";
            this.uri.filename+= ".js";
        }

        this.alias(this.url = define.resolve(this.uri.url));
        this.deps={};
        this.name = opts.name;
        if(!this.name) this.name = this.url;
        else if(this.url!=this.name) this.alias(self.name,true);
        
        
        if(opts.value){
            this.definin(null);
            this.defined(opts.value);
            return;
        }
        if(define.trace===true||define.trace==="initing")console.info(`[模块][initing]:${this.url}`);
        this.resource = Resource.load(this.uri).loaded((elem)=>{
            let execution:DefineExecution = DefineExecution.current;
            DefineExecution.current= undefined;
            if(!execution) {
                
                if(define.trace===true||define.trace==="loaded")console.info(`[模块][definin ]:${this.url}`);
                this.definin(elem);
                let exports = (window as any).exports;
                //其他模块被加载的时候就不会使用该模块的exports了。
                (window as any).exports={};
                
                console.warn(`[模块][defined]${this.url}.未用define定义模块,使用全局的exports作为该模块的输出。`);
                this.defined(exports);
                return;
            }
            //把module注入到当前上下文中
            //上下文会在setTimout(0)后执行模块的factory
            (execution as any).module = this;
            
        }).error((ex)=>{
            console.error("资源加载错误",ex);
            this.error(ex);
        }) as IRequireResource;     
    }
    

    alias(name:string,force?:boolean):Module{
        if(!this.aliases) this.aliases=[];
        let existed =modules[name];
        if(existed){
            if(existed===this) return this;
            if(force){
                console.warn(`模块[${name}]被替换掉了`,existed,this);
            }else throw new Error(`模块[${name}]被替换掉了`);
        }else {
            for(let i =0,j=this.aliases.length;i<j;i++){
                let n = this.aliases.shift();
                if(n!==name) this.aliases.push(n);
            }
            this.aliases.push(name);
        }
        modules[name] = this;

    }
    
    static caches :{[name:string]:IRequireModule}=modules;

    static fetch(name:string,requireModule?:IRequireModule):IRequireModule{
        if(!name) throw new Error("无法获取模块,未指定模块名/url");
        let existed = define.modules[name];
        if(!existed) {
            let uri = new Uri(name,requireModule?.uri.paths);
            existed =  define.modules[uri.url];
            //Module构造函数会往modules里面写数据
            if(!existed)existed = new Module({url:uri});
        }
        return existed;
    }
}
makeState(Module.prototype,["definin","defined","error"],"error")

/**
 * define函数的执行器
 * 真正的define的操作是由该类完成
 *
 * @class DefineExecution
 */
class DefineExecution{
    module:IRequireModule
    resolve:(value:any,module_exports:any)=>any
    waitingCount:number
    factoryArguments:any[]
    exports:{}
    
    constructor(public name:string,public depnames:string[],public factory:Function){
        DefineExecution.current = this
        this.exports = {} 
        this.factoryArguments = []
        this.waitingCount =this.depnames.length+1 //execute会调用一次tryResolve.
        let require = this.require
        this.require = (name:string)=>require.call(this,name)
    }

    execute(){
        // 由于执行顺序问题，define函数中的setTimeout(,0)可能在onload之前被执行
        // 这种情况发生时，module还没有，等同该defination还未准备好，再等待一轮
        if(!this.module){
            setTimeout(()=>this.execute(),1)
            return false
        }
        if(define.trace===true||define.trace==="collect")console.info(`[模块][collect]${this.module.url}正在收集依赖`);
        if(this.module.error()) {
            console.warn(`模块[${this.module.url}]处于错误状态，不会执行define`,this.module);
            return this;
        }
        for(const index in this.depnames)((depname:string,idx:string)=>{
            if(depname==="exports") {
                this.factoryArguments[idx] = this.exports;
                this.waitingCount--;
                return;
            }
            else if(depname==="require"){
                this.factoryArguments[idx] = this.require;
                this.waitingCount--;
                return;
            } else{
                let depModule = Module.fetch(depname,this.module);
                this.module.deps[depModule.name] = depModule;
                depModule.defined((value:any)=>{
                    this.factoryArguments[idx] = value;
                    if(define.trace==true || define.trace==="depend")console.info(`[模块][depend ]:${this.module.url}`,this.waitingCount,`[defined]:${depModule.url}`);
                    this.tryResolve();
                });
            }
        })(this.depnames[index],index);
        if(define.trace===true || define.trace==="definin")console.info(`[模块][definin]${this.module.url}`,"[等待依赖项]",this.waitingCount-1);
        this.module.definin(this.module);

        let stack = [this.module.url];
        
        checkCycle(this.module.deps,this.module,stack,(rs)=>{
            if(rs===false) {
                console.error("依赖项循环引用",stack);
                this.module.error("依赖项重复引用");
                return;
            }
            this.tryResolve();
        });
        return true
    }
    require(name:string):any {
        //获取到指定的module
        let mod = Module.fetch(name,this.module);
        let definedValue = mod.defined();
        if(definedValue===undefined){
            //丢出Define的异常
            throw new DependenceNotDefinedException(`module[${name} is not ready.`,this.module,mod);
        }
        return definedValue;
    };
    tryResolve() {
        if(--this.waitingCount===0){
            let success = false;
            let result;
            let global_exports = (window as any).exports;
            if(define.trace)console.info(`[模块][definin]${this.module.url}开始执行define.factory`);
            try{
                (window as any).exports = this.exports;
                result=this.factory.apply(this,this.factoryArguments);
                success=true;
            }catch(ex){
                //如果丢出了DependenceNotDefinedException一场
                //表示在factory里面调用了require(name)，而且该模块还未准备好
                if(ex.isDependenceNotDefinedException){
                    if(define.trace)console.info(`[模块][breakin]${this.module.url}`,`[依赖项][未定义]${ex.depModule.url}`);
                    this.waitingCount++;
                    ex.depModule.defined((mod)=>this.tryResolve());
                    return;
                }else throw ex;
            }finally{
                (window as any).exports = global_exports;
            }
            if(success){ 
                  
                if(define.trace)console.info(`[模块][defined]${this.module.url}`);  
                this.module.defined(result||this.exports);                            
            }
        }
    }
    static current:DefineExecution
    static todos:DefineExecution[]
}

function checkCycle(modules:{[name:string]:IRequireModule},target:IRequireModule,stack,callback){
    let count = 1;
    let hasError = false;
    for(let n in modules){
        let module= modules[n];
        stack.push(module.url);
        if(module===target){hasError=true; return callback.call(this,false);}
        count++;
        module.definin(function(mod){
            checkCycle(this.deps,target,stack,function(rs){
                if(rs===true){
                    if(!hasError && --count==0) callback(true);
                }else{hasError=true; callback(false);}
            });
        });   
    }
    if(--count==0 && !hasError) callback(true);
}


let define:IRequireDefine = function (name:string|any[]|Function,deps?:any,factory?:any):any{
    //整理参数
    //define(name,deps,statement)
    if(factory===undefined){
        // define(deps,statement) or define(name,value)
        if(typeof name==="string"){
            //define(name);
            if(deps===undefined){
                return Module.fetch(name,null);
            }
            //define(name,value);
            let value:any = deps;
            if(value===undefined) throw new Error("不可以定义undefined到module中");
            let existed = define.modules[name];
            if(existed){
                let def_value =existed.defined();
                if(def_value===value) return;
                console.warn(`Module[${name}] is replaced.`,value,existed);
            }
            return new Module({name:name as string,value:value});
        }else {
            factory = deps;
            deps = name;
            name = undefined;
        }
        
        if(factory===undefined){
            //define(statement);
            factory = deps;
            deps = undefined;
        }
    }
    
    if(typeof factory !=="function") throw new Error("不正确的参数,define的最后一个参数应该是函数");
    
    let context = DefineExecution.current = define.context = new DefineExecution(name as string,deps as any[],factory);   
    //延迟执行，要等load函数把module注入进去
    setTimeout(()=>context.execute(),1);         
} as IRequireDefine;

define.modules = modules;
define.amd = true;
define.trace=false;
define.require = Module.fetch;
define.Resource = Resource

let urlResolveRules:{[name:string]:{regex:RegExp,replacement:string}}={};

const resolve:IRequireResolve = define.resolve =(url:string)=>{
    for(let  n in urlResolveRules ){
        let rule = urlResolveRules[n];
        let newUrl = url.replace(rule.regex,rule.replacement);
        if(newUrl!==url) return url;
    }
    return url;
}
resolve.item = function(name:string,reg?:string|RegExp,replacement?:string):IRequireResolve| {regex:RegExp,replacement:string}{
    if(reg===undefined) return urlResolveRules[name];
    if(reg==null) {delete urlResolveRules[name];return;}
    if(typeof reg ==="string") reg = new RegExp(reg);
    urlResolveRules[name] = {regex:reg,replacement:replacement}; 
    return resolve;
}
resolve.rules = urlResolveRules;


(window as any).define = define;


////////////////////////////////////////////////////////////////////////////////////
// 启动与全局配置

function boot(){
    let scripts = document.scripts;
    for(let j=scripts.length-1;j>=0;j--){
        let script = scripts[j];
        let init_module = script.getAttribute("require-startup") || script.getAttribute("startup") ||script.getAttribute("require-init");
        if(init_module){
            let trace = script.getAttribute("require-trace");
            if(trace==="" || trace==="true" || trace==="trace" || trace==="require-trace") define.trace= true;
            else define.trace = trace;
            if(define.trace)console.info("[启动][startup]:" + init_module);
            Module.fetch(init_module).defined(()=>{
                if(define.trace)console.info("[启动][complet]:" + init_module);
            });
            break;
        }
    }
    if(window.removeEventListener)
        window.removeEventListener("load",boot,false);
    else if((window as any).detechEvent)
        (window as any).detechEvent("onload",boot);
    else window.onload = null;
}
if(window.addEventListener)
    window.addEventListener("load",boot,false);
else if((window as any).attachEvent)
(window as any).attachEvent("onload",boot);
else window.onload = boot;


   
})(typeof window!=='undefined'?window:undefined);

(function(window){
    

let createXHR = function() {
    var XHR = [  //兼容不同浏览器和版本得创建函数数组
        function () { return new XMLHttpRequest () },
        function () { return new ActiveXObject ("Msxml2.XMLHTTP") },
        function () { return new ActiveXObject ("Msxml3.XMLHTTP") },
        function () { return new ActiveXObject ("Microsoft.XMLHTTP") }
    ]
    var xhr = null
    //尝试调用函数，如果成功则返回XMLHttpRequest对象，否则继续尝试
    for (var i = 0; i < XHR.length; i ++) {
        try {
            xhr = XHR[i]()
            createXHR = XHR[i]
        } catch(e) {
            continue  //如果发生异常，则继续下一个函数调用
        }
        break  //如果成功，则中止循环
    }
    return xhr  //返回对象实例
}

function request(opts){
    return thenable((resolve,reject)=>{
        let xhr:XMLHttpRequest = createXHR();
        let params :any= opts
        params.method = (opts.method || "GET").toUpperCase()
        params.async = opts.async !==false
        params.headers = opts.headers || {}
        
        if(this.requesting) this.requesting(params)

        xhr.onreadystatechange=function(){
            if(xhr.readyState==4){
                if(xhr.status==200){
                }else {
                    handleResponse(xhr,opts,resolve,reject)
                }
            }
        }
        xhr.onerror = function(e){
            handlerError(xhr,e,opts,reject)
        }
        let url = params.url
        let data = params.data
        if(params.method==='GET'){
            if(data) {
                let qry = makeRequestData('',params.data)
                if(url.indexOf("?")) url+='&';else url += '?'
                url += qry
            }
            data = null
        }else {
            data = makeRequestData(params.type,data)
        }
        if(params.headers){
            for(let n in params.headers){
                xhr.setRequestHeader(n,params.headers[n])
            }
        }
       
        xhr.open(params.method,url,params.async);
        xhr.send(data);

    })
    
    
    
}
function makeRequestData(type,data):string{
    if(type==='json') return JSON.stringify(data)
    if(typeof data==='object'){
        let txts = []
        for(let n in data){
            let val = data[n]
            if(val===undefined || val ===null) val = ''
            if(txts.length) txts.push('&')
            txts.push(encodeURIComponent(n))
            txts.push('=')
            txts.push(encodeURIComponent(val))
        }
        return txts.join('')
    }
    return data.toString()
}
let blockCommetInJsonRegx = /\/\/[^\n]*\n/g
function handlerError(xhr,ex,opts,reject){
    let err = {
        xhr : xhr,
        opts: opts,
        message: ex.message,
        detail: ex
    }
    if(opts.error) opts.error.call(xhr,err)
    if(opts.done) opts.done.call(xhr,undefined,err)
    reject(err)
}
function handleResponse(xhr,opts,resolve,reject){
    let retData
    try{
        let responseHandler = responseHandlers[opts.dataType]
        if(!responseHandler) responseHandler = responseHandlers['']
        retData = responseHandler(xhr,opts)
    }catch(ex){
        handlerError(xhr,ex,opts,reject)
        return
    }
    resolve(retData)
}
let responseHandlers = {
    "":(xhr,opts)=>xhr.responseText,
    "json":(xhr:XMLHttpRequest,opts)=>{
        let text = xhr.responseText
        text = text.replace(blockCommetInJsonRegx,"")
        return JSON.parse(text)
    }
}
let AJAX :any= {
    request:null,
    make:(name,factory?)=>{
        if(factory===undefined) {
            factory = name
            name = undefined
        }
        let req = function(opts){
            return request.call(factory,opts)
        }
        if(name) AJAX[name] = req
        return req
    }
}
AJAX.make('request',AJAX);
(window as any).AJAX = AJAX;
(window as any).ajax = AJAX.request;

})(typeof window!=='undefined'?window:undefined)

