import {Unittest,Assert} from '../../unittest'
import * as utils from '../../observable'

Unittest.namespace("observable").test('is_array','判断是否是数组',(ast:Assert)=>{
	ast.message('判断是否是数组')
	let rs = utils.is_array(undefined) 
	ast.false(rs)
	rs = utils.is_array('') 
	ast.false(rs)
	rs = utils.is_array([]) 
	ast.true(rs)

})
.test('array_contains','数组是否包含某元素',(ast:Assert)=>{
	
	let obj = {}
	let arr = [1,'2',1,obj]
	let rs = utils.array_contains(arr,1) 
	ast.true(rs)
	rs = utils.array_contains(arr,2) 
	ast.false(rs)
	rs = utils.array_contains(arr,obj) 
	ast.true(rs)
	rs = utils.array_contains(arr,{}) 
	ast.false(rs)

})

.test('array_remove','从数组中移除指定元素',(ast:Assert)=>{
	let obj = {}
	let arr = [1,'2',1,obj]
	let rs = utils.array_remove(arr,1) 
	ast.true(rs===2 && arr[0]==='2' && arr[1]===obj,'arr===[\'2\',obj],返回值rs==2')
	rs = utils.array_remove(arr,2)
	ast.true(rs===0&&  arr[0]==='2' && arr[1]===obj,'返回值rs==0,表示未移除任何东西')
})
