import {Schema,ObservableTypes} from '../../observable'
import {Unittest,Assert} from '../../unittest'

Unittest.namespace("observable/schema").test('define','定义数据架构',(ast:Assert)=>{
		
	ast.message(`新建数据架构对象
数据架构对象描述了对象的字段与类型`)
	let schema:any = new Schema();

	ast.message(`定义模板数据
该数据结构为典型的search页面的模型结构
后面的$define将根据该数据结构构建数据架构数据`)
	let tplData = {
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
	}

	ast.message(`schema创建后默认为value类型，没有下级成员描述，用$define指定该schema的数据结构`)
	schema.$define(tplData)

	ast.message(`检测schema本身的属性变更与其上的字段描述`)
	let otype = schema.$type
	ast.true(otype===ObservableTypes.object,"schema的类型为对象otype==ObservableTypes.object")
	otype = schema.pageIndex.$type
	ast.true(otype===ObservableTypes.value,"schema上存在pageIndex成员的描述信息")
	otype = schema.filters.$type
	ast.true(otype===ObservableTypes.object,"schema上存在filters成员的描述信息,且类型为otype==object")
	otype = schema.items.$type
	ast.true(otype===ObservableTypes.array,"schema上存在items成员的描述信息,且类型为otype==array")
	// for schema只能出现tplData的成员名
	let propNames = []
	for(let n in schema) propNames.push(n)
	ast.compare(['pageIndex','pageSize','filters','items'],propNames,"propNames==['pageIndex','pageSize','filters','items']")

	ast.message('进一步检测filters成员描述上的成员描述')
	otype = schema.filters.keyword.$type
	ast.true(otype===ObservableTypes.value,"schema.filters上存在keyword成员的描述信息,且类型为otype==value")
	propNames = []
	for(let n in schema.filters) propNames.push(n)
	ast.compare(['keyword','createTime_min','createTime_max'],propNames,"propNames==['keyword','createTime_min','createTime_max']")

	ast.message('检测数组结构')
	otype = schema.items.$item.$type
	ast.true(otype===ObservableTypes.object,"schema.items上有数组元素描述($item)otype==object")
	otype = schema.items.$item.id.$type
	ast.true(otype===ObservableTypes.value,"可以从数组元素描述中获取到元素的id字段描述otype==value")
	propNames = []
	for(let n in schema.item) propNames.push(n)
	ast.true(propNames.length===0,"数组本身没有成员propNames=[]")
	propNames = []
	for(let n in schema.items.$item) propNames.push(n)
	ast.compare(['id','name'],propNames,"propNames==['id','name']")
	

}).test('build','通过访问构建数据结构',(ast:Assert)=>{
	let schema:any = new Schema();
	schema= new Schema(undefined,null)
	ast.message(`产生创建器`)
	let modelBuilder = schema.$createBuilder()

	ast.message(`访问filters，产生filters属性描述对象`)
	let filters = modelBuilder.filters
	ast.equal(Schema.fromBuilder(filters),schema.filters,'产生了schema.filters')

	ast.message(`在filters上面访问属性`)
	// 访问keyword属性
	let keywordBldr = filters.keyword
	let keyword = schema.filters.keyword
	ast.equal(keywordBldr[Schema.BUILDER_TARGET],keyword,'产生了schema.filters.keyword,keyword instanceof Schema===true')
	let otype = schema.filters.$type
	ast.equal(ObservableTypes.object,otype,'由于在filters上面做了属性访问，filters类型自动转换成object,otype===object')

	// 访问createTime_min属性
	let createTime_minBldr = modelBuilder.filters.createTime_min
	let createTime = schema.filters.createTime_min;
	
	ast.equal(Schema.fromBuilder(modelBuilder.filters.createTime_min),schema.filters.createTime_min,'产生了schema.filters.createTime_min,createTime_min==Schema.fromBuilder(createTime_minBldr)')
	
	ast.message('访问数组元素')
	let itemName = modelBuilder.items[0].name
	otype = schema.items.$type
	ast.equal(ObservableTypes.array,otype,'由于在items上面做了数组访问，items类型自动转换成array')
	ast.equal(schema.items.$item.name,Schema.fromBuilder(itemName),'items的元素描述中有name成员的描述,Schema.fromBuilder(itemName)===schema.items.$item.name')
})