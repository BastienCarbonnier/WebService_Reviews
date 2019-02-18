#!/usr/bin/python3.6
import pandas as pa
from bs4 import BeautifulSoup
import requests

from selenium import webdriver
from selenium.webdriver.firefox.options import Options

options = Options()
options.add_argument('--headless')

driver = webdriver.Firefox(options=options)

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
		return BeautifulSoup(page, 'html.parser')

def parse(url, reponse):
	if not reponse:
		print('Pas de reponse du site:', url)
		driver.close()
		return

	num_reviews = reponse.find("span", {"class":"reviewCount"}).text
	num_reviews = num_reviews.replace("avis","")
	num_reviews = int(num_reviews)
	print('num_reviews:', num_reviews, type(num_reviews))
	url = url.replace('.html', '-or{}.html')
	print(reponse)
	for offset in range(0, num_reviews, 5):
		url_ = url.format(offset)
		parse_reviews(url_, sitedown(url_))

def parse_reviews(url, reponse):
	print("URL :", url)
	if not reponse:
		print('Pas de reponse du site:', url)
		driver.close()
		return

	for idx, review in enumerate(reponse.find_all("div", {"class":"hotels-hotel-review-community-content-review-list-parts-SingleReview__mainCol--29php"})):
		rank = review.select_one('.ui_bubble_rating')['class'][1][7:]
		#print(rank)
		#print("-------------------------------------")
		rank = float(review.select_one('.ui_bubble_rating')['class'][1][7:])/10
		item = {
			'review_body': review.select_one('q').span.text,
			'rating': rank,
		}
	

		results.append(item) # <--- add to global list


	
results = [] 
#site = input("Donner l'url de l'hotel sur Tripadvisor : ") pour plus tard
#site = "https://www.tripadvisor.fr/Hotel_Review-g562819-d289642-Reviews-Hotel_Caserio-Playa_del_Ingles_Maspalomas_Gran_Canaria_Canary_Islands.html"
site="https://www.tripadvisor.fr/Hotel_Review-g1580906-d3535850-Reviews-Envie_de_Sud-Vauvert_Gard_Occitanie.html"
s = requests.Session()

parse(site, sitedown(site))

df = pa.DataFrame(results) 
df.to_csv('output.csv')    