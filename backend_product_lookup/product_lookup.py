from flask import Flask, jsonify, request
import requests, math

# NOTES
# --------------
# JSONIFY turns dictionaries and lists into a JSON formatted object
# this is crucial so that frontend can understand the responses of queries
# --------------

# REFERNCE LINKS
# --------------
# Open Food Facts Documentation - https://world.openfoodfacts.org/files/api-documentation.html#jump-SearchRequests-Searchingforproducts
# USDA Documentation - https://fdc.nal.usda.gov/api-guide
# Requests - https://www.w3schools.com/python/ref_requests_get.asp
# JSONIFY - https://www.geeksforgeeks.org/use-jsonify-instead-of-json-dumps-in-flask/#


# google search engine ID - a1fd8a68793a64ed1
# google api key - AIzaSyDqPggIMYWxVREK0l1a_zxnORiDj-Bd7AM

app = Flask(__name__)
USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
USDA_API_KEY = "ErqPLe9V080QM2baXIjUt40zxkon8al2JBfwqKJN"
# GOOGLE_API_KEY = "AIzaSyDqPggIMYWxVREK0l1a_zxnORiDj-Bd7AM"
# SEARCH_ENGINE_ID = "a1fd8a68793a64ed1"

"""def get_product_image(product, brand):
    query = f"{product} {brand} food"
    url = f"https://www.googleapis.com/customsearch/v1"
    
    # response should contain image from custom search query
    response = requests.get(url, params = {
        "q": query,
        "cx": SEARCH_ENGINE_ID,
        "key": GOOGLE_API_KEY,
        "searchType": "image",
        "num": 1
    })
    
    if response.status_code == 200:
        data = response.json()
        print("Google API response:", data)  # Debug print the entire response

        
        # if there are multiple images that could be retrieved
        if "items" in data and len(data["items"]) > 0:
            return data["items"][0]["link"] # 0 = first image url
    return None # no image found"""

@app.route('/api/search', methods=['GET'])
def search_product():
    # 'product' will be variable name for the query parameter in the website URL
    # default to page 1
    # default to 50 items per page
    query = request.args.get('product')
    page = request.args.get('page', default = 1, type = int)
    page_size = request.args.get('pageSize', default = 50, type = int)
    
    # error checking, 400 = bad request
    if not query:
        return jsonify({"error": "did not enter search query :("}), 400
    
    
    # make open food facts (OFF) API request WITH PAGING
    # search_terms - the parameter used by OFF to search for products
    # query - search terms user entered
    response = requests.get(USDA_API_URL, 
                            params={"query": query, 
                                    "pageSize": page_size,
                                    "pageNumber": page, # use page number in the request
                                    "api_key": USDA_API_KEY
                                    })

    # error checking for response var
    if response.status_code != 200:
        # couldn't get data from OFF
        return jsonify({"error": "could not retrieve data from USDA food data central API"}), 500
    
    # grab response info (given in a json format)
    response_data = response.json()
    # print(response_data)
    
    # error checking for response_data
    if not response_data:
        return jsonify({"error": "empty response from API :("}), 500
    
    # list the results on the page
    # products - list of products related to search query
    # total_results - keeps count of total query results
    # results - stores processed products
    # product.get(key, default_value) - if key exists, return its value. else set to default value
    
    foods = response_data.get("foods", [])
    total_results = response_data.get("totalHits", 0)
    
    # if no products found
    if not foods:
        return jsonify({"error": "no products found :("}), 404
    
    # format product data
    results = []
    for food in foods:
        # need these parameters for image querying
        name = food.get("description", "Unknown")
        brand = food.get("brandOwner", "Unknown")
        
        # get image url using google search api
        # image_url = get_product_image(name, brand)
        
        food_info = {
            "name": name,
            "brand": brand,
            "ingredients": food.get("ingredients", "Ingredients not available"),
            "nutrition": {
                "calories": None,
                "protein": None,
                "fat": None,
                "carbohydrates": None,
                "sugars": None,
                "vitamins": {}
            }
        }
        
        if "foodNutrients" in food:
            
            # get nutrition info about the products from the search query
            for nutrient in food["foodNutrients"]:
                nutrient_name = nutrient.get("nutrientName", "").lower()
                nutrient_value = nutrient.get("value", "N/A")
                
                if "energy" in nutrient_name:
                    food_info["nutrition"]["calories"] = nutrient_value
                elif "protein" in nutrient_name:
                    food_info["nutrition"]["protein"] = nutrient_value
                elif "total lipid" in nutrient_name or "fat" in nutrient_name:
                    food_info["nutrition"]["fat"] = nutrient_value
                elif "carbohydrate" in nutrient_name:
                    food_info["nutrition"]["carbohydrates"] = nutrient_value
                elif "sugars" in nutrient_name:
                    food_info["nutrition"]["sugars"] = nutrient_value
                elif "vitamin" in nutrient_name:
                    vitamin_name = nutrient.get("nutrientName", "Unknown Vitamin")
                    food_info["nutrition"]["vitamins"][vitamin_name] = nutrient_value
    
        
        # add each product to results list
        results.append(food_info)
        
    # based on how many results there are, how many pages are needed to display all data?
    total_pages = math.ceil(total_results / page_size)
    
    # return all gathered info in form of a json file
    """notes for frontend:
        # to access next page of results, send the next 'page' parameter based on
        # 'current_page' value returned from this script
        # check if current_page < total_pages
        # then page = current_page++
    """
        
    """notes for backend:
        # request: /api/search?product=<search_query>&page=2&page_size=50
    """ 
    return jsonify({
        "results": results,
        "paging_info": {
            "current_page": page,
            "page_size": page_size,
            "total_results": total_results,
            "total_pages": total_pages
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
