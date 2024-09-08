FROM python:3.12-slim

# Copy backend files
COPY ./requirements.txt .

# Install backend dependencies
RUN pip install  --no-cache-dir --upgrade -r requirements.txt

# Copy python code 
COPY . .

# set port
EXPOSE 8000

# start the uvicorn server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
