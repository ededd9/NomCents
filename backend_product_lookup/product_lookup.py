from flask import Flask, jsonify, request
import requests

# NOTES
# --------------
# JSONIFY turns dictionaries and lists into a JSON formatted object
# this is crucial so that frontend can understand the responses of queries
# --------------

app = Flask(__name__)
# unsure of what endpoint i should be referencing to search things via Flask
OPENFOODFACTS_API_URL = "https://world.openfoodfacts.org/cgi/search.pl"

@app.route('/api/search', methods=['GET'])
def search_product():
    # 'product' will be variable name for the query parameter in the website URL
    query = request.args.get('product')
    
    # error checking
    if not query:
        return 400
    
    # make open food facts (OFF) API request
    # search_terms - the parameter used by OFF to search for products
    # query - search terms user entered
    response = requests.get(OPENFOODFACTS_API_URL, 
                            params={"search_terms": query, 
                                    "fields": "product_name, brands, nutrition_grades, ingredients_text, image_url"})

    # error checking for response var
    if response.status_code != 200:
        # couldn't get data from OFF
        return
    
    # grab response info (given in a json format)
    response_data = response.json()
    
    # list the results on the page
    # products - list of products related to search query
    # results - empty list to store processed products
    # product.get(key, default_value) - if key exists, return its value. else set to default value
    
    products = response_data.get("products", [])
    results = []
    
    for product in products:
        product_info = {
            "name": product.get("product_name", "Unknown"),
        "brand": product.get("brands", "Unknown"),
        "nutrition_grade": product.get("nutrition_grades", "N/A"),
        "ingredients": product.get("ingredients_text", "N/A"),
        "image": product.get("image_url", "No image available")
        }
        
        # add each product to results list
        results.append(product_info)
            

if __name__ == '__main__':
    app.run(debug=True)
