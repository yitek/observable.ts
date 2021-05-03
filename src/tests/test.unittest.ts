
import{Unittest,Assert} from '../unittest'

Unittest.namespace("abc").test("string",(ast:Assert)=>{
	ast.message('数组是否包含某元素')
	let obj = "abc"
	ast.equal("abc",obj,"等于")
	let rs = obj.indexOf('b')==1
	ast.true(rs)
})
Unittest.render()