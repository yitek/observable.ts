import {Schema} from '../observable'

let schema = new Schema();
schema.$define({
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
})
console.log(schema)