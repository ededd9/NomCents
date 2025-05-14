import datetime
from datetime import datetime
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
from flask import Flask, abort, jsonify,request
import requests, math
from flask_cors import CORS
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import re
from base64 import b64encode
from dotenv import load_dotenv
import os
import time
import aiohttp
import asyncio
from cachetools import TTLCache #testing this
# Load environment variables from a .env file
load_dotenv()

##the authenticator produces output of form 
##    { "id": "1234", "given_name": "John", "name": "John Doe", "email": "john_doe@idp.example" }
## for now we can just store that whole thing, we will use the email as the indexing entity tho because theoretically we might want to support email password logins
##
ATLAS_URI="mongodb+srv://pythhon:8x5pGda7EWdKGtV0@nomcents.5fhvz.mongodb.net/?retryWrites=true&w=majority&appName=nomcents"
DB_NAME = 'users'
COLLECTION_NAME = 'users_test'
#WEIGHT_LOG = 'weight_logs'
kroger_cache = TTLCache(maxsize=10000, ttl=86400)  # Cache for 1 hour #test
class AtlasClient ():
   def __init__ (self, altas_uri, dbname):
       self.mongodb_client = MongoClient(altas_uri)
       self.database = self.mongodb_client[dbname]
   ## A quick way to test if we can connect to Atlas instance
   def ping (self):
       self.mongodb_client.admin.command('ping')
   def get_collection (self, collection_name):
       collection = self.database[collection_name]
       return collection
   def find (self, collection_name, filter = {}, limit=0):
       collection = self.database[collection_name]
       items = list(collection.find(filter=filter, limit=limit))
       return items
   def insWrapper(self,newDoc,collection_name):
       collection = self.database[collection_name]
       collection.insert_one(newDoc)
   def upWrapper(self,eDock,collection_name):
       collection = self.database[collection_name]
       collection.update_one({"email":eDock['email']},{"$set": eDock}) 
       
   
class datauser():
    def __init__(self,atlas_uri, dbname, collection_name):
        self.atlas_client = AtlasClient (atlas_uri, dbname)
        self.atlas_client.ping()
        print ('Connected to Atlas instance! We are good to go!')
        self.collection_name=collection_name
    def userLookup (self,userString):
       userdet=json.loads(userString)
       collection = self.atlas_client.database[self.collection_name]
       user = collection.find_one({"email":userdet['email']})
       return user
    def isUser(self,userstring):
        user = self.userLookup (userstring)
        if(not (user is None)):
            return True
        else:
            return False
    def makeUser(self,userdet):
        usstring=('{"email":"'+ userdet['email']+'"}')
        if(not data.isUser(usstring)):
            self.atlas_client.insWrapper(userdet,self.collection_name)
            return True
        else:
            return False
    def editUser(self,userdet):
        usstring=('{"email":"'+ userdet['email']+'"}')
        if(not data.isUser(usstring)):
            return False
        else:
            self.atlas_client.upWrapper(userdet,self.collection_name)
            return True



# data = datauser (ATLAS_URI, DB_NAME,COLLECTION_NAME)
# email=input("Enter email: ")
# usstring=('{"email":"'+ email+'"}')
# if(data.isUse"emailr(usstring)):
#     user=data.userLookup(usstring)
#     print("user name is "+ user['name'])
#     usstrindg='{"email":"'+ email+'", "name":"'+user['name']+'e"}'
#     data.editUser(usstrindg)
#     user=data.userLookup(usstring)
#     print("user name is "+ user['name'])
# else:
#     print("user not found, create user now")
#     name = input("Enter name: ")
#     usstring='{"email":"'+ email+'", "name":"'+name+'"}'

#     data.makeUser(usstring)
# print(data.isUser(usstring))

app = Flask(__name__)
CORS(app)

data = datauser (ATLAS_URI, DB_NAME,COLLECTION_NAME)

# For storing current token until it expires
token_cache = {
    "access_token": None,
    "expires_at": 0
}

# Get Kroger API credentials from .env file
client_id = os.getenv("KROGER_CLIENT_ID")
client_secret = os.getenv("KROGER_CLIENT_SECRET")

# Route for getting Kroger access token
@app.route("/api/kroger-token", methods=["GET"])
def get_kroger_token():
    now = time.time()
    if token_cache["access_token"] and now < token_cache["expires_at"]:
        return jsonify({"token": token_cache["access_token"]})

    # Token expired or doesn't exist, generate new
    auth_header = b64encode(f"{client_id}:{client_secret}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials", "scope": "product.compact"}
    res = requests.post("https://api-ce.kroger.com/v1/connect/oauth2/token", headers=headers, data=data)
    res_json = res.json()

    token_cache["access_token"] = res_json["access_token"]
    token_cache["expires_at"] = now + res_json["expires_in"]

    print("Token: ", token_cache["access_token"], flush=True)
    return jsonify({"token": token_cache["access_token"]})


