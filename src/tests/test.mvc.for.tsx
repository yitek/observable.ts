import {virtualNode,variable,Template} from '../mvc'

function view(states:any){
	let i = 0
	function append(states,elem){
		states.genders.push({text:'secret' + i,value:'secret' + i})
		i++
	}
	function remove(states,elem){
		states.genders.shift()
	}
	function inspect(states,elem){
		states.json = undefined;
		states.json = JSON.stringify(states,null,'\t')
	}
	let item:any =variable('item')
	return <div><select bind={states.gender}><option for={{each:states.genders, as:item }} value={item.value}>{item.text}</option></select><button onclick={append}>追加</button><button onclick={remove}>删除</button><button onclick={inspect}>inspect</button><br /><pre>{states.json}</pre></div>
}
debugger
let tmpl = new Template(view)
let data = {gender:'male',genders:[{value:1,text:'male'},{value:2,text:'female'}]}
let mount = tmpl.render(data)
mount(document.body)

