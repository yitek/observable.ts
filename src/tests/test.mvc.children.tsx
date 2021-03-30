import {virtualNode,template,Template} from '../mvc'

function view(states:any){
	function output(states){
		states.output = undefined
		states.output = JSON.stringify(states)
	}
	return <fieldset>
		<legend>{states.title}</legend>
		<div>
			<div><label>name:</label><input type="text" bind={states.data.name} /></div>
			<div><label>gender:</label><select bind={states.data.gender}><option value="male">male</option><option value="female">female</option></select></div>
			<div><input type="button" value="输出" onclick={output}/></div>
			<textarea cols="80" rows="40">{states.output}</textarea>
		</div>
	</fieldset>
}
debugger
let tmpl = new Template(view)
let data = {title:"DETAILS",data:{name:'yiy'}}
let elem = tmpl.render(data)
document.body.appendChild(elem)