# get takes ?email= and the other two methods take json for the user as teh user variable
@app.route('/api/user', methods=['GET', 'POST', 'PUT'])
def user():
    print(request.method)
    if request.method == 'GET':
        # usstring=request.args['user']
        email=request.args['email']
        usstring=('{"email":"'+ email+'"}')

        user=data.userLookup(usstring)
        if(not (user is None)):
            user['_id'] = str(user['_id'])
            return jsonify(user)
        else:
            abort(404)
    elif request.method== 'POST':
        udat=request.get_json()
        if data.makeUser(udat):
                return jsonify({"message": "User made successfully"}), 200
 
        else:
            abort(404)
    elif request.method == 'PUT':
        udat = request.get_json()
        email = udat.get('email')

        if not email:
            return jsonify({"message": "Email is required"}), 400

        # Retrieve the existing user data
        existing_user = data.userLookup(json.dumps({"email": email}))

        if not existing_user:
            return jsonify({"message": "User not found"}), 404

        # Merge the existing user data with the new data
        updated_user = {**existing_user, **udat}

        # Remove the MongoDB ObjectId field (_id) before updating
        updated_user.pop('_id', None)

        # Update the user in the database
        if data.editUser(updated_user):
            return jsonify({"message": "User updated successfully"}), 200
        else:
            return jsonify({"message": "Failed to update user"}), 400

@app.route('/api/auth/google', methods=['POST'])
def verify_google_token():
    token = request.json.get('token')
    response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
    if response.status_code == 200:
        user_info = response.json()
        email = user_info['email']
        user = data.userLookup(json.dumps({"email": email}))
        if not user:
            data.makeUser(user_info)
        else:
            user_info['_id'] = str(user['_id'])  # Convert ObjectId to string
        return jsonify(user_info), 200
    else:
        return jsonify({"message": "Invalid token"}), 400
#register / login logic w just email / password ( no g auth)
@app.route('/api/auth/email', methods=['POST'])
def email_auth():
    try:
        #break up jsons data from req
        request_data = request.get_json()
        #get email pw and name from req
        email = request_data.get('email')
        password = request_data.get('password')
        name = request_data.get('name', None)
        #input validation --

        #email and pw are required
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400
        #valid email format
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({"message": "Email format invalid"}), 400

        #check if user is in db    
        user = data.userLookup(json.dumps({"email": email}))
        
        # Check if this is a registration request (has name field)
        if name is not None:
            if user:
                return jsonify({"message": "User already exists"}), 400
            #encrypt pw
            hashed_password = generate_password_hash(password)
            #create new user data obj
            user_data = {
                "email": email,
                "password": hashed_password,
                "name": name
            }
            #create the user
            if data.makeUser(user_data):
                return jsonify({"message": "User registered successfully"}), 201
            return jsonify({"message": "Registration failed"}), 400
        else:
            # This is a login request
            #first check if user exists then check if password is correct
            if not user:
                return jsonify({"message": "User not found"}), 404
            if not check_password_hash(user.get('password', ''), password):
                return jsonify({"message": "Invalid credentials"}), 401
            
            user.pop('password', None)
            user['_id'] = str(user['_id'])
            return jsonify(user), 200

    except Exception as e:
        print(f"Error in email_auth: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

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

# app = Flask(__name__)
# CORS(app) # allows cross-origin requests, which is needed for the frontend to access the backend

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

# Route for getting locations near zipcode user entered
@app.route('/api/locations', methods=['GET'])
def get_locations():
    get_kroger_token()
    zipcode = request.args.get("zipcode")
    
    if not zipcode:
        return jsonify({"error": "zipcode is required"}), 400
    
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer { token_cache['access_token']}"
    }
    
    response = requests.get(f"https://api-ce.kroger.com/v1/locations?filter.zipCode.near={zipcode}&filter.limit=10", headers=headers)
    
    print("Kroger API Request URL:", response.url, flush=True)
    
    if response.status_code != 200:
        return jsonify({"error": "could not retrieve data from Kroger API"}), 500
    
    locations_data = response.json()
    
    if not locations_data or 'data' not in locations_data:
        return jsonify({"error": "no locations found"}), 404
    
    locations = locations_data['data']
    
    # Format the response to include only necessary fields
    formatted_locations = []
    
    for location in locations:
        formatted_location = {
            "locationId": location.get("locationId"),
            "address": location.get("address", {}).get("addressLine1", "N/A"),
            "city": location.get("address", {}).get("city", "N/A"),
            "state": location.get("address", {}).get("state", "N/A"),
            "zipCode": location.get("address", {}).get("zipCode", "N/A"),
            "phoneNumber": location.get("phoneNumber", "N/A")
        }
        formatted_locations.append(formatted_location)
        
    return jsonify(formatted_locations)

