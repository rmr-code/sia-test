from flask import Flask, request, jsonify, make_response, send_from_directory, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, unset_jwt_cookies, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import shutil
import re
import requests
from datetime import timedelta, datetime
from models import Agent, User
from database import db
import os
import threading


app = Flask(__name__, static_folder='dist/assets', template_folder='dist')

# Load configuration from config.py
app.config.from_object('config.Config')

# Initialize CORS with allowed origins from the environment variable
CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ALLOWED_ORIGINS'].split(',')}}, supports_credentials=True)

# Initialize database
db.init_app(app)

# Initialize JWT Manager
jwt = JWTManager(app)

# Set JWT to be stored in cookies
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Disable CSRF protection for simplicity (should be enabled in production)
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'  # Cookie path

# Set the duration for JWT tokens
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=app.config['ACCESS_TOKEN_EXPIRE_MINUTES'])

# Create tables when the app starts (no migrations needed)
with app.app_context():
    db.create_all()

# Helper function to save files
def save_files(agent_name, files):
    # Create the directory for the agent if it doesn't exist
    agent_dir = os.path.join(app.config['AGENTS_DIR'], agent_name)
    if not os.path.exists(agent_dir):
        os.makedirs(agent_dir)

    saved_files = []
    for file in files:
        filename = secure_filename(file.filename)
        file_path = os.path.join(agent_dir, filename)
        file.save(file_path)
        saved_files.append(filename)
    
    return saved_files

# Helper function to delete files
def delete_files(agent_name, files_to_delete):
    agent_dir = os.path.join(app.config['AGENTS_DIR'], agent_name)
    deleted_files = []
    for filename in files_to_delete:
        file_path = os.path.join(agent_dir, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            deleted_files.append(filename)
    
    return deleted_files

# Helper function to get all files for a given agent
def get_all_files(agent_name):
    agent_dir = os.path.join(app.config['AGENTS_DIR'], agent_name)
    if not os.path.exists(agent_dir):
        return []

    # Return the full paths of all files in the agent's directory
    return [os.path.join(agent_dir, f) for f in os.listdir(agent_dir) if os.path.isfile(os.path.join(agent_dir, f))]

# Helper function to sanitize agent name
def sanitize_agent_name(name):
    # Convert to lowercase
    name = name.lower()
    # Remove any character that is not a letter, digit, or hyphen
    name = re.sub(r'[^a-z0-9-]', '', name)
    return name

# Helper function to call the embeddings server in a separate thread
def trigger_embeddings_generation(agent_name):
    def generate_embeddings_task():
        try:
            # Call the embeddings server to start generating embeddings
            response = requests.post(f"http://embeddings-server:{app.config['EMBEDDINGS_SERVER_PORT']}/generate", json={"agent_name": agent_name})
            # do not wait for response
        except Exception as e:
            print(f"Error during embeddings generation for agent {agent_name}: {str(e)}")

    # Run the task in a separate thread
    threading.Thread(target=generate_embeddings_task).start()

# Helper function to compose the LLM request
def compose_request(instruction, document_chunks, history, user_prompt):
    """
    Combines the instruction, document chunks, history, and user prompt into a complete prompt
    for an LLM (vLLM, Ollama, or OpenAI-compatible API).
    
    :param instruction: The main system instruction to the LLM (e.g., "You are a Teacher...").
    :param document_chunks: A list of document chunks relevant to the conversation.
    :param history: A list of past user prompts and system responses (as a list of dictionaries).
    :param user_prompt: The latest user input or question.
    
    :return: A formatted list of messages to be used for LLM completion API.
    """
    
    # Start with the instruction as the system message
    messages = [
        {"role": "system", "content": instruction}
    ]
    
    # Add document chunks as a system message (summarizing or presenting document context)
    if document_chunks:
        chunked_documents = "\n\n".join(document_chunks)
        messages.append({
            "role": "system",
            "content": f"The following document chunks are relevant:\n{chunked_documents}"
        })
    
    # Add the past history of user prompts and system responses
    for entry in history:
        if "user" in entry:
            messages.append({"role": "user", "content": entry["user"]})
        if "assistant" in entry:
            messages.append({"role": "assistant", "content": entry["assistant"]})
        if "system" in entry:
            messages.append({"role": "system", "content": entry["system"]})
    
    # Add the latest user prompt
    messages.append({"role": "user", "content": user_prompt})
    
    return messages

# Helper function to call the vllm server
def send_prompt_vllm(messages):
    print(41)
    try:
        # Call the vLLM API using requests
        BASE_URL = f"http://llm-server:{app.config['LLM_SERVER_PORT']}/v1"
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            json={
                "model": app.config['LLM_MODEL_NAME'],  # Replace with your model's name
                "messages": messages
            }
        )
        print(42)
        response.raise_for_status()
        print(43)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(44, str(e))
        raise Exception(f"Error connecting to vLLM server: {str(e)}")

