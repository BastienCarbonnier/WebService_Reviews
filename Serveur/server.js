"use strict"
var express = require("express");
var app = express();
var md5 = require('js-md5');
var bodyParser = require('body-parser');
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017";
var cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.json());

MongoClient.connect(url, {useNewUrlParser: true}, (err, client) => {
	let db = client.db("Hotel_Advisor");

/*------------------------ Service USER ------------------------*/
	app.get("/user", (req, res) => {
	    db.collection("user").find().toArray((err, documents)=> {
			res.setHeader("Content-type", "application/json");
		    res.end(JSON.stringify(documents));
		});
   	});

	//curl --header "Content-type: application/json" -X POST --data '{"mail":"gerant@gerant.com", "mdp":"un_mdp"}' localhost:8888/login
    app.post("/login",(req,res)=>{ 
    	req.body.mdp=md5(req.body.mdp);
		try {
			db.collection("user").find(req.body).toArray((err,documents)=>{
	    		res.setHeader("Content-type", "application/json");
			   	res.end(JSON.stringify(documents));
	    	})
		} catch(e) {
			console.log(e);
		}
    });

   	// curl --header "Content-type: application/json" -X POST --data '{"mail":"claire.delune@gmail.com", "nom":"Delune", "prenom":"Claire", "mdp":"lol", "type":"emetteur"}' localhost:8888/addUsers
	// ATTENTION tous les champs doivent être obligatoire
    app.post("/addUsers", (req, res) => {
    	res.setHeader("Content-type", "application/json");	
    	try {
	    	db.collection('user').find({"mail":req.body['mail']}).toArray((err,documents)=>{
	    	   	if(documents.length!=0){
		    		res.end(JSON.stringify('Membre existe déjà !'));
		    	}
		    	else{
		    		req.body.mdp=md5(req.body.mdp);
			        db.collection("user").insertOne(req.body);
				    res.end(JSON.stringify("Inscription réussie"));	    
		    	}
	    	});
    	} catch(e) {
    		console.log(e);
    	}	
    });

    //test : curl --header "Content-type: application/json" -X DELETE localhost:8888/deleteUser/mail=gerant@gerant.com
    app.delete("/deleteUser/mail=:mail", (req,res) =>{
    	let mail = req.params.mail;

    	db.collection('user').find({"mail":mail}).toArray((err, documents)=>{
    		if(documents!== undefined && documents[0]!==undefined){
    			db.collection('hotel').find({"mail":mail}).toArray((err, documentsHotel)=>{
    				documentsHotel.forEach(function(element) {
    					db.collection("commentaire").deleteMany({"id_hotel":element.id_hotel});
						db.collection("hotel").deleteOne({"id_hotel":element.id_hotel});
					});
					db.collection("user").deleteOne({"mail":mail});
	    			res.setHeader("Content-type","application/json");
			    	res.end(JSON.stringify("\nSuppression réussie !\n"));   
    			});
 			
    		}else{
    			res.setHeader("Content-type","application/json");
		    	res.end(JSON.stringify("\nSuppression non réussie !\n"));
    		}
    	});
    });


/*------------------------ Service HOTEL ------------------------*/
    app.get("/allHotel", (req, res) => {
	    db.collection("hotel").find().toArray((err, documents)=> {
			res.setHeader("Content-type", "application/json");
		    res.end(JSON.stringify(documents));
		});
   	});


    //post pour que l'utilisateur ne puisse modifier le mail si il est passé dans l'url
	// curl --header "Content-type: application/json" -X POST --data '{"mail":"gerant@gerant.com"}' localhost:8888/hotel
   	// On passe le mail du gérant ! 
    app.post("/hotel", (req, res) => {
    	db.collection("hotel").aggregate([
					{
						$match:req.body					
					},
					{
			            $lookup:
			            {
			                from: "user",
			                localField: "mail",
			                foreignField: "mail",
			                as: "proprio"
			            }
	        		}
	        		]).toArray((err,documents)=>{ 
					    res.setHeader("Content-type", "application/json");
					    res.end(JSON.stringify(documents));
					});	
    });

    // curl --header "Content-type: application/json" -X POST --data '{"mail":"gerant@gerant.com", "capacite":4025, "type":"Moyen de gamme","lieux":"Nîmes","nom":"Nemausus"}' localhost:8888/addHotel
	// mail capacite type lieux nom 
	// ATTENTION tous les champs doivent être obligatoire
    app.post("/addHotel", (req, res) => { 
    	res.setHeader("Content-type", "text/raw");	
    	try {
    			db.collection('hotel').find().toArray((err,documents)=>{
    				let idNewHotel=0;
    				for(let i =0; i<documents.length;i++){ //pour a voir un id unique
    					if(idNewHotel<documents[i].id_hotel)
    						idNewHotel = documents[i].id_hotel;
    				}
    				idNewHotel++;
    				req.body["id_hotel"]=idNewHotel;

    				db.collection('hotel').insertOne(req.body);
					res.end(JSON.stringify("\nInsertion réussie\n"));
		  
	    		});
    	} catch(e) {
    		console.log(e);
    	}	
    });

    //test : curl --header "Content-type: application/json" -X DELETE localhost:8888/deleteHotel/hotelId=1/mail=gerant@gerant.com
    app.delete("/deleteHotel/hotelId=:hotelId/mail=:mail", (req,res) =>{
    	let mail = req.params.mail;
    	let hotelId =  parseInt(req.params.hotelId);

    	db.collection('hotel').find({"mail":mail,"id_hotel":hotelId}).toArray((err, documents)=>{
    		if(documents!== undefined && documents[0]!==undefined){
    			db.collection("commentaire").deleteMany({"id_hotel":hotelId});
    			db.collection("hotel").deleteOne({"mail":mail,"id_hotel":hotelId});
    			res.setHeader("Content-type","application/json");
		    	res.end(JSON.stringify("\nSuppression réussie !\n"));    			
    		}else{
    			res.setHeader("Content-type","application/json");
		    	res.end(JSON.stringify("\nSuppression non réussie !\n"));
    		}
    	});
    });

/*------------------------ Service COMMENTAIRE ------------------------*/

    app.get("/allCom", (req, res) => {
	    db.collection("commentaire").find().toArray((err, documents)=> {
			res.setHeader("Content-type", "application/json");
		    res.end(JSON.stringify(documents));
		});
   	});

});
console.log("Everything is ok !");
app.listen(8888);