#HELPER FUNCTIONS FOR FETCHING KROGER PRICES

# fetche price for a single product from kroger api asyncronously
#if found return price, if not return n/a
async def fetch_prices_batch(session, upcs, location_id, headers):
    #Fetch prices for multiple UPCs in a single request
    cache_key = (location_id, tuple(sorted(upcs)))
    if cache_key in kroger_cache:
        return kroger_cache[cache_key]
    
    url = "https://api-ce.kroger.com/v1/products"
    params = {
        "filter.locationId": location_id,
        "filter.productId": ",".join(f"00{upc}" for upc in upcs)
    }
    
    price_map = {} 
    
    try:
        async with session.get(url, headers=headers, params=params) as res:
            if res.status == 200:
                data = await res.json()
                #process each product in response
                for product in data.get("data", []):
                    product_id = product.get("productId", "")
                    #process valid product IDS
                    if product_id.startswith("00"):
                        upc = product_id[2:]
                        price = product.get("items", [{}])[0].get("price", {}).get("regular", "n/a")
                        price_map[upc] = price
                
                # Cache the successful response before returning
                if price_map:  # Only cache if we got some prices
                    kroger_cache[cache_key] = price_map
                
                return price_map
            return {}
    except Exception as e:
        print(f"Error fetching prices batch: {str(e)}", flush=True)
        return price_map  # Return the empty dict we initialized

#process foods in batches to reduce API calls
async def get_prices(foods, location_id, access_token, batch_size=20):
    connector = aiohttp.TCPConnector(
        limit=75,#increasing over 75 doesnt really do much so keep at 75
        limit_per_host=20,
        force_close=True
    )
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    async with aiohttp.ClientSession(connector=connector) as session:
        # Organize foods into batches
        upc_batches = []
        current_batch = []
        
        for food in foods:
            if food.get("gtinUpc"):
                upc = food["gtinUpc"][:-1]  # Remove last digit if needed
                current_batch.append(upc)
                if len(current_batch) >= batch_size:
                    upc_batches.append(current_batch)
                    current_batch = []
        
        if current_batch:
            upc_batches.append(current_batch)
        
        # Process batches in parallel
        batch_tasks = []
        for batch in upc_batches:
            batch_tasks.append(fetch_prices_batch(session, batch, location_id, headers))
        
        batch_results = await asyncio.gather(*batch_tasks)
        
        # Combine all batch results into one price map
        price_map = {}
        for result in batch_results:
            price_map.update(result)
        
        # Map prices back to foods
        prices = []
        for food in foods:
            if food.get("gtinUpc"):
                upc = food["gtinUpc"][:-1]
                prices.append(price_map.get(upc, "n/a"))
            else:
                prices.append("n/a")
        
        return prices
    