# now the routes

# to check if the admin password has been set
@app.route('/api/auth/is-admin-password-set', methods=['GET'])
def is_admin_password_set():

    # Check for custom header
    if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
        return jsonify({"error": "Access denied"}), 403
    
    # Query the database for a user with the username 'admin'
    admin_user = User.query.filter_by(username='admin').first()

    # Check if the user exists and has a hashed password
    if admin_user and admin_user.hashed_password:
        return jsonify({'admin_password_set': True}), 200
    else:
        return jsonify({'admin_password_set': False}), 200

# to check jwt token
@app.route('/api/auth/check-token', methods=['GET'])
def check_jwt_token():
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403
        # Check for token
        verify_jwt_in_request()
        # If jwt passes, we can retrieve the identity from the token
        current_user = get_jwt_identity()
        return jsonify({"msg": "Token is valid", "user": current_user}), 200
    except Exception as e:
        return jsonify({"msg": "Token is invalid / missing"}), 401

# to set the admin password
@app.route('/api/auth/set-admin-password', methods=['POST'])
def set_admin_password():
    # Check for custom header
    if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
        return jsonify({"error": "Access denied"}), 403

    # Get the password from the request
    password = request.json.get('password', '')

    # Check if the password is empty
    if not password:
        return jsonify({"msg": "Password cannot be blank"}), 400

    # Check if the admin user already exists
    admin_user = User.query.filter_by(username='admin').first()
    if admin_user:
        return jsonify({"msg": "Admin user already exists"}), 400

    # Hash the password
    hashed_password = generate_password_hash(password)
    # Create a new admin user

    new_admin = User(username='admin', hashed_password=hashed_password, created_at=datetime.now())
    # Add the new admin user to the database

    db.session.add(new_admin)
    db.session.commit()

    return jsonify({"msg": "Admin password set successfully"}), 201

# to login the user
@app.route('/api/auth/login', methods=['POST'])
def login():
    # Check for custom header
    if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
        return jsonify({"error": "Access denied"}), 403
    # Get the username and password from the request body
    username = request.json.get('username', '')
    password = request.json.get('password', '')
    # Check if the username and password are provided
    if not username or not password:
        return jsonify({"msg": "Username and password cannot be blank"}), 400
    # Query the database for the user
    user = User.query.filter_by(username=username).first()
    # If the user does not exist or the password is incorrect, return an error
    if not user or not check_password_hash(user.hashed_password, password):
        return jsonify({"msg": "Invalid username or password"}), 401

    # Create a JWT token
    access_token = create_access_token(identity={'username': user.username})

    # Set the token in an HTTP-only cookie
    response = make_response(jsonify({"msg": "Login successful"}), 200)
    response.set_cookie('access_token_cookie', access_token, httponly=True, max_age=60*60*24)  # 24 hours
    return response

# to update the admin password
@app.route('/api/auth/change-admin-password', methods=['POST'])
def change_admin_password():
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403

        # verify token has been
        verify_jwt_in_request()
        # Get the current and new passwords from the request body
        current_password = request.json.get('current_password', '')
        new_password = request.json.get('new_password', '')

        # Ensure the passwords are not blank
        if not current_password or not new_password:
            return jsonify({"msg": "Current password and new password cannot be blank"}), 400

        # Get the current user's identity from the JWT token
        current_user = get_jwt_identity()

        # Check if the current user is the admin
        if current_user.get('username') != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        # Query the database for the admin user
        admin_user = User.query.filter_by(username='admin').first()

        if not admin_user:
            return jsonify({"msg": "Admin user not found"}), 404

        # Validate the current password
        if not check_password_hash(admin_user.hashed_password, current_password):
            return jsonify({"msg": "Current password is incorrect"}), 400

        # Hash the new password
        hashed_password = generate_password_hash(new_password)

        # Update the admin's password in the database
        admin_user.hashed_password = hashed_password
        admin_user.updated_at = datetime.now()
        db.session.commit()

        return jsonify({"msg": "Admin password changed successfully"}), 200
    except Exception as e:
        return jsonify({"msg": f"Error: {str(e)}"}), 500
    
# to logout
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403
    
        #verify_jwt_in_request()
        # Create a response
        response = make_response(jsonify({"msg": "Logout successful"}), 200)
        
        # Clear the JWT token from the HTTP-only cookie
        unset_jwt_cookies(response)
        
        return response
    except Exception as e:
        print(str(e), flush=True)
        return jsonify({"msg": "Invalid action"}), 401

# agents list
@app.route('/api/agents', methods=['GET'])
def list_agents():
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403
        if verify_jwt_in_request(optional=True) == None:
            return jsonify({"error": "Access denied"}), 403
        # Query the database for all agents
        agents = Agent.query.all()
        # Prepare the list of agents to return
        agents_list = [
            {
                "id": agent.id,
                "name": agent.name,
                "status": agent.status,
                "embeddings_status": agent.embeddings_status,
            }
            for agent in agents
        ]

        # Return the list of agents as JSON
        return jsonify(agents_list), 200
    
    except Exception as e:
        return jsonify({"msg": "Unauthorized action"}), 401

# POST method for creating a new agent
@app.route('/api/agents', methods=['POST'])
def create_agent():
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403

        # first ensure that valid jwt token has been sent
        verify_jwt_in_request()
        # then get the data sent
        name = request.form.get('name')
        # Sanitize the name
        sanitized_name = sanitize_agent_name(name)
        # get other info
        instructions = request.form.get('instructions', '')
        welcome_message = request.form.get('welcome_message', '')
        suggested_prompts = []
        if request.form.get('suggested_prompts'):
            suggested_prompts = request.form.getlist('suggested_prompts')        
        status = request.form.get('status', 'D')

        # Ensure the agent name is unique
        existing_agent = Agent.query.filter_by(name=name).first()
        if existing_agent:
            return jsonify({"msg": "Agent with this name already exists"}), 400

        new_agent = Agent(name=sanitized_name, instructions=instructions, welcome_message=welcome_message,suggested_prompts=suggested_prompts, status=status, created_at=datetime.now(), updated_at=datetime.now())

        db.session.add(new_agent)
        db.session.commit()

        return jsonify({"msg": "Agent created successfully", "name": new_agent.name}), 201
    except Exception as e:
        print(str(e))
        return jsonify({"msg": f"Error creating agent: {str(e)}"}), 500

# PUT method for updating an existing agent
@app.route('/api/agents/<string:agent_name>/info', methods=['PUT'])
def update_agent_info(agent_name):
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403

         # first ensure that valid jwt token has been sent
        verify_jwt_in_request()
        # Find the agent by name
        agent = Agent.query.filter_by(name=agent_name).first()
        if not agent:
            return jsonify({"msg": "Agent not found"}), 404

        # Update agent's instructions and welcome_message
        agent.instructions = request.form.get('instructions', agent.instructions)
        agent.welcome_message = request.form.get('welcome_message', agent.welcome_message)
        # handle suggested prompts differently because its an array
        agent.suggested_prompts = []
        if request.form.get('suggested_prompts'):
            agent.suggested_prompts = list(set(request.form.getlist('suggested_prompts')))
        # updated status and updated_at   
        agent.status = request.form.get('status', agent.status)
        agent.updated_at=datetime.now()

        # Save changes to the database
        db.session.commit()

        return_response = {
            "name": agent.name,
            "instructions": agent.instructions,
            "welcome_message": agent.welcome_message,
            "suggested_prompts": agent.suggested_prompts,
            "files": agent.files,
            "status": agent.status,
            "embeddings_status": agent.embeddings_status
        }

        return jsonify(return_response), 200
    except Exception as e:
        return jsonify({"msg": f"Error updating agent: {str(e)}"}), 500

# PUT method for updating an existing agent documents
@app.route('/api/agents/<string:agent_name>/files', methods=['PUT'])
def update_agent_files(agent_name):
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403

         # first ensure that valid jwt token has been sent
        verify_jwt_in_request()

        # Find the agent by name
        agent = Agent.query.filter_by(name=agent_name).first()
        if not agent:
            return jsonify({"msg": "Agent not found"}), 404

        # Handle file deletions using the helper function
        deleted_files = request.form.getlist('deletedfiles')
        if deleted_files:
            delete_files(agent_name, deleted_files)

         # Save new files and update the agent's documents list
        new_files = request.files.getlist('newfiles')
        saved_files = save_files(agent_name, new_files) if new_files else []

        # Ensure agent.files is initialized as a list if it's None
        if agent.files is None:
            agent.files = []

        agent.files = [file for file in agent.files if file not in deleted_files] + saved_files
        # Update the agent's files list (remove deleted files, add new ones)
        agent.files = [file for file in agent.files if file not in deleted_files] + saved_files
        # Ensure no duplicate files in agent.files
        agent.files = list(set(agent.files))
        # set updated filed
        agent.updated_at=datetime.now()
        # set embedded status to In progress
        agent.embeddings_status="I"
        # Save changes to the database
        db.session.commit()

        # Trigger embeddings_generation
        trigger_embeddings_generation(agent_name)

        # Return response
        return_response = {
            "name": agent.name,
            "instructions": agent.instructions,
            "welcome_message": agent.welcome_message,
            "suggested_prompts": agent.suggested_prompts,
            "files": agent.files,
            "status": agent.status,
            "embeddings_status": agent.embeddings_status
        }

        return jsonify(return_response), 200
    except Exception as e:
        print(str(e))
        db.session.rollback()
        return jsonify({"msg": f"Error updating agent: {str(e)}"}), 500

