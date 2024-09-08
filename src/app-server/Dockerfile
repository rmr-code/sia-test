FROM python:3.12-slim

# Working Dir
WORKDIR /app

# Copy backend files
COPY ./backend/requirements.txt /app

# Install backend dependencies
RUN pip install  --no-cache-dir --upgrade -r /app/requirements.txt

# Copy python code 
COPY ./backend /app

# Copy react build files to 
COPY ./frontend/dist /app/dist

# set port
EXPOSE 8080

# Use Flask for development
#CMD ["flask", "run", "--host=0.0.0.0", "--port=8000", "--reload"]
# Use Gunicorn as the WSGI HTTP server for production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "app:app", "--reload"]