@app.route('/api/search', methods=['GET'])
async def search_product():
    get_kroger_token()
    #making sure results are new each new search
    print(f"\n\nsearching forr: '{request.args.get('product')}'")
    

    print("Making it into search_product() function...", flush=True)
    """
    USDA food API query params for reference:
 
    query <string>
    (Required) One or more search terms. The string may include search operators (ex. "green pepper" in quotes to search for the exact phrase, not just the individual words "green" and "pepper")
 
    dataType <string>
    Optional. Filter on a specific data type; specify one or more values in an array.
    Possible values: "Branded", "Foundation", "Survey (FNDDS)", "SR Legacy", "Experimental", "Other" (case insensitive). If not specified, all data types are included in the search.
 
    pageSize <integer>
    Optional. Maximum number of results to return for the current page. Default is 50.
 
    pageNumber <integer>
    Optional. Page number to retrieve. The offset into the overall result set is expressed as (pageNumber * pageSize)
 
    sortBy <string>
    Optional. Specify one of the possible values to sort by that field. Note, dataType.keyword will be dataType and lowercaseDescription.keyword will be description in future releases.
    Possible values: "lowercaseDescription.keyword", "fdcId", "dataType.keyword", "brandOwner.keyword", "modifiedDate", "publishedDate". If not specified, the default sort order is by "lowercaseDescription.keyword" in ascending order.
 
    sortOrder <string>
    Optional. The sort direction for the results. Only applicable if sortBy is specified.
    Possible values: "asc" (ascending) or "desc" (descending). Default is "asc".
 
    brandOwner <string>
    Optional. Filter results based on the brand owner of the food. Only applies to Branded Foods.
    """
 
    # 'product' will be variable name for the query parameter in the website URL
    # default to page 1
    # default to 50 items per page
    query = request.args.get("product")
    page = request.args.get("page", default=1, type=int)
    page_size = request.args.get("pageSize", default=50, type=int)
    usda_page = request.args.get("usda_page", default=1, type=int) # Keep track of current page to query starting from
    # Adding filtering query params with default values (if applicable)
    show_only_priced = request.args.get("showOnlyPriced", default="false").lower() == "true"
    data_type = request.args.getlist(
        "dataType"
    )  # Retrieves all values for 'dataType' as a list
    sort_by = request.args.get("sortBy", type=str)
    sort_order = request.args.get("sortOrder", type=str)
    brand_owner = request.args.get("brandOwner", default=None, type=str)
    location_id = request.args.get("locationId", default="01400376")

    # error checking, 400 = bad request
    if not query:
        return jsonify({"error": "did not enter search query :("}), 400

    # show priced products only filter, search Kroger API first then ATtempt to match with USDA
    if show_only_priced:
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {token_cache['access_token']}"
        }
        #initialize results
        results = []
        priority_results = []
        lower_priority_results = []
        # Search Kroger API for products with prices
        kroger_params = {
            "filter.term": query,
            # "filter.locationId": location_id,
            "filter.limit": page_size
        }
        DEFAULT_LOCATIONS = [
            "01400901",  # Cincinnati OH
            "01400413",  # Columbus OH
            "01400430",  # Louisville KY
            "01400453",  # Nashville TN
        ]

        #set location to eiher defaults or params
        if location_id and location_id != "01400376":
            kroger_params["filter.locationId"] = location_id
        else:
            #try valid locations until one works
            for loc_id in DEFAULT_LOCATIONS:
                kroger_params["filter.locationId"] = loc_id
                response = requests.get(
                    "https://api-ce.kroger.com/v1/products",
                    headers=headers,
                    params=kroger_params
                )
                if response.status_code == 200 and response.json().get('data'):
                    break

        try:
            #get products from API
            kroger_response = requests.get(
                "https://api-ce.kroger.com/v1/products",
                headers=headers,
                params=kroger_params
            )
            
            if kroger_response.status_code != 200:
                return jsonify({"error": "could not retrieve data from Kroger API"}), 500
                
            kroger_data = kroger_response.json()
            kroger_products = kroger_data.get('data', [])
            
            results = []
            priority_results = []
            lower_priority_results = []
            
            #for each kroger product, try to find matching USDA data
            for product in kroger_products:
                upc = product.get('upc')
                product_name = product.get('description', 'Unknown')
                brand = product.get('brand', 'Unknown')
                
                # get price from Kroger, skip product if no price available
                price = product.get('items', [{}])[0].get('price', {}).get('regular', 'n/a')
                if price == "n/a" or price is None:
                    continue
                print("PRICE", price)
    
                usda_product = None
                 
                #try to match by UPC
                if upc:
                    usda_params = {
                        "query": upc,
                        "api_key": USDA_API_KEY,
                        "pageSize": 1
                    }
                    usda_response = requests.get(USDA_API_URL, params=usda_params)
                    if usda_response.status_code == 200:
                        usda_data = usda_response.json()
                        if usda_data.get('foods'):
                            usda_product = usda_data['foods'][0]
                
                # upc cant match, try matching with brand namae
                if not usda_product:
                    usda_params = {
                        "query": product_name,
                        "api_key": USDA_API_KEY,
                        "pageSize": 1,
                        "brandOwner": brand
                    }
                    usda_response = requests.get(USDA_API_URL, params=usda_params)
                    if usda_response.status_code == 200:
                        usda_data = usda_response.json()
                        if usda_data.get('foods'):
                            usda_product = usda_data['foods'][0]
                
                #format product info
                product_info = {
                    "name": product_name,
                    "brandName": brand,
                    "price": price,
                    "gtinUpc": upc or "N/A"
                }
                
                #ifd USDA data found, add nutrition info
                if usda_product:
                    product_info.update({
                        "fdcId": usda_product.get("fdcId"),
                        "brandOwner": usda_product.get("brandOwner", "N/A"),
                        "ingredients": usda_product.get("ingredients", "Ingredients not available"),
                        "nutrition": {
                            "calories": 0,
                            "protein": 0,
                            "fat": 0,
                            "carbohydrates": 0,
                            "sugars": 0,
                            "vitamins": {},
                            "saturatedfat": 0,
                            "sodium": 0, 
                            "iron": 0, 
                            "calcium": 0, 
                            "fiber": 0,
                            "cholesterol": 0, 
                        }
                    })
                    
                    #parse nutrition data if available
                    if "foodNutrients" in usda_product:
                        for nutrient in usda_product["foodNutrients"]:
                            nutrient_name = nutrient.get("nutrientName", "").lower()
                            nutrient_value = nutrient.get("value", "N/A")
                            
                            if "energy" in nutrient_name:
                                product_info["nutrition"]["calories"] = nutrient_value
                            elif "protein" in nutrient_name:
                                product_info["nutrition"]["protein"] = nutrient_value
                            elif "total lipid" in nutrient_name or "total fat" in nutrient_name:
                                product_info["nutrition"]["fat"] = nutrient_value
                            elif "carbohydrate" in nutrient_name:
                                product_info["nutrition"]["carbohydrates"] = nutrient_value
                            elif "sugars" in nutrient_name:
                                product_info["nutrition"]["sugars"] = nutrient_value
                            elif "vitamin" in nutrient_name:
                                vitamin_name = nutrient.get("nutrientName", "Unknown Vitamin")
                                product_info["nutrition"]["vitamins"][vitamin_name] = nutrient_value
                            elif "saturated fat" in nutrient_name:
                                product_info["nutrition"]["saturatedfat"] = nutrient_value
                            elif "sodium" in nutrient_name:
                                product_info["nutrition"]["sodium"] = nutrient_value
                            elif "iron" in nutrient_name:
                                product_info["nutrition"]["iron"] = nutrient_value
                            elif "calcium" in nutrient_name:
                                product_info["nutrition"]["calcium"] = nutrient_value
                            elif "cholesterol" in nutrient_name:
                                product_info["nutrition"]["cholesterol"] = nutrient_value
                            elif "fiber" in nutrient_name:
                                product_info["nutrition"]["fiber"] = nutrient_value
                        priority_results.append(product_info)
                    else:
                        lower_priority_results.append(product_info)

                
                results = priority_results + lower_priority_results
            
            return jsonify({
                "results": results[:page_size],
                "paging_info": {
                    "current_page": page,
                    "page_size": page_size,
                    "total_results": len(results),
                    "total_pages": 1,
                    "next_usda_page": None
                }
            })
            
        except Exception as e:
            print(f"Error in show_only_priced mode: {str(e)}", flush=True)
            return jsonify({"error": "Failed to process priced products"}), 500
    
    else:
        # USDA search logic when show_only_priced is False
        params = {
            "query": query,
            "pageSize": page_size,
            "pageNumber": page,  # use page number in the request
            "sortOrder": sort_order,
            "api_key": USDA_API_KEY,
        }
 
        if sort_by:
            params["sortBy"] = sort_by
 
        # Only add dataType to params if it's not empty
        if data_type and all(item != "" for item in data_type):
            params["dataType"] = data_type
 
        # Only add brandOwner to params if it's not empty string
        if brand_owner != "" and brand_owner is not None:
            params["brandOwner"] = brand_owner
 
        print(
            "Search parameters:", params, flush=True
        )  # Debug print to check the parameters being sent to the API
 
        # make USDA API request WITH PAGING
        results = []
        total_results = 0
        total_pages = 1
        current_usda_page = usda_page # Start querying from page passed in
        # Fetch results until we have enough for the current frontend page or reach end of USDA API pgs
        while len(results) < page_size and current_usda_page <= total_pages:
            params["pageNumber"] = current_usda_page
            response = requests.get(USDA_API_URL, params=params)
            print("USDA API Request URL:", response.url, flush=True)
       
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
            total_pages = (total_results + params["pageSize"] - 1) // params["pageSize"]
       
            # if no products found
            if not foods:
                break
       
            # format product data
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {token_cache["access_token"]}"
            }
           
           # 
            valid_foods = [food for food in foods if food.get("gtinUpc")]
            prices = await get_prices(valid_foods, location_id,token_cache["access_token"])
            for food, price in zip(valid_foods, prices):
                # If show_only_priced is true, skip products with no price
                if show_only_priced and price == "n/a":
                    continue
           
                # need these parameters for image querying
                name = food.get("description", "Unknown")
                brandOwner = food.get("brandOwner", "Unknown")
                brandName = food.get("brandName", "N/A")
                #print(food) 
                # get image url using google search api
                # image_url = get_product_image(name, brand)
       
                product_info = {
                    "fdcId": food.get("fdcId"),
                    # Add barcode for matching prices to products
                    "gtinUpc": food.get("gtinUpc", "N/A"),
                    "name": name,
                    "price": price,
                    "brandOwner": brandOwner,
                    "brandName": brandName,
                    "ingredients": food.get("ingredients", "Ingredients not available"),
                    "servingsize": food.get("servingSize","Unknown"),
                    "servingSizeUnit": food.get("servingSizeUnit","Unknown"),
                    "householdserving": food.get("householdServingFullText","Unknown"),
                    "packageSize": food.get("packageWeight","Unknown"),
                    "nutrition": {
                        "calories": 0,
                        "protein": 0,
                        "fat": 0,
                        "carbohydrates": 0,
                        "sugars": 0,
                        "vitamins": {},
                        "saturatedfat": 0,
                        "sodium": 0, 
                        "iron": 0, 
                        "calcium": 0, 
                        "fiber": 0,
                        "cholesterol": 0, 
                    }
                }
               
                if "foodNutrients" in food:
                   
                    # get nutrition info about the products from the search query
                    for nutrient in food["foodNutrients"]:
                        nutrient_name = nutrient.get("nutrientName", "").lower()
                        nutrient_value = nutrient.get("value", "N/A")
                       
                        if "energy" in nutrient_name:
                            product_info["nutrition"]["calories"] = nutrient_value
                        elif "protein" in nutrient_name:
                            product_info["nutrition"]["protein"] = nutrient_value
                        elif "total lipid" in nutrient_name or "total fat" in nutrient_name:
                            product_info["nutrition"]["fat"] = nutrient_value
                        elif "carbohydrate" in nutrient_name:
                            product_info["nutrition"]["carbohydrates"] = nutrient_value
                        elif "sugars" in nutrient_name:
                            product_info["nutrition"]["sugars"] = nutrient_value
                        elif "vitamin" in nutrient_name:
                            vitamin_name = nutrient.get("nutrientName", "Unknown Vitamin")
                            product_info["nutrition"]["vitamins"][vitamin_name] = nutrient_value
                        elif "saturated" in nutrient_name:
                            product_info["nutrition"]["saturatedfat"] = nutrient_value
                        elif "sodium" in nutrient_name:
                            product_info["nutrition"]["sodium"] = nutrient_value
                        elif "iron" in nutrient_name:
                            product_info["nutrition"]["iron"] = nutrient_value
                        elif "calcium" in nutrient_name:
                            product_info["nutrition"]["calcium"] = nutrient_value
                        elif "cholesterol" in nutrient_name:
                            product_info["nutrition"]["cholesterol"] = nutrient_value
                        elif "fiber" in nutrient_name:
                            product_info["nutrition"]["fiber"] = nutrient_value
                        elif "servingSize" in nutrient_name:
                            product_info["nutrition"]["size"] = nutrient_value
               
                # add each product to results list
                results.append(product_info)
               
                if len(results) >= page_size:
                    break
               
            current_usda_page += 1 # Move to the next page of USDA API results
           
        # based on how many results there are, how many pages are needed to display all data?
        # total_pages = math.ceil(total_results / page_size)
       
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
            "results": results[:page_size],  # limit results to page size
            "paging_info": {
                "current_page": page,
                "page_size": page_size,
                "total_results": total_results,
                "total_pages": total_pages,
                "next_usda_page": current_usda_page if current_usda_page <= total_pages else None
            }
        })
    # error checking, 400 = bad request
    


