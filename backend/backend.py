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

# Load environment variables from a .env file
load_dotenv()

##the authenticator produces output of form 
##    { "id": "1234", "given_name": "John", "name": "John Doe", "email": "john_doe@idp.example" }
## for now we can just store that whole thing, we will use the email as the indexing entity tho because theoretically we might want to support email password logins
##
ATLAS_URI="mongodb+srv://pythhon:8x5pGda7EWdKGtV0@nomcents.5fhvz.mongodb.net/?retryWrites=true&w=majority&appName=nomcents"
DB_NAME = 'users'
COLLECTION_NAME = 'users_test'
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

@app.route('/api/search', methods=['GET'])
def search_product():
    get_kroger_token()
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
 
    # Only add brandOwner to params if it's not an empty string
    if brand_owner != "" and brand_owner is not None:
        params["brandOwner"] = brand_owner
 
    print(
        "Search parameters:", params, flush=True
    )  # Debug print to check the parameters being sent to the API
 
    # error checking, 400 = bad request
    if not query:
        return jsonify({"error": "did not enter search query :("}), 400
 
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
            "Authorization": f"Bearer { token_cache["access_token"]}"
        }
        
        for food in foods:
            res = requests.get(f"https://api-ce.kroger.com/v1/products/00{food.get("gtinUpc")[:-1]}?filter.locationId=01400376", headers=headers)
            price="n/a"
            print("Response status code:", res.status_code, flush=True)
            if res.status_code == 200:
                try:
                    kroger_data = res.json()
                    if "data" in kroger_data and "items" in kroger_data["data"] and len(kroger_data["data"]["items"]) > 0:
                        price = kroger_data["data"]["items"][0].get("price", {}).get("regular", "n/a")
                        print("Price:", price, flush=True)
                except (KeyError, IndexError, TypeError, ValueError) as e:
                    print(f"Error parsing Kroger API response: {e}", flush=True)

            # If show_only_priced is true, skip products with no price
            if show_only_priced and price == "n/a":
                continue
        
            # need these parameters for image querying
            name = food.get("description", "Unknown")
            brandOwner = food.get("brandOwner", "Unknown")
            brandName = food.get("brandName", "N/A")
    
            # get image url using google search api
            # image_url = get_product_image(name, brand)
    
            food_info = {
                "fdcId": food.get("fdcId"),
                # Add barcode for matching prices to products
                "gtinUpc": food.get("gtinUpc", "N/A"),
                "name": name,
                "price": price,
                "brandOwner": brandOwner,
                "brandName": brandName,
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

if __name__ == '__main__':
    app.run(debug=True)