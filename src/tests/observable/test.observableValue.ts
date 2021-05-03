import {Observable,IObservableEvent} from '../../observable'
import {Unittest,Assert} from '../../unittest'

Unittest.namespace("observable/valueObservable").test('basic','基本操作',(ast:Assert)=>{
	let ob = new Observable(22)
	let evts:IObservableEvent[]=[];
	ob.$subscribe((e:IObservableEvent)=>evts.push(e))
	let value = ob.$get()
	ast.equal(22,value,'value===22')
	ob.$set('33')
	value = ob.$get()
	ast.true('33'===value && evts.length===0,'value===33,evts==[]')
	ob.$trigger()
	debugger
	ast.compare({value:'33',old:22,sender:ob},evts[0],'evts[0] == { value: \'33\', old: 22, sender: ob }')
	
})