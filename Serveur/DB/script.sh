#!/bin/bash 
mongoimport --db Hotel_Advisor --collection user --file user.json --jsonArray --drop

mongoimport --db Hotel_Advisor --collection ontologie --file ontologie.json --jsonArray --drop

mongoimport --db Hotel_Advisor --collection commentaire --file commentaire.json --jsonArray --drop

mongoimport --db Hotel_Advisor --collection hotel --file hotel.json --jsonArray --drop
