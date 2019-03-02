#!/usr/bin/python3.6

#IMPORTANT
#Toutes les balises sont les plus génériques que j'ai trouvé. Toutes pages HTML d'un hôtel doit les avoirs !

import pandas as pa
from bs4 import BeautifulSoup
import requests

from selenium import webdriver
from selenium.webdriver.firefox.options import Options

options = Options()
#Evite que le navigateur firefox s'ouvre
options.add_argument('--headless')

driver = webdriver.Firefox(options=options)

#Bot qui permet de clicker sur tous les boutons "plus" pour afficher le commentaire en intégralité.
#On retourne l'HTML généré.
def plusclick(url):
	driver.get(url)
	try:
		driver.find_element_by_class_name('hotels-hotel-review-community-content-review-list-parts-ExpandableReview__cta--3_zOW').click()
	except Exception as e:
		print("Pas de plus")
	return driver.page_source

def sitedown(url):
	r = s.get(url)
	if r.status_code != 200:
		print('status_code : ', r.status_code)
	else:
		page = plusclick(url)
		return BeautifulSoup(page, 'html.parser') #Biblio BeautifulSoup qui permet de parser un HTML et de sortir un objet pour faciliter le parsing de celui-ci.

def parse(url, reponse):
	if not reponse:
		print('Pas de reponse du site:', url)
		driver.close()
		return

	#On récupère le nombre de commentaire mis sur la page de l'hôtel (commentaire étrangé inclus)
	num_reviews = reponse.find("span", {"class":"reviewCount"}).text
	num_reviews = num_reviews.replace("avis","")
	num_reviews = num_reviews.replace("\xa0","") # pour les espaces si le nombres d'avis est au-dessus de 1000 (sur tripadvisor la forme est 1\xa0000\xa0avis = 1 000 avis)
	num_reviews = int(num_reviews)
	print('num_reviews:', num_reviews)
	url = url.replace('.html', '-or{}.html')
	# Sur Tripadvisor les commentaires sont affichés 5 par 5 : https://www.tripadvisor.fr/Hotel_Review-g562819-d287443-Reviews-Occidental_Margaritas-Playa_del_Ingles_Maspalomas_Gran_Canaria_Canary_Islands-or0.html pour les 5 premier commentaires
	# les 5 suivants : https://www.tripadvisor.fr/Hotel_Review-g562819-d287443-Reviews-Occidental_Margaritas-Playa_del_Ingles_Maspalomas_Gran_Canaria_Canary_Islands-or5.html
	for offset in range(0, num_reviews, 5):
		url_ = url.format(offset)
		doBreak = parse_reviews(url_, sitedown(url_))
		if doBreak==1:
			break

def parse_reviews(url, reponse):
	print("URL :", url)
	if not reponse:
		print('Pas de reponse du site:', url)
		driver.close()
		return

	liste_commentaire = enumerate(reponse.find_all("div", {"class":"hotels-hotel-review-community-content-review-list-parts-SingleReview__mainCol--29php"}))
	#Test nécessaire car on récupère que les commentaires Français donc pas besoin de faire les autres pages
	if len(list(liste_commentaire))!= 0 : # si il n'y a plus de commentaire, on passe à l'hotel suivant
		#Obligé de refaire un enumerate car liste_commentaire est transformé en liste pour calculer le nombre de commentaire et c'est important pour le for.
		for idx, review in enumerate(reponse.find_all("div", {"class":"hotels-hotel-review-community-content-review-list-parts-SingleReview__mainCol--29php"})):
			rank = review.select_one('.ui_bubble_rating')['class'][1][7:]
			rank = float(review.select_one('.ui_bubble_rating')['class'][1][7:])/10
			item = {
				'review_body': review.select_one('q').span.text,
				'rating': rank,
			}
			results.append(item) # <--- add to global list
		return 0
	return 1 #on stop le traitement sur cette hôtel car on a récupéré tous les commentaires FR



results = []
#site = input("Donner l'url de l'hotel sur Tripadvisor : ") si on fait en ligne de commande
#Ici je donne une liste de site que j'ai choisi
sites=["https://www.tripadvisor.fr/Hotel_Review-g562819-d289642-Reviews-Hotel_Caserio-Playa_del_Ingles_Maspalomas_Gran_Canaria_Canary_Islands.html","https://www.tripadvisor.fr/Hotel_Review-g562819-d287443-Reviews-Occidental_Margaritas-Playa_del_Ingles_Maspalomas_Gran_Canaria_Canary_Islands.html","https://www.tripadvisor.fr/Hotel_Review-g562818-d237094-Reviews-Gloria_Palace_San_Agustin_Thalasso_Hotel-San_Agustin_Maspalomas_Gran_Canaria_Canary_Isl.html","https://www.tripadvisor.fr/Hotel_Review-g230095-d268385-Reviews-H10_Playa_Meloneras_Palace-Maspalomas_Gran_Canaria_Canary_Islands.html","https://www.tripadvisor.fr/Hotel_Review-g664857-d559667-Reviews-Hotel_Cordial_Mogan_Playa-Puerto_de_Mogan_Mogan_Gran_Canaria_Canary_Islands.html","https://www.tripadvisor.fr/Hotel_Review-g635887-d530796-Reviews-Gloria_Palace_Amadores_Thalasso_Hotel-Puerto_Rico_Gran_Canaria_Canary_Islands.html","https://www.tripadvisor.fr/Hotel_Review-g635887-d530806-Reviews-Marina_Suites-Puerto_Rico_Gran_Canaria_Canary_Islands.html","https://www.tripadvisor.fr/Hotel_Review-g2089121-d241729-Reviews-Lopesan_Costa_Meloneras_Resort_Spa_Casino-Meloneras_Gran_Canaria_Canary_Islands.html"]

s = requests.Session()

for site in sites:
	parse(site, sitedown(site))
	df = pa.DataFrame(results)
	df.to_csv('output.csv',mode='a', sep='|',header=False,index=False) #le second argu permet d'ajouter à la suite du csv
	results= []
