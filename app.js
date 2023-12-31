const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require('bcryptjs');
const SendOtp = require('sendotp');
const Worker= require('./schema/signup');
const User= require('./schema/userlist');
const adminlist = require('./schema/adminlistSchema');
const cookieparser= require('cookie-parser');
const dashboardroute = require('./dashboardroute');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.json());
app.use(cookieparser());
app.use("/dashboard",dashboardroute);




//////////////////////////////////////////////////////////////////////////////////////////// DATABASE AND SERVER CONNECTION
////////////////////////////////////////////////////////////////////////////////////////////

mongoose.connect("mongodb+srv://poshan_test:poshan123@cluster0-cbwkg.mongodb.net/poshan",
				 { useUnifiedTopology: true,
				   useNewUrlParser: true ,
				   useFindAndModify: false,
				   useCreateIndex: true})
			    .then(() => {
					   console.log("Database Connected")
				})
				.catch((err) => {
						console.log(err);
				});


const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
	console.log("Server started on port ", PORT);
});


/////////////////////////////////////////////////////////////////////////////////// FUNCTIONS USED
///////////////////////////////////////////////////////////////////////////////////


const signToken = function(id) {                                                                              //GENERATE JWT
	return jwt.sign({ id }, "manpreet-bag-pack-karo-teen-ghante-baad-flight-hai", {
	  expiresIn: "90d"
	});
};
  
const createSendToken = function(workerid, res) {                                               //SEND JWT
	const token = signToken(workerid);
	const cookieOptions = {
	  expires: new Date(
		Date.now() + 90 * 24 * 60 * 60 * 1000
	  ),
	  httpOnly: true
	};
	res.cookie('jwt', token, cookieOptions);
};