# Endpoint for price comparison for the 10 (max) stores near the user's zipcode -- pass store location IDs as an array in the request body
@app.route('/api/price_comparison', methods=['GET'])
def price_comparison():
    print("Price comparison endpoint hit", flush=True)
    print("Query parameters:", request.args, flush=True)
    get_kroger_token()
    location_ids = request.args.getlist("locationIds")
    print("Location IDs:", location_ids, flush=True)
    gtinUpc = request.args.get("gtinUpc", None)
    print("GTIN/UPC:", gtinUpc, flush=True)
    
    if not location_ids or not gtinUpc:
        return jsonify({"error": "locationIds and gtinUpc are required"}), 400
    
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer { token_cache['access_token']}"
    }
    
    results = []
    
    for location_id in location_ids:
        response = requests.get(f"https://api-ce.kroger.com/v1/products/00{gtinUpc[:-1]}?filter.locationId={location_id}", headers=headers)
        
        print("Kroger API Request URL:", response.url, flush=True)
        
        if response.status_code == 200:
            try:
                kroger_data = response.json()
                if "data" in kroger_data and "items" in kroger_data["data"] and len(kroger_data["data"]["items"]) > 0:
                    price = kroger_data["data"]["items"][0].get("price", {}).get("regular", "n/a")
                    results.append({
                        "locationId": location_id,
                        "price": price
                    })
            except (KeyError, IndexError, TypeError, ValueError) as e:
                print(f"Error parsing Kroger API response: {e}", flush=True)
    
    return jsonify(results)


