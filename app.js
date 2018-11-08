const express=require("express");
const app=express();
const router=express.Router();
const bodyParser=require("body-parser");
const port="3000";
const battleRoutes=require("./routes/battleRoutes");

//app.use(router);
app.use("/battles",battleRoutes);
app.use(bodyParser.urlencoded({
  extended: true
}));
app.listen(port,function(){
	console.log("Server Started");
});
