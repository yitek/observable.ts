import {virtualNode,variable,Template} from '../mvc'

function view(states:any){
	let item:any =variable('item')
	return <div>
		<select bind={states.gender}><option for={{each:states.genders, as:item }} value={item.value}>{item.text}</option></select>
	</div>
}
debugger
let tmpl = new Template(view)
let data = {gender:'male',genders:[{value:1,text:'male'},{value:2,text:'female'}]}
let mount = tmpl.render(data)
mount(document.body)