FOOD_LOG = 'food_intake'  # new mongoDB collection for food storage logs. note: initializes the first time it is inserted into


@app.route("/api/log_food", methods=["GET", "POST", "DELETE"])
def log_food():
    # connect to 'food_log' collection in mongodb
    food_collection = data.atlas_client.get_collection(FOOD_LOG)
    
    if request.method == 'POST':
        # get food intake data from frontend
        log_data = request.get_json()
        # adding logs for debugging
        # print("data from frontend:", log_data)
        
        # food logging fields
        required_fields = ['email', 'fdcId', 'productName', 'servingSize', 'mealType', 'timestamp']
            
        # if returned dictionary in log_data does not contain all of the required fields
        if not all(field in log_data for field in required_fields):
            return jsonify({"message": "missing some required field :("}), 400
        
        # extract the date from timestamp
        try:
            # Replace 'Z' with '+00:00' for compatibility with datetime.fromisoformat
            timestamp = log_data["timestamp"]
            if timestamp.endswith("Z"):
                timestamp = timestamp.replace("Z", "+00:00")
            
            # Parse the timestamp and extract the date
            log_date = datetime.fromisoformat(timestamp).date().isoformat()
            # print("log_date:", log_date)  # Debug log
        except Exception as e:
            print("problem parsing timestamp:", str(e))
            return jsonify({"message": "invalid timestamp format"}), 400
        
        # set vars for JSON to insert into mongoDB appropriately
        meal_type = log_data["mealType"].lower()
        email = log_data["email"]
        
        # make sure a document exists for the user
        food_collection.update_one(
            {"email": email},
            {"$setOnInsert": {"email": email, "logs": {}, "dailyTotals": {}}},
            upsert=True
        )
        # print("Document ensured.")  # Debug log

        # create nested structure for the date
        food_collection.update_one(
            {"email": email, f"logs.{log_date}": {"$exists": False}},
            {"$set": {f"logs.{log_date}": {"meals": {}}}}
        )
        # print(f"Date structure ensured for {log_date}.")  # Debug log

        # meal type array structure
        food_collection.update_one(
            {"email": email, f"logs.{log_date}.meals.{meal_type}": {"$exists": False}},
            {"$set": {f"logs.{log_date}.meals.{meal_type}": []}}
        )
        # print(f"Meal type structure ensured for {meal_type}.")  # Debug log
        
        try:
            # push log into the correct meal type array
            food_collection.update_one(
                {"email": email},
                {"$push": {f"logs.{log_date}.meals.{meal_type}": log_data}}
            )
            # print("Log pushed into meal type array.")  # Debug log
            
            # get nutritional data from log_data 
            nutrition = log_data.get("nutrition", {})
            # print("Nutrition data:", nutrition)  # Debug log
        
            # update daily totals for calories if nutrition data exists
            if nutrition:
                inc_fields = {}
                for key, value in nutrition.items():
                    try:
                        numeric_value = float(value)
                        inc_fields[f"dailyTotals.{key}"] = numeric_value
                    except Exception:
                        # print(f"Skipping invalid nutrition value for {key}: {value}.")  # Debug log
                        pass
                if inc_fields:
                    food_collection.update_one(
                        {"email": email},
                        {"$inc": inc_fields}
                    )
                    # print("Daily totals updated.")  # Debug log
            
            # Retrieve and print the updated document for debugging
            updated_document = food_collection.find_one({"email": email})
            print("Updated document:", updated_document, flush=True)        
                    
            return jsonify({"message": "food log added successfully :)"}), 200
        except Exception as e:
            print("POST error:", str(e))
            # traceback.print_exc()  # Uncomment for detailed error traceback during debugging
            return jsonify({"message": "error logging food"}), 500
        
