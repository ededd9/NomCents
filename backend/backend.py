from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
from flask import Flask, abort, jsonify,request
import requests, math
from flask_cors import CORS
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import re
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
    elif request.method== 'PUT':
        udat=request.get_json()
        if data.editUser(udat):
                return jsonify({"message": "User updated successfully"}), 200
 
        else:
            abort(404)

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
    # Adding filtering query params with default values (if applicable)
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
    
    # if no products found
    if not foods:
        return jsonify({"error": "no products found :("}), 404
    
    # format product data
    results = []
    for food in foods:
        # need these parameters for image querying
        name = food.get("description", "Unknown")
        brandOwner = food.get("brandOwner", "Unknown")
        brandName = food.get("brandName", "N/A")
        
        # get image url using google search api
        # image_url = get_product_image(name, brand)
        
        food_info = {
            "fdcId": food.get("fdcId"),
            "name": name,
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