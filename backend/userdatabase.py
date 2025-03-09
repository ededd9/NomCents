from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json

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
       
   
class datauser():
    def __init__(self,atlas_uri, dbname, collection_name):
        self.atlas_client = AtlasClient (ATLAS_URI, DB_NAME)
        self.atlas_client.ping()
        print ('Connected to Atlas instance! We are good to go!')
        self.collection_name=collection_name
    def userLookup (self,userString):
       userdet=json.loads(userString)
       collection = self.database[self.collection_name]
       user = collection.find_one({"email":userdet['email']})
       return user
    def isUser(self,userstring):
        user = self.userLookup (userString='{"email":"'+ input("Enter email: ")+'\"}')
        if(not (user is None)):
            return True
        else:
            return False
    def makeUser(self,email,name):
        usstring=('{"email":"'+ email+'\"}')
        if(not data.isUser(usstring)):
            self.atlas_client.insWrapper({"name":name, "email":email})
        else:
            print("failure user exists")




data = datauser (ATLAS_URI, DB_NAME,COLLECTION_NAME)
print ('Connected to Atlas instance! We are good to go!')
email=input("Enter email: ")
usstring=('{"email":"'+ email+'\"}')
if(data.isUser(usstring)):
    user=data.userLookup(usstring)
    print("username is "+ user['name'])
else:
    print("user not found, create user now")
    name = input("Enter name: ")
    data.makeUser(email,name)
print(data.isUser(usstring))