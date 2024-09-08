import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_index.core.text_splitter import TokenTextSplitter
from llama_index.core.readers.file.base import SimpleDirectoryReader
from sentence_transformers import SentenceTransformer
import chromadb
import httpx
import asyncio

# Constants from environment variables
AGENT_DIR = os.path.join(os.getenv("DATA_DIR"), "agents")
MODEL_DIR = os.path.join(os.getenv("DATA_DIR"), "models")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")
CHROMA_DB_DIR = os.path.join(os.getenv("DATA_DIR"), "store")
HF_API_TOKEN = os.getenv("HF_API_TOKEN")  

# Initialize FastAPI app
app = FastAPI()

# Initialize the Hugging Face embedding model
embedding_model = SentenceTransformer(model_name_or_path=EMBEDDING_MODEL_NAME, cache_folder=MODEL_DIR, token=HF_API_TOKEN)

# Initialize the ChromaDB client
client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

# Request Models
class GenerateRequest(BaseModel):
    agent_name: str

class QueryRequest(BaseModel):
    agent_name: str
    prompt: str
    top_k: int = 5  # Default to 5 if not provided

# Helper function to notify app server
async def notify_app_server(agent_name: str):
    url = f"http://app-server:8080/api/agents/{agent_name}/update-embeddings-status"
    
    try:
        async with httpx.AsyncClient() as client:
            # Making the async POST request without body
            response = await client.post(url)
            
            # Optionally, check the response
            if response.status_code == 200:
                print(f"Successfully notified app-server for agent {agent_name}")
            else:
                print(f"Failed to notify app-server: {response.status_code}")
    except Exception as e:
        print(e)

# Step 1: /generate endpoint to process and store embeddings
@app.post("/generate")
async def generate_embeddings(request: GenerateRequest):
    agent_name = request.agent_name
    agent_dir = os.path.join(AGENT_DIR, agent_name)
    # Check if the agent's document directory exists
    if not os.path.exists(agent_dir):
        raise HTTPException(status_code=404, detail=f"Directory for agent {agent_name} not found")

    try:
        # Step 1: Load the documents from the agent's directory
        directory_reader = SimpleDirectoryReader(agent_dir)
        documents = directory_reader.load_data()

        # Step 2: Chunk documents with overlap (ignoring sentence/chapter boundaries)
        text_splitter = TokenTextSplitter(chunk_size=512, chunk_overlap=50)
        chunked_documents = []
        for doc in documents:
            chunks = text_splitter.split_text(doc.text)
            chunked_documents.extend(chunks)

        # Step 3: Generate embeddings for each chunk using the Hugging Face model
        embeddings = []
        for chunk in chunked_documents:
            vector = embedding_model.encode(chunk)
            embeddings.append(vector)

        # Step 4: Store the embeddings in ChromaDB
        collection_name = f"agent_{agent_name}"
        # Use get_or_create_collection to manage the collection
        collection = client.get_or_create_collection(name=collection_name)
        # Add each chunk with its embedding into ChromaDB
        for i, chunk in enumerate(chunked_documents):
            document_id = f"doc_chunk_{i}"
            collection.add(
                documents=[chunk],       # Chunked document text
                embeddings=[embeddings[i].tolist()],  # Embedding vector
                ids=[document_id]        # Unique ID for each chunk
            )

        # call app server as an async function
        asyncio.create_task(notify_app_server(agent_name))

        return {"status": "success", "message": f"Embeddings generated and stored for agent {agent_name}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing agent {agent_name}: {str(e)}")


# Step 2: /query endpoint to retrieve document chunks based on a prompt
@app.post("/query")
async def query_embeddings(request: QueryRequest):
    agent_name = request.agent_name
    prompt = request.prompt
    top_k = request.top_k

    try:
        # Step 1: Generate the embedding for the query prompt
        prompt_embedding = embedding_model.encode(prompt)

        # Step 2: Access the ChromaDB collection for the specified agent
        collection_name = f"agent_{agent_name}"
        collection = client.get_or_create_collection(name=collection_name)

        # Step 3: Query ChromaDB for the most relevant document chunks
        results = collection.query(
            query_embeddings=[prompt_embedding.tolist()],
            n_results=top_k  # Use the top_k parameter to retrieve the top 'k' results
        )

        # Extract and return the relevant document chunks
        document_chunks = results['documents']
        return {
            "status": "success",
            "agent_name": agent_name,
            "prompt": prompt,
            "results": document_chunks
        }
    
        # In the function calling the query apply the following
        #document_chunks = results['documents']
        #document_text_array = [chunk for sublist in document_chunks for chunk in sublist]



    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query for agent {agent_name}: {str(e)}")


# Step 3: Run the FastAPI app with Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