# --- MODIFIED WEIGHT LOG ROUTES ---
# These routes assume the global 'data' object (instance of datauser)
# and the FOOD_LOG constant are defined as above

@app.route('/api/user/weight_log', methods=['POST'])
def add_weight_log_route(): 
    log_data = request.get_json() # Using 'log_data' 
    email = log_data.get('email')
    weight_str = log_data.get('weight')
    
    # Use current date as YYYY-MM-DD for the log key
    log_date_iso = datetime.now().date().isoformat()

    if not email or weight_str is None:
        return jsonify({"message": "Email and weight are required"}), 400

    if not data.isUser(json.dumps({"email": email})): # data is global datauser instance
         return jsonify({"message": "User not found"}), 404

    try:
        weight_val = float(weight_str)
        if weight_val <= 0:
             return jsonify({"message": "Invalid weight value"}), 400

        food_collection = data.atlas_client.get_collection(FOOD_LOG)
        
        # Ensure the user's document, the 'logs' object, and the specific date entry exist.
        # Then set/update the weight for that day.
        # Using $set on a nested field will create intermediate objects if they don't exist,
        # but only if the parent document (the user's email doc) already exists.
        
        food_collection.update_one(
            {"email": email},
            {
                "$setOnInsert": {"email": email, "logs": {}, "dailyTotals": {}}
            },
            upsert=True # Create the user document in FOOD_LOG if it doesn't exist
        )

        # Now, set the weight for the specific date.
        # when we $set a field within it (like `logs.<date_str>.weight`).
        food_collection.update_one(
            {"email": email},
            {"$set": {f"logs.{log_date_iso}.weight": weight_val}}
        )

        print(f"Updated/Inserted weight for {email} on {log_date_iso}: {weight_val}", flush=True)
        return jsonify({"message": "Weight logged successfully"}), 200

    except ValueError:
        return jsonify({"message": "Invalid weight format, must be a number"}), 400
    except Exception as e:
        print(f"Error in add_weight_log_route: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Internal server error logging weight"}), 500

@app.route('/api/user/weight_history', methods=['GET'])
def get_weight_history_route(): # Retaining original function name
    email = request.args.get('email')
    if not email:
        return jsonify({"message": "Email query parameter is required"}), 400

    if not data.isUser(json.dumps({"email": email})):
         return jsonify({"message": "User not found"}), 404

    try:
        food_collection = data.atlas_client.get_collection(FOOD_LOG)
        user_document = food_collection.find_one({"email": email}) 

        if not user_document or "logs" not in user_document:
            return jsonify({"labels": [], "data": []}), 200

        weight_entries = []
        # Iterate through the dates (keys) in the user_document['logs'] object
        for date_str, daily_data in user_document["logs"].items(): 
            # Check if daily_data is a dictionary and contains a 'weight' key
            if isinstance(daily_data, dict) and "weight" in daily_data and daily_data["weight"] is not None:
                try:
                    # Validate date string format before adding
                    datetime.strptime(date_str, '%Y-%m-%d')
                    weight_entries.append({"date": date_str, "weight": daily_data["weight"]})
                except ValueError:
                    # This handles cases where a key in 'logs' might not be a valid date string
                    print(f"Warning: Invalid date format '{date_str}' found in logs for user {email}. Skipping.")


        if not weight_entries:
            return jsonify({"labels": [], "data": []}), 200

        # Sort entries by date string (lexicographical sort works for YYYY-MM-DD)
        # For more robust date sorting, convert to datetime objects first
        def get_date_for_sort(entry):
            try:
                return datetime.strptime(entry['date'], '%Y-%m-%d')
            except ValueError:
                # Should not happen if we validated above, but as a fallback
                return datetime.min # Or handle error appropriately

        sorted_weight_entries = sorted(weight_entries, key=get_date_for_sort)
        
        labels = [entry['date'] for entry in sorted_weight_entries]
        weights = [entry['weight'] for entry in sorted_weight_entries]

        return jsonify({"labels": labels, "data": weights}), 200
    except Exception as e:
        print(f"Error in get_weight_history_route: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Internal server error fetching weight history"}), 500
    
@app.route('/api/user/weight_log', methods=['DELETE'])
def delete_last_weight_log_entry_route(): # Retaining original function name
    email = request.args.get('email')
    if not email:
        return jsonify({"message": "User email is required"}), 400
    
    if not data.isUser(json.dumps({"email": email})):
         return jsonify({"message": "User not found"}), 404

    try:
        food_collection = data.atlas_client.get_collection(FOOD_LOG)
        user_document = food_collection.find_one({"email": email}) 

        if not user_document or "logs" not in user_document:
            return jsonify({"message": "No logs found for this user"}), 404

        most_recent_date_with_weight = None
        # Iterate through the logs to find the most recent date with a weight entry
        for date_str, daily_data in user_document["logs"].items(): 
            if isinstance(daily_data, dict) and "weight" in daily_data and daily_data["weight"] is not None:
                try:
                    # Validate date string before comparison
                    current_log_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    if most_recent_date_with_weight is None:
                        most_recent_date_with_weight = date_str
                    else:
                        # Compare with existing most_recent_date_with_weight
                        if current_log_date > datetime.strptime(most_recent_date_with_weight, '%Y-%m-%d').date():
                            most_recent_date_with_weight = date_str
                except ValueError:
                    print(f"Warning: Invalid date format '{date_str}' found in logs for user {email} during delete operation. Skipping.")

        if not most_recent_date_with_weight:
            return jsonify({"message": "No weight entries found to delete"}), 404

        # Unset the weight field for that specific date
        update_result = food_collection.update_one(
            {"email": email},
            {"$unset": {f"logs.{most_recent_date_with_weight}.weight": ""}}
        )

        if update_result.modified_count == 1:
            return jsonify({"message": f"Weight entry for {most_recent_date_with_weight} deleted successfully"}), 200
        else:
            # This case means the $unset operation didn't modify anything.
            print(f"Debug DELETE: No modification for email {email}, date {most_recent_date_with_weight}. Update result: {update_result.raw_result}")
            return jsonify({"message": "Failed to delete weight entry (it may have already been removed or path was incorrect)"}), 404 
            
    except Exception as e:
        print(f"Error in delete_last_weight_log_entry_route: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Internal server error deleting weight entry"}), 500
    
if __name__ == '__main__':
    app.run(debug=True)