const express=require("express");
const mongoose=require("mongoose");
const lodash=require("lodash");
const router=express.Router();
const battleSchema=require("./../model/battleModel");
const dbUrl="mongodb://@ds151137.mlab.com:51137/battleapi";
mongoose.connect(dbUrl,{
	auth: {
	   user:'battleapi',
	   password:'battle@123'
	},
	useNewUrlParser: true
}).then(()=>{
	console.log("Mongo connected")
},err=>{
	console.log(err);
});
let battlesData;

battleSchema.find({}).exec().then(battles=>{
	battlesData=battles;
}).catch(err=>{
	console.log(`Error ${err}`);
})

router.get("/all",(req,res,next)=>{
	res.setHeader("Content-Type","application/json")
	res.json(battlesData)
})

router.get("/list",(req,res,next)=>{
	res.setHeader("Content-Type","application/json")
	const places=battlesData.map((bObj)=>bObj.location)
	res.json({all_places:places});
})

router.get("/count",(req,res)=>{
	res.setHeader("Content-Type","application/json")
	res.json({battle_count:battlesData.length});
})

router.get("/stats",(req,res)=>{
	stats={}
	stats.most_active={}
	stats.attacker_outcome={}
	stats.defender_size={}
	stats.battle_type=[]
	let attacker_count = battlesData.reduce((newObj, obj) => {
	  if(newObj[obj.attacker_king]) {
	    newObj[obj.attacker_king] = newObj[obj.attacker_king]+1;
	  } else {
	    newObj[obj.attacker_king] = 1;
	  }
	  return newObj;
	}, {});
	let defender_count = battlesData.reduce((newObj, obj) => {
	  if(newObj[obj.defender_king]) {
	    newObj[obj.defender_king] = newObj[obj.defender_king]+1;
	  } else {
	    newObj[obj.defender_king] = 1;
	  }
	  return newObj;
	}, {});
	let region_count = battlesData.reduce((newObj, obj) => {
	  if(newObj[obj.region]) {
	    newObj[obj.region] = newObj[obj.region]+1;
	  } else {
	    newObj[obj.region] = 1;
	  }
	  return newObj;
	}, {});
	let attacker_max=lodash.maxBy(battlesData,lodash.property("attacker_size"))
	let outcome_count=lodash.countBy(battlesData,lodash.property("attacker_outcome"))
	let unique_battle=lodash.uniqBy(battlesData,lodash.property("battle_type")).map(battle=> battle.battle_type)
	let defender_max=lodash.maxBy(battlesData,lodash.property("defender_size"))
	let defender_min=lodash.minBy(battlesData,lodash.property("defender_size"))
	let defender_mean=lodash.meanBy(battlesData,(p)=> p.defender_size)
	stats.most_active.attacker_king=Object.keys(attacker_count)[0];
	stats.most_active.defender_king=Object.keys(defender_count)[0];
	stats.most_active.region=Object.keys(region_count)[0];
	stats.most_active.name=attacker_max.name;
	stats.attacker_outcome.win=outcome_count.win
	stats.attacker_outcome.loss=outcome_count.loss
	stats.battle_type=unique_battle;
	stats.defender_size.average=defender_mean;
	stats.defender_size.max=defender_max.defender_size;
	stats.defender_size.min=defender_min.defender_size;
	res.setHeader("Content-Type","application/json")
	res.json({stats:stats})
})

router.get("/search",(req,res)=>{
	let criteria={}
	let king_criteria={}
	let filteredData={}
	for(let k in req.query){
		req.query[k]!==""? criteria[k] = req.query[k] : null
	}

	cquery=battleSchema.find()
	if(criteria.hasOwnProperty("king")){
		criteria.attacker_king=criteria.king
		criteria.defender_king=criteria.king
		delete criteria.king
		cquery.or([
			{"attacker_king":criteria.attacker_king},
			{"defender_king":criteria.defender_king}
			])
		delete criteria.attacker_king
		delete criteria.defender_king
	}
	
	for(let k in criteria){
		cquery.where(k).equals(criteria[k])
	}

	cquery.exec().then(data=>{
	//	console.log("----------------------------"+data.length)
		res.setHeader("Content-Type","application/json")
		res.json(data)
	}).catch(err=>{
		console.log(err)
	})
})

module.exports= router;