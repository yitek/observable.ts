import {virtualNode,template,Template} from '../mvc'

function view(model:any){
	function output(states){
		states.output = undefined
		states.output = JSON.stringify(states)
	}
	return <div>
		<select bind={model.visable}><option value="">hide</option><option value="female">show</option></select>
		<span if={model.visable}>Hello~</span>
	</div>
}
debugger
let tmpl = new Template(view)
let data = {title:"DETAILS",data:{name:'yiy'}}
let elem = tmpl.render(data)
document.body.appendChild(elem)

