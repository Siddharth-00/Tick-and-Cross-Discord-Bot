
# import our libraries
import requests
import time
def make_url(base_url , comp):
    
    url = base_url
    
    # add each component to the base url
    for r in comp:
        url = '{}/{}'.format(url, r)
        
    return url

def check_merger(cik_num, index_num):
  time.sleep(0.15)
  # define a base url, this would be the EDGAR data Archives
  base_url = r"https://www.sec.gov/Archives/edgar/data"

  # define a company to search (GOLDMAN SACHS), this requires a CIK number that is defined by the SEC.
  # let's get all the filings for Goldman Sachs in a json format.
  # Alternative is .html & .xml
  filings_url = make_url(base_url, [cik_num, 'index.json'])

  # Get the filings and then decode it into a dictionary object.
  content = requests.get(filings_url)
  decoded_content = content.json()
  for i in range(index_num):
    filing_number = decoded_content['directory']['item'][i]
    filing_num = filing_number['name']
    # define the filing url, again I want all the data back as JSON.
    filing_url = make_url(base_url, [cik_num, filing_num, 'index.json'])

    # Get the documents submitted for that filing.
    content = requests.get(filing_url)
    document_content = content.json()
    # get a document name
    for document in document_content['directory']['item']:
        document_name = document['name']
        filing_url = make_url(base_url, [cik_num, filing_num, document_name])
        if('.txt' in filing_url):
          content = requests.get(filing_url)
          for ln in content.text.split('\n'):
            if('CONFORMED SUBMISSION TYPE' in ln):
              if ('425' in ln):
                return True
              break
  return False

