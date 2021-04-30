interface IUnittest{
	group(name:string,testFn:(test:IUnittest)=>any):IUnittest
	message(content:string):IUnittest
	eq(exepected:any,actual:any,message?:string):IUnittest
}
const tokenRegx = /(?:\\\{)|(\{([^\{}]+)\})/gi
export class Unittest implements IUnittest{
	static replace(content:string,data:any):string{
		if(content===null || content ===undefined) return ""
		if(data) return content.toString().replace(tokenRegx,(t,t0,tname)=>data[tname])
		return content.toString()
	}
	group(name:string,testFn:(test:IUnittest)=>any):IUnittest{
		console.group(name)
		testFn(this);
		console.groupEnd()
		return this;
	}
	message(content:string,data?:any):IUnittest{
		console.log(Unittest.replace(content,data))
		return this;
	}
	eq(exepected:any,actual:any,message?:string):IUnittest{
		if(exepected!==actual) console.error(Unittest.replace(message ||(message = "期望值{expected},实际值为{actual}"),{exepected,actual}))
		else if(message) console.log(Unittest.replace(message,{exepected,actual}))
		return this
	}
	true(value:any,message?:string):IUnittest{
		if(value!==true) console.error(message ||(message = "期望为true"))
		else if(message) console.log(message)
		return this
	}
	false(value:any,message?:string):IUnittest{
		if(value!==false) console.error(message ||(message = "期望为false"))
		else if(message) console.log(message)
		return this
	}
	static instance:IUnittest = new Unittest()
	static group(name:string,fn:(ut)=>any){
		return Unittest.instance.group(name,fn)
	}
}
