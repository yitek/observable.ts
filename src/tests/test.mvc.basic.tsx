import {virtualNode,template,Template} from '../mvc'

function view(states:any){
	function onblur(states,elem){
		states.name = elem.value
		setTimeout(()=>console.log('state is changed',data),0)
	}
	return <input value={states.name} onblur={onblur} />
}
let tmpl = new Template(view)
let data = {name:'yiy'}
let appendTo = tmpl.render(data)
appendTo(document.body)

