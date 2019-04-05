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

   	// curl --header "Content-type: application/json" -X POST --data '{"mail":"claire.delune@gmail.com", "nom":"Delune", "prenom":"Claire", "mdp":"lol", "type":"emetteur"}' localhost:8888/addUser
	// ATTENTION tous les champs doivent être obligatoire
    app.post("/addUser", (req, res) => {
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

   	// On passe le mail du gérant ! 
    app.get("/hotel/mail=:mail", (req, res) => {
    	db.collection("hotel").aggregate([
					{
						$match:{"mail":req.params.mail}				
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

    //Mettre le code %20 pour les espace
    //test : curl --header "Content-type: application/json" -X PUT localhost:8888/updateHotel/hotelID=1/mail=gerant@gerant.com/capacite=5102/type=Haut%20de%20gamme
    app.put("/updateHotel/hotelID=:hotelID/mail=:mail/capacite=:capacite/type=:type",(req,res)=>{
    	let hotelID = parseInt(req.params.hotelID);
    	let mail = req.params.mail;
    	let capacite = parseInt(req.params.capacite);
    	let type = req.params.type;
    	db.collection("user").find({"mail":mail}).toArray((err, documents)=>{
    		if(documents!== undefined && documents[0]!==undefined){
    			if(documents[0].type=="gerant"){
    				db.collection("hotel").updateOne({"id_hotel":hotelID},{$set :{"mail":mail,"capacite":capacite,"type":type}});
			    	res.setHeader("Content-type","application/json");
					res.end(JSON.stringify("Modification réussie !"));
    			}
    			else{
    				res.setHeader("Content-type","application/json");
		    		res.end(JSON.stringify("\nUtilisateur non gérant !\n"));
    			}
    		}else{
    			res.setHeader("Content-type","application/json");
		    	res.end(JSON.stringify("\nModification non réussie !\n"));
    		}

    	});
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

   	app.get("/comHotel/hotelId=:hotelId",(req, res)=>{
   		let idHotel = parseInt(req.params.hotelId);
   		db.collection('commentaire').find({"id_hotel":idHotel}).toArray((err, documents)=>{
   			res.setHeader("Content-type", "application/json");
			res.end(JSON.stringify(documents));
   		});
   	});

    app.get("/comHotelMoreInfo/hotelId=:hotelId",(req, res)=>{
        let idHotel = parseInt(req.params.hotelId);
        db.collection("commentaire").aggregate([
                        {
                            $match:{"id_hotel":idHotel}
                        },
                        {
                            $lookup:
                            {
                                from: "user",
                                localField: "mail",
                                foreignField: "mail",
                                as: "uti"
                            }
                        }]).toArray((err,documents)=>{ 
                            res.setHeader("Content-type", "application/json");
                            res.end(JSON.stringify(documents));

                        });
    });

   	app.get("/comUser/mail=:mail",(req, res)=>{
   		let mail = req.params.mail;
   		db.collection('commentaire').find({"mail":mail}).toArray((err, documents)=>{
   			res.setHeader("Content-type", "application/json");
			res.end(JSON.stringify(documents));
   		});
   	});

	// curl --header "Content-type: application/json" -X POST --data '{"mail":"test@test.fr", "id_hotel":1, "commentaire":"Chambre sombre mais séjour parfait.", "date_debut_sejour":"5/12/2018", "nb_jours_reste":20}' localhost:8888/addCom
    app.post("/addCom", (req, res) => { 
    	res.setHeader("Content-type", "text/raw");	
    	try {
    			db.collection('commentaire').find().toArray((err,documents)=>{
    				let idNewCom=0;
    				for(let i =0; i<documents.length;i++){ //pour a voir un id unique
    					if(idNewCom<documents[i].id_com)
    						idNewCom = documents[i].id_com;
    				}
    				idNewCom++;
    				req.body["id_com"]=idNewCom;

    				db.collection('commentaire').insertOne(req.body);
					res.end(JSON.stringify("\nInsertion réussie\n"));
		  
	    		});
    	} catch(e) {
    		console.log(e);
    	}	
    });

    //test : curl --header "Content-type: application/json" -X DELETE localhost:8888/deleteCom/comID=2
    app.delete("/deleteCom/comID=:comID", (req,res) =>{
    	let comID =  parseInt(req.params.comID);

    	db.collection('commentaire').find({"id_com":comID}).toArray((err, documents)=>{
    		if(documents!== undefined && documents[0]!==undefined){
    			db.collection("commentaire").deleteOne({"id_com":comID});
       			res.setHeader("Content-type","application/json");
		    	res.end(JSON.stringify("\nSuppression réussie !\n"));    			
    		}else{
    			res.setHeader("Content-type","application/json");
		    	res.end(JSON.stringify("\nSuppression non réussie !\n"));
    		}
    	});
    });

    //Mettre les slashes de la date avec %2F
    //test : curl --header "Content-type: application/json" -X PUT localhost:8888/updateCom/comID=1/com=TEST/date=12%2F04%2F2019/nbJ=30
    app.put("/updateCom/comID=:comID/com=:com/date=:date/nbJ=:nbJ",(req,res)=>{
    	let comID = parseInt(req.params.comID);
    	let com = req.params.com;
    	let date = req.params.date;
    	let nbJ = parseInt(req.params.nbJ);
    	db.collection("commentaire").updateOne({"id_com":comID},{$set :{"commentaire":com,"date_debut_sejour":date,"nb_jours_reste":nbJ}});
    	res.setHeader("Content-type","application/json");
		res.end(JSON.stringify("Modification réussie !"));
    });
    
    /*------------------------ Service test affichage ontologie ------------------------*/
app.get("/ontologie", (req, res) => {
	    db.collection("ontologie").find().toArray((err, documents)=> {
			res.setHeader("Content-type", "application/json");
		    res.end(JSON.stringify(documents));
		});
   	});

});

   	
console.log("Everything is ok !");
app.listen(8888);
