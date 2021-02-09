import requests
from bs4 import BeautifulSoup

with open('SPACS.txt', mode='r') as f:
    spacList = f.read().split('\n')
with open('SPACSCIK.txt', 'a') as spacCIK:
    url = 'https://www.sec.gov/include/ticker.txt'
    content = requests.get(url)
    tickers = {}
    for ticker in content.text.split('\n'):
        tickers[ticker.split()[0]] = ticker.split()[1]
    for spac in spacList:
        try:
            spacCIK.write(spac + " " + tickers[spac.lower()] + '\n')
            print(tickers[spac.lower()])
        except:
            continue