# GET method for retrieving an agent's details by agent_name
@app.route('/api/agents/<string:agent_name>', methods=['GET'])
def get_agent(agent_name):
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403

         # first ensure that valid jwt token has been sent
        verify_jwt_in_request()
        # Find the agent by name
        agent = Agent.query.filter_by(name=agent_name).first()
        if not agent:
            return jsonify({"msg": "Agent not found"}), 404

        # Prepare the agent's details to return
        agent_details = {
            "name": agent.name,
            "instructions": agent.instructions,
            "welcome_message": agent.welcome_message,
            "suggested_prompts": agent.suggested_prompts,
            "status": agent.status,
            "embeddings_status": agent.embeddings_status,
            "files": agent.files  # List of filenames
        }

        return jsonify(agent_details), 200
    except Exception as e:
        return jsonify({"msg": f"Error retrieving agent: {str(e)}"}), 500

# DELETE method for deleting an agent by name
@app.route('/api/agents/<string:agent_name>', methods=['DELETE'])
def delete_agent(agent_name):
    try:
        # Check for custom header
        if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
            return jsonify({"error": "Access denied"}), 403

         # first ensure that valid jwt token has been sent
        verify_jwt_in_request()
        # Find the agent by name
        agent = Agent.query.filter_by(name=agent_name).first()
        if not agent:
            return jsonify({"msg": "Agent not found"}), 404

        # Remove the directory and all files associated with the agent
        agent_dir = os.path.join(app.config['AGENTS_DIR'], agent_name)
        if os.path.exists(agent_dir):
            shutil.rmtree(agent_dir)  # Recursively delete the directory and its contents

        # Delete the agent record from the database
        db.session.delete(agent)
        db.session.commit()

        return jsonify({"msg": f"Agent '{agent_name}' deleted successfully"}), 200
    except Exception as e:
        return jsonify({"msg": f"Error deleting agent: {str(e)}"}), 500

@app.route('/api/agents/<string:agent_name>/update-embeddings-status', methods=['POST'])
def update_embeddings_status(agent_name):
    try:
        agent = Agent.query.filter_by(name=agent_name).first()
        if not agent:
            return jsonify({"msg": "Agent not found"}), 404

        # Update the embeddings status to blank (or any other status as needed)
        agent.embeddings_status = ""
        db.session.commit()

        return jsonify({"msg": "Embeddings status updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error updating embeddings status: {str(e)}"}), 500


# GET method for retrieving an agent's details required by Chat with no auth
@app.route('/api/chat/<string:agent_name>', methods=['GET'])
def get_agent_for_chat(agent_name):
     # Check for custom header
    if request.headers.get('X-Requested-With') != app.config['HEADER_KEY']:
        return jsonify({"error": "Access denied"}), 403

    try:
        # Find the agent by name
        agent = Agent.query.filter_by(name=agent_name).first()
        if not agent:
            return jsonify({"msg": "Agent not found"}), 404

        # Prepare the agent's details to return
        agent_details = {
            "name": agent.name,
            "welcome_message": agent.welcome_message,
            "suggested_prompts": agent.suggested_prompts,
            "status": agent.status,
        }

        return jsonify(agent_details), 200
    except Exception as e:
        return jsonify({"msg": f"Error retrieving agent: {str(e)}"}), 500

@app.route('/api/chat/<string:agent_name>', methods=['POST'])
def chat_completion(agent_name):
    try:
         # Find the agent by name
        agent = Agent.query.filter_by(name=agent_name).first()
        if not agent:
            return jsonify({"msg": "Agent not found"}), 404
        
        # convert request
        data = request.json
        # extract input and past history
        input = data['input']
        messages = data['messages']

        # Call the embeddings server to query for document chunks
        response = requests.post(f'http://embeddings-server:{app.config['EMBEDDINGS_SERVER_PORT']}/query', json={"agent_name": agent_name, "prompt": input})
        response_json = response.json()
        document_chunks = response_json['results']
        document_text_array = [chunk.replace('\n', ' ') for sublist in document_chunks for chunk in sublist]

        # compose request
        messages = compose_request(agent.instructions, document_text_array, messages, input)

        # call LLM server
        llm_response = send_prompt_vllm(messages)

        # return to browser
        return  jsonify({"success": True, "content": llm_response.choices[0].message["content"], "role": llm_response.role})
    except Exception as e:
        return jsonify({"success": False, "content": str(e), "role":"assistant"})


# static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)