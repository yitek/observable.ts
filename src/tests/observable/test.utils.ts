import {Unittest} from '../../unittest'
import * as utils from '../../observable'

Unittest.group('is_array',(ast:Unittest)=>{
	ast.message('判断是否是数组')
	let rs = utils.is_array(undefined) 
	ast.false(rs)
	rs = utils.is_array('') 
	ast.false(rs)
	rs = utils.is_array([]) 
	ast.true(rs)

})

Unittest.group('array_contains',(ast:Unittest)=>{
	ast.message('数组是否包含某元素')
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