const sendOtp = new SendOtp('311289AimzH3IlFub5e0ede7cP1');                                            
const randomInteger = function (min, max) {																		//FUNCTION TO CREATE OTP
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

  



////////////////////////////////////////////////////////////////////////////////////////////  VARIOUS ROUTES USED
////////////////////////////////////////////////////////////////////////////////////////////



app.get("/login",function(req,res){
     let token;
     if(!req.cookies.jwt)
	{
		res.render("login-form");  
	    
	}
	else
	{
		token = req.cookies.jwt;
		try {
			const decoded = jwt.verify(token,'manpreet-bag-pack-karo-teen-ghante-baad-flight-hai');
			res.redirect("/dashboard");
		}
		catch(ex) {
			console.log(ex);
			res.render("login-form"); 
		}
	}
	
})

app.get("/portal",function(req,res){
	res.render("home");
});



//for generating otp and here adminlist database used which stores otp
app.post("/generateOTP",function(req,res){
	const num=parseInt(req.body.number);
	const number=parseInt("91"+req.body.number);
	Worker.find({phoneno:num},function(err,result){
		if(err)
			throw err;
		else
		{
			if(result.length!=0)
			{
				const otp=randomInteger(100000,999999);
				adminlist.findOneAndUpdate({phoneno:num},{$set:{otp:otp}},function(err1,found){
						if(err1)
							throw err1;
						else {
							sendOtp.send(number,"KKMAAD",otp, function (error, data) {
								if(error) 
									throw error;
								else
									res.send("Registered");
							});
						}
				});
			}
			else
			{
				res.send("Not Registered");
			}
		}
	});
});



//otp verification
app.post("/verifyOTP",function (req,res){
	adminlist.findOne({phoneno:req.body.num, otp:req.body.temp},function(err,result){
		if(err)
			throw err;
		else
		{
			if(result) {
				adminlist.findOneAndUpdate({phoneno:req.body.num},{$set:{otp:undefined}},function(err1,found){
					if(err1)
						throw err1;
					else
						console.log("Updated");
				});
				createSendToken(result.adharno, res);
				res.redirect("/dashboard");
			}
			else 
				res.redirect("/wrongOTP");
		}
	});
	
});


//to check phone no for login using password
app.post("/checkPhoneLogin",function(req,res){
	const num=parseInt(req.body.number);
	Worker.find({phoneno:num},function(err,result){
		if(err)
			throw err;
		else
		{
			if(result.length!=0)
			{
	  			res.send("Registered");
	  			
			}
			else
			{
				res.send("Not Registered");
			}
		}
	});
});


//check password for login
app.post("/loginUsingPassword",function(req,res){
	const num=req.body.num;
	const pas=req.body.temp;
	Worker.find({phoneno:num},function(err,result){
		if(err)
			throw err;
		else
		{
			if(result.length!=0)
			{
	  			bcrypt.compare(pas,result[0].password,function(err1,result1){
					if(result1)
					{
						createSendToken(result[0].adharno, res);
						res.redirect("/dashboard");
							
					}
	  				else
	  					res.redirect("/wrongpass");
	  			});
	  		}	
			else
				res.redirect("/wrongpass");
		}
	});
});


//generate OTP for Sign up
app.post("/generateSignupOTP",function(req,res){
	const num=req.body.number;
	const adhaar=req.body.adhaar;
	const number=parseInt("91"+req.body.number);
	adminlist.find({phoneno:num, adharno:adhaar},function(err,result){
		if(err)
			throw err;
		else
		{
			if(result.length!=0)
			{ 
				Worker.find({adharno:adhaar},function(err1,result1){
					if(err1) throw err1;
					else if(result1.length==0)
					{
						const otp=randomInteger(100000,999999);
						adminlist.findOneAndUpdate({phoneno:num},{$set:{otp:otp}},function(err2,found){
								if(err2)
									throw err2;
								else {
									sendOtp.send(number,"KKMAAD",otp, function(error, data) {
										if(error) 
											throw error;
										else
											res.send("Registered");
									});
								}
						});
	  				}
	  				else
	  					res.send("Already Registered");
	  			});
			}
			else
			{
				res.send("Not Registered");
			}
		}
	});
});


//verifying signup otp
app.post("/verifySignupOTP",function (req,res){
	adminlist.findOne({adharno:req.body.adhaar, otp: req.body.num},function(err,result){
		if(err)
			throw err;
		else
		{
			if(result) {
				adminlist.findOneAndUpdate({adharno:req.body.adhaar},{$set:{otp:undefined}},function(err1,found){
					if(err1)
						throw err1;
					else
						console.log("Updated");

				});
				res.render("signup-form",{adhaar:req.body.adhaar});//some changes
			}
			else
				res.redirect("/wrongOTP");
		}
	});
	
});


app.get("/logout",function(req,res){
	res.cookie('jwt', 'loggedout', {
		expires: new Date(),
		httpOnly: true
	  });
	  res.redirect("/");
});

app.get("/createAccount",function(req,res){
	res.render("create-account");
});

app.post("/signupSubmit",function(req,res){
	var obj=req.body;
	const p=bcrypt.hashSync(obj.password,12);
	adminlist.findOne({adharno:obj.adhaar},async function(err,result){
		if(err)
			throw err;
		else
			if(result)
			{
				const newWorker=new Worker({
					adharno:obj.adhaar,
					name:obj.name,
					fathersname:obj.fname,
					phoneno:result.phoneno,
					gender:obj.gender,
					dob:obj.dob,
					password:p,
					checknum:0,
					vacnum:0,
					usernum:0
				});
				try {
					await newWorker.save();
					res.redirect("/login");
				}
				catch(ex) {
					console.log(ex);
					res.redirect("/createAccount");
				}
			}
			else
				res.redirect("/createAccount");
		});
});

app.get("/wrongOTP",function(req,res){
	res.render("wrong-otp",{thing: "OTP"});
});


app.get("/wrongpass",function(req,res){
	res.render("wrong-otp",{thing: "Password"});
});



app.get("/newworker",async function(req,res){
	const newadminlist =new adminlist(
		{
		adharno:"328479437459",
		phoneno:"7250720774",
		area:"Begusarai",
		acode:"38"
		}
	)
	await newadminlist.save();
});


app.get("/forgotpass",function(req,res){
	res.render("forgot-pass");
});


app.post("/verifyforgotOTP",function (req,res){
	adminlist.findOne({phoneno:req.body.num, otp:req.body.temp},function(err,result){
		if(err)
			throw err;
		else
		{
			if(result) {
				adminlist.findOneAndUpdate({phoneno:req.body.num},{$set:{otp:undefined}},function(err1,found){
					if(err1)
						throw err1;
					else
						console.log("Updated");

				});
				Worker.findOneAndUpdate({phoneno:req.body.num},{$set:{password:bcrypt.hashSync(req.body.password,12)}},function(err2,found){
					if(err2)
						throw err2;
					else {
						console.log("Updated");
						res.redirect("/login");
					}
				});
			}
			else
				res.redirect("/wrongOTP");
		}
	});
});

app.post("/newUser", async function(req,res){
	const obj=req.body;
		const newUser=new User({
			name:obj.name,
			adharno:obj.adharno,
			uuid:obj.uuid,
			gname:obj.gname,
			mname:obj.mname,
			phoneno:obj.phoneno,
			acode:obj.acode,
			dob:obj.dob,
			age:obj.age,
			address:obj.address,
			category:obj.category,
			caste:obj.caste,
			religion:obj.religion,
			mstatus:obj.mstatus,
			fstatus:obj.fstatus,
			phystatus:obj.phystatus,
			pstatus:obj.pstatus,
			lat:obj.lat,
			long:obj.long
		});
		await newUser.save();
		res.redirect("/dashboard")
});
app.post("/upsmsSend",function(req,res){
	const num=parseInt(req.body.number);
	const number=parseInt("91"+req.body.num);
	const otp=randomInteger(100000,999999);
	sendOtp.sendup(number,"KKMAAD",otp, function (error, data) {
	  			console.log(data);
	  			res.send("Registered");
	  });
});
app.post("/presmsSend",function(req,res){
	const num=parseInt(req.body.number);
	const number=parseInt("91"+req.body.num);
	const otp=randomInteger(100000,999999);
	sendOtp.sendpre(number,"KKMAAD",otp, function (error, data) {
	  			console.log(data);
	  			res.send("Registered");
	  });
});

app.get("/",function(req,res){
	res.render("index");
});

