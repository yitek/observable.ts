import {Schema} from '../observable'
let schema:any = new Schema();
console.group('define')
let tmpl = {
	pageIndex:1,
	pageSize:1,
	filters:{
		keyword:'',
		createTime_min:new Date(),
		createTime_max:new Date()
	},
	items:[
		{
			id:1,name:''
		}
	]
}
schema.$define(tmpl)
console.log('shema.define',schema,tmpl)
console.groupEnd();

console.group('builder')
schema= new Schema(undefined,null)
let modelBuilder = schema.$createBuilder()
let filters = modelBuilder.filters
let keyword = filters.keyword
let pageIndex = modelBuilder.pageIndex
let itemName = modelBuilder.items[0].name
let name;
for(let n in filters) name = n
console.log("schema:",schema)
console.log("keyword:",keyword['$__observable.target__'])
console.log("itemName",itemName['$__observable.target__'])
console.log("pageIndex",pageIndex['$__observable.target__'])
console.log("name",name)
console.groupEnd